import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { firstValueFrom, tap } from 'rxjs';

import { readApiErrorMessage, ToastService } from '@bruny/core';
import { AdminMediaApi, MediaImageResponse } from '@bruny/data-access';
import { ButtonComponent, ConfirmDialogComponent } from '@bruny/ui';

import { formatMegabytes, validateImageFile } from './image-file-validation';
import {
  DEFAULT_MAX_FILE_BYTES,
  DEFAULT_MAX_IMAGES,
  FALLBACK_ALLOWED_MIME_TYPES,
  type ProductImageItem,
  type UploadContext,
  type UploadQueueItem,
  type UploadStatus,
} from './product-images.types';

type MetadataChanges = Partial<Pick<ProductImageItem, 'alt' | 'variantColor'>>;

@Component({
  selector: 'app-product-images',
  standalone: true,
  imports: [ButtonComponent, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-images.component.html',
  styleUrl: './product-images.component.scss',
})
export class ProductImagesComponent {
  private readonly mediaApi = inject(AdminMediaApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly productId = input<string | null>(null);
  readonly productSlug = input('');
  readonly images = input<ProductImageItem[]>([]);
  readonly colors = input<string[]>([]);
  readonly disabled = input(false);

  readonly imagesChange = output<ProductImageItem[]>();
  readonly uploadingChange = output<boolean>();
  readonly dirtyChange = output<boolean>();

  readonly gallery = signal<ProductImageItem[]>([]);
  readonly queue = signal<UploadQueueItem[]>([]);
  readonly dragActive = signal(false);
  readonly draggingIndex = signal<number | null>(null);
  readonly dragOverIndex = signal<number | null>(null);
  readonly deleteTarget = signal<ProductImageItem | null>(null);
  readonly metadataSavingIds = signal<string[]>([]);
  readonly maxFileBytes = signal(DEFAULT_MAX_FILE_BYTES);
  readonly maxImages = signal(DEFAULT_MAX_IMAGES);
  readonly allowedMimeTypes = signal<string[]>([...FALLBACK_ALLOWED_MIME_TYPES]);
  readonly configError = signal('');
  readonly uploadColor = signal('');
  readonly urlFormOpen = signal(false);
  readonly newImageUrl = signal('');
  readonly newImageAlt = signal('');
  readonly newImageColor = signal('');
  readonly imageUrlError = signal('');

  private nextPosition = 0;
  private uploadContext: UploadContext | null = null;
  private forcedUpload = false;
  private readonly idleWaiters = new Set<() => void>();
  private readonly previewUrls = new Set<string>();
  private readonly objectUrlsAvailable = typeof URL.createObjectURL === 'function';

  readonly uploading = computed(() =>
    this.queue().some(
      (item) =>
        item.status === 'validating' || item.status === 'uploading' || item.status === 'processing',
    ),
  );
  readonly dirty = computed(
    () =>
      this.gallery().some((image) => !image.persisted) ||
      this.queue().some((item) => item.status !== 'success'),
  );
  readonly activeCount = computed(
    () =>
      this.gallery().length +
      this.queue().filter(
        (item) =>
          item.status === 'pending' ||
          item.status === 'validating' ||
          item.status === 'uploading' ||
          item.status === 'processing',
      ).length,
  );
  readonly failedCount = computed(
    () => this.queue().filter((item) => item.status === 'error').length,
  );
  readonly remainingSlots = computed(() => Math.max(0, this.maxImages() - this.activeCount()));
  readonly activeQueue = computed(() =>
    this.queue().filter(
      (item) =>
        item.status === 'validating' ||
        item.status === 'uploading' ||
        item.status === 'processing' ||
        item.status === 'pending',
    ),
  );
  readonly overallProgress = computed(() => {
    const active = this.queue().filter(
      (item) =>
        item.status === 'validating' || item.status === 'uploading' || item.status === 'processing',
    );
    if (active.length === 0) return 0;
    return Math.round(active.reduce((total, item) => total + item.progress, 0) / active.length);
  });
  readonly uploadColorOptions = computed(() => [
    { value: '', label: 'Toutes les couleurs' },
    ...this.colors().map((color) => ({ value: color, label: color })),
  ]);

  constructor() {
    effect(() => {
      const incoming = this.images();
      this.gallery.set(
        incoming.map((image, index) => ({
          ...image,
          thumbnailUrl: image.thumbnailUrl || image.url,
          position: index,
        })),
      );
      this.nextPosition = incoming.length;
    });
    effect(() => this.uploadingChange.emit(this.uploading()));
    effect(() => this.dirtyChange.emit(this.dirty()));

    this.destroyRef.onDestroy(() => {
      this.revokeAllPreviews();
      this.idleWaiters.clear();
    });

    void this.loadConfig();
  }

  async loadConfig(): Promise<void> {
    try {
      const config = await firstValueFrom(this.mediaApi.config());
      this.maxFileBytes.set(config.maxFileSizeBytes);
      this.maxImages.set(config.maxImagesPerProduct);
      this.allowedMimeTypes.set(config.allowedMimeTypes);
      this.configError.set('');
    } catch {
      // The backend revalidates every file; defaults only keep the UI usable.
      this.configError.set(
        'Les limites du serveur n’ont pas pu être chargées. Les valeurs par défaut sont appliquées.',
      );
    }
  }

  acceptAttribute(): string {
    return this.allowedMimeTypes().join(',');
  }

  maxSizeLabel(): string {
    return formatMegabytes(this.maxFileBytes());
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    void this.addFiles(files);
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    if (this.disabled()) return;
    this.dragActive.set(true);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.disabled()) return;
    this.dragActive.set(true);
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  onDragLeave(event: DragEvent): void {
    if (event.currentTarget === event.target) this.dragActive.set(false);
  }

  onDropFiles(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
    if (this.disabled()) return;
    void this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  openPicker(input: HTMLInputElement): void {
    if (!this.disabled()) input.click();
  }

  onDropzoneKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.openPicker(input);
  }

  private async addFiles(files: File[]): Promise<void> {
    if (this.disabled() || files.length === 0) return;
    let room = this.remainingSlots();

    for (const file of files) {
      if (room <= 0) {
        this.queue.update((items) => [
          ...items,
          this.erroredFile(file, `Ce produit a atteint la limite de ${this.maxImages()} images.`),
        ]);
        continue;
      }

      const validation = await validateImageFile(
        file,
        this.maxFileBytes(),
        this.allowedMimeTypes(),
      );
      const previewUrl = validation.mime ? this.createPreview(file) : null;
      const item: UploadQueueItem = {
        localId: this.localId(),
        file,
        fileName: file.name,
        fileSize: file.size,
        previewUrl,
        mimeType: validation.mime ?? '',
        alt: file.name.replace(/\.[^.]+$/, '').slice(0, 255),
        variantColor: this.uploadColor() || null,
        status: validation.error ? 'error' : 'pending',
        progress: 0,
        error: validation.error,
      };
      this.queue.update((items) => [...items, item]);
      if (!validation.error) room -= 1;
    }

    this.pump();
  }

  private erroredFile(file: File, error: string): UploadQueueItem {
    return {
      localId: this.localId(),
      file,
      fileName: file.name,
      fileSize: file.size,
      previewUrl: null,
      mimeType: '',
      alt: '',
      variantColor: this.uploadColor() || null,
      status: 'error',
      progress: 0,
      error,
    };
  }

  private localId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private createPreview(file: File): string | null {
    if (!this.objectUrlsAvailable) return null;
    try {
      const url = URL.createObjectURL(file);
      this.previewUrls.add(url);
      return url;
    } catch {
      return null;
    }
  }

  private revokePreview(item: UploadQueueItem): void {
    if (!item.previewUrl || !this.objectUrlsAvailable) return;
    URL.revokeObjectURL(item.previewUrl);
    this.previewUrls.delete(item.previewUrl);
  }

  private revokeAllPreviews(): void {
    if (!this.objectUrlsAvailable) return;
    for (const url of this.previewUrls) URL.revokeObjectURL(url);
    this.previewUrls.clear();
  }

  retry(item: UploadQueueItem): void {
    if (this.disabled() || item.status !== 'error') return;
    this.patchQueue(item.localId, { status: 'pending', error: null, progress: 0 });
    this.pump();
  }

  removeQueueItem(item: UploadQueueItem): void {
    if (this.uploading() && item.status !== 'pending' && item.status !== 'error') return;
    this.revokePreview(item);
    this.queue.update((items) => items.filter((entry) => entry.localId !== item.localId));
    this.resolveIfIdle();
  }

  clearCompleted(): void {
    this.queue.update((items) => items.filter((item) => item.status !== 'success'));
  }

  statusLabel(status: UploadStatus): string {
    switch (status) {
      case 'pending':
        return this.uploadContext || this.productId() ? 'En attente' : 'En attente du brouillon';
      case 'validating':
        return 'Vérification';
      case 'uploading':
        return 'Téléversement';
      case 'processing':
        return 'Optimisation';
      case 'success':
        return 'Ajoutée';
      case 'error':
        return 'Refusée';
    }
  }

  progressLabel(item: UploadQueueItem): string {
    if (item.status === 'validating') return 'Vérification du fichier…';
    if (item.status === 'uploading') return `Téléversement ${item.progress} %`;
    if (item.status === 'processing') return 'Optimisation et enregistrement…';
    if (item.status === 'pending') return 'En attente de l’enregistrement du brouillon.';
    return '';
  }

  /**
   * Uploads files staged before the first product save. The parent calls this
   * with the newly created product; the backend therefore never receives an
   * orphan signed upload for a product that does not exist.
   */
  async uploadPending(productId: string, productSlug: string): Promise<void> {
    this.uploadContext = { productId, productSlug };
    // Le parent désactive le formulaire pendant la sauvegarde ; le flush
    // explicite qui suit la création doit malgré tout envoyer les fichiers.
    this.forcedUpload = true;
    this.pump();
    if (!this.hasPendingWork()) return;
    await new Promise<void>((resolve) => {
      this.idleWaiters.add(resolve);
      this.resolveIfIdle();
    });
  }

  hasUnsavedChanges(): boolean {
    return this.dirty();
  }

  private pump(): void {
    if (this.disabled() && !this.forcedUpload) return;
    const context = this.resolvedContext();
    if (!context) return;

    const active = this.queue().filter(
      (item) =>
        item.status === 'validating' || item.status === 'uploading' || item.status === 'processing',
    ).length;
    const slots = Math.max(0, 2 - active);
    if (slots === 0) return;

    this.queue()
      .filter((item) => item.status === 'pending')
      .slice(0, slots)
      .forEach((item) => void this.uploadItem(item.localId, context));
  }

  private resolvedContext(): UploadContext | null {
    if (this.uploadContext) return this.uploadContext;
    const productId = this.productId();
    const productSlug = this.productSlug();
    return productId && productSlug ? { productId, productSlug } : null;
  }

  private async uploadItem(localId: string, context: UploadContext): Promise<void> {
    const item = this.queue().find((entry) => entry.localId === localId);
    if (!item || item.status !== 'pending') return;
    this.patchQueue(localId, { status: 'validating', progress: 0, error: null });

    try {
      const presigned = await firstValueFrom(
        this.mediaApi.presign({
          productSlug: context.productSlug,
          ...(item.variantColor ? { variantColor: item.variantColor } : {}),
          contentType: item.mimeType,
          declaredSize: item.file.size,
        }),
      );
      this.patchQueue(localId, { status: 'uploading', progress: 0 });
      await firstValueFrom(
        this.mediaApi.upload(presigned, item.file).pipe(
          tap((progress) => {
            const next = Math.max(0, Math.min(100, progress));
            const current = this.queue().find((entry) => entry.localId === localId);
            if (current?.status === 'uploading' && next > current.progress) {
              this.patchQueue(localId, { progress: next });
            }
          }),
        ),
      );
      this.patchQueue(localId, { status: 'processing', progress: 100 });

      const image = await firstValueFrom(
        this.mediaApi.confirm({
          key: presigned.key,
          productSlug: context.productSlug,
          ...(item.variantColor ? { variantColor: item.variantColor } : {}),
          position: this.nextPosition++,
          alt: item.alt,
        }),
      );
      this.addUploadedImage(image, item.alt);
      this.patchQueue(localId, { status: 'success', progress: 100 });
      this.revokePreview(item);
      this.patchQueue(localId, { previewUrl: null });
      this.toast.success(`« ${item.fileName} » a été ajoutée.`);
    } catch (error) {
      const message = readApiErrorMessage(
        error,
        'Le téléversement a échoué. Vérifiez le fichier puis réessayez.',
      );
      this.patchQueue(localId, { status: 'error', error: message });
    } finally {
      this.pump();
      this.resolveIfIdle();
    }
  }

  private addUploadedImage(image: MediaImageResponse, alt: string): void {
    this.emitGallery([
      ...this.gallery(),
      {
        id: image.id,
        url: image.url,
        thumbnailUrl: image.thumbnailUrl,
        alt: image.alt ?? alt,
        variantColor: image.variantColor,
        position: this.gallery().length,
        persisted: true,
      },
    ]);
  }

  private hasPendingWork(): boolean {
    return this.queue().some(
      (item) =>
        item.status === 'pending' ||
        item.status === 'validating' ||
        item.status === 'uploading' ||
        item.status === 'processing',
    );
  }

  private resolveIfIdle(): void {
    if (this.hasPendingWork()) return;
    for (const resolve of this.idleWaiters) resolve();
    this.idleWaiters.clear();
  }

  private patchQueue(localId: string, patch: Partial<UploadQueueItem>): void {
    this.queue.update((items) =>
      items.map((item) => (item.localId === localId ? { ...item, ...patch } : item)),
    );
  }

  private emitGallery(items: ProductImageItem[]): void {
    const normalized = items.map((image, index) => ({ ...image, position: index }));
    this.gallery.set(normalized);
    this.nextPosition = normalized.length;
    this.imagesChange.emit(normalized);
  }

  // ---------------------------------------------------------------- gallery

  colorOptionsFor(current: string | null): Array<{ value: string; label: string }> {
    const colors = [...this.colors()];
    if (current && !colors.includes(current)) colors.push(current);
    return [
      { value: '', label: 'Toutes les couleurs' },
      ...colors.map((color) => ({
        value: color,
        label: this.colors().includes(color) ? color : `${color} (retirée des variantes)`,
      })),
    ];
  }

  onAltBlur(image: ProductImageItem, event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    if (value === image.alt) return;
    void this.updateMetadata(image, { alt: value }, () => {
      (event.target as HTMLInputElement).value = image.alt;
    });
  }

  onImageColorChange(image: ProductImageItem, value: string): void {
    const color = value.trim() || null;
    if (color === image.variantColor) return;
    void this.updateMetadata(image, { variantColor: color });
  }

  private async updateMetadata(
    image: ProductImageItem,
    changes: MetadataChanges,
    rollbackInput?: () => void,
  ): Promise<void> {
    if (!image.id) {
      this.emitGallery(
        this.gallery().map((item) =>
          item.id === image.id && item === image ? { ...item, ...changes } : item,
        ),
      );
      return;
    }
    if (this.metadataSavingIds().includes(image.id)) return;

    const previous = image;
    this.metadataSavingIds.update((ids) => [...ids, image.id!]);
    this.emitGallery(
      this.gallery().map((item) => (item.id === image.id ? { ...item, ...changes } : item)),
    );
    try {
      const updated = await firstValueFrom(this.mediaApi.updateImage(image.id, changes));
      this.emitGallery(
        this.gallery().map((item) =>
          item.id === image.id
            ? {
                ...item,
                alt: updated.alt ?? '',
                variantColor: updated.variantColor,
                thumbnailUrl: updated.thumbnailUrl,
              }
            : item,
        ),
      );
    } catch (error) {
      this.emitGallery(this.gallery().map((item) => (item.id === previous.id ? previous : item)));
      rollbackInput?.();
      this.toast.error(
        readApiErrorMessage(error, 'Impossible d’enregistrer les détails de cette image.'),
      );
    } finally {
      this.metadataSavingIds.update((ids) => ids.filter((id) => id !== image.id));
    }
  }

  setPrimary(index: number): void {
    if (index <= 0 || index >= this.gallery().length) return;
    const previous = this.gallery();
    const reordered = [...previous];
    const [image] = reordered.splice(index, 1);
    if (!image) return;
    reordered.unshift(image);
    this.emitGallery(reordered);
    void this.persistOrder(previous);
  }

  async moveImage(index: number, direction: -1 | 1): Promise<void> {
    const target = index + direction;
    if (target < 0 || target >= this.gallery().length) return;
    const previous = this.gallery();
    const reordered = [...previous];
    const [image] = reordered.splice(index, 1);
    if (!image) return;
    reordered.splice(target, 0, image);
    this.emitGallery(reordered);
    await this.persistOrder(previous);
  }

  onImageDragStart(index: number, event: DragEvent): void {
    if (this.disabled()) return;
    this.draggingIndex.set(index);
    event.dataTransfer?.setData('text/plain', String(index));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onImageDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    if (this.draggingIndex() === null) return;
    this.dragOverIndex.set(index);
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  onImageDrop(index: number, event: DragEvent): void {
    event.preventDefault();
    const from = this.draggingIndex();
    this.draggingIndex.set(null);
    this.dragOverIndex.set(null);
    if (from === null || from === index) return;
    const previous = this.gallery();
    const reordered = [...previous];
    const [image] = reordered.splice(from, 1);
    if (!image) return;
    reordered.splice(index, 0, image);
    this.emitGallery(reordered);
    void this.persistOrder(previous);
  }

  onImageDragEnd(): void {
    this.draggingIndex.set(null);
    this.dragOverIndex.set(null);
  }

  private async persistOrder(previous: ProductImageItem[], rollback = true): Promise<void> {
    const productId = this.productId();
    const items = this.gallery();
    if (!productId || items.some((image) => !image.id || !image.persisted)) return;
    try {
      await firstValueFrom(
        this.mediaApi.reorder(
          productId,
          items.map((image, index) => ({ id: image.id!, position: index })),
        ),
      );
    } catch (error) {
      if (rollback) this.emitGallery(previous);
      this.toast.error(readApiErrorMessage(error, 'Impossible d’enregistrer l’ordre des images.'));
    }
  }

  requestDelete(image: ProductImageItem): void {
    if (this.disabled()) return;
    this.deleteTarget.set(image);
  }

  async confirmDelete(): Promise<void> {
    const image = this.deleteTarget();
    if (!image) return;
    if (image.id) {
      try {
        await firstValueFrom(this.mediaApi.deleteImage(image.id));
      } catch (error) {
        this.toast.error(readApiErrorMessage(error, 'Impossible de supprimer cette image.'));
        this.deleteTarget.set(null);
        return;
      }
    }
    const remaining = this.gallery()
      .filter((item) => item !== image)
      .map((item, index) => ({ ...item, position: index }));
    this.emitGallery(remaining);
    this.deleteTarget.set(null);
    await this.persistOrder(remaining, false);
    this.toast.success('Image supprimée.');
  }

  // -------------------------------------------------------------- URL image

  addImageFromUrl(): void {
    this.imageUrlError.set('');
    const url = this.newImageUrl().trim();
    if (url === '') {
      this.imageUrlError.set('L’URL de l’image est obligatoire.');
      return;
    }
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol');
    } catch {
      this.imageUrlError.set('Saisissez une URL complète commençant par http:// ou https://.');
      return;
    }
    if (this.remainingSlots() <= 0) {
      this.imageUrlError.set(`Ce produit a atteint la limite de ${this.maxImages()} images.`);
      return;
    }
    this.emitGallery([
      ...this.gallery(),
      {
        id: null,
        url,
        thumbnailUrl: url,
        alt: this.newImageAlt().trim(),
        variantColor: this.newImageColor().trim().toUpperCase() || null,
        position: this.gallery().length,
        persisted: false,
      },
    ]);
    this.newImageUrl.set('');
    this.newImageAlt.set('');
    this.newImageColor.set('');
  }
}
