import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage, ToastService } from '@bruny/core';
import { FcfaPipe } from '@bruny/util';
import {
  AdminBrandOption,
  AdminCatalogApi,
  AdminCategoryOption,
  AdminMediaApi,
  AdminProductDetail,
  AdminProductStatus,
  AdminProductVariant,
  AdminProductsApi,
  CreateProductPayload,
  ProductImagePayload,
  ProductVariantPayload,
  UpdateProductPayload,
} from '@bruny/data-access';
import {
  ButtonComponent,
  ConfirmDialogComponent,
  InputComponent,
  ModalComponent,
  SelectComponent,
  StatusBadgeComponent,
  TabsComponent,
  TabItem,
} from '@bruny/ui';

interface VariantControls {
  id: FormControl<string | null>;
  sku: FormControl<string>;
  color: FormControl<string>;
  size: FormControl<string>;
  price: FormControl<number | null>;
  stock: FormControl<number>;
  lowStockThreshold: FormControl<number>;
}

type VariantForm = FormGroup<VariantControls>;

interface ProductImageItem {
  id: string | null;
  url: string;
  alt: string;
  variantColor: string | null;
  position: number;
  persisted: boolean;
}

const TABS: readonly TabItem[] = [
  { id: 'informations', label: 'Informations' },
  { id: 'variantes', label: 'Variantes et stock' },
  { id: 'images', label: 'Images' },
  { id: 'tarifs', label: 'Tarifs' },
  { id: 'seo', label: 'SEO' },
];

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function positiveIntegerValidator(control: AbstractControl): ValidationErrors | null {
  if (control.value === null || control.value === '' || control.value === undefined) return null;
  const value = Number(control.value);
  return Number.isInteger(value) && value >= 0 ? null : { integer: true };
}

function duplicateVariantsValidator(control: AbstractControl): ValidationErrors | null {
  if (!(control instanceof FormArray)) return null;
  const seen = new Set<string>();
  for (const group of control.controls) {
    const value = group.value as { color?: unknown; size?: unknown };
    const key = `${String(value.color ?? '')
      .trim()
      .toUpperCase()}::${String(value.size ?? '')
      .trim()
      .toUpperCase()}`;
    if (seen.has(key)) return { duplicateVariants: true };
    seen.add(key);
  }
  return null;
}

const promotionValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const value = group.value as {
    basePrice?: unknown;
    promoPrice?: unknown;
    promoStart?: unknown;
    promoEnd?: unknown;
  };
  const errors: ValidationErrors = {};
  const basePrice = Number(value.basePrice);
  const promoRaw = value.promoPrice;
  const promoPrice =
    promoRaw === null || promoRaw === '' || promoRaw === undefined ? null : Number(promoRaw);
  const start = typeof value.promoStart === 'string' ? value.promoStart : '';
  const end = typeof value.promoEnd === 'string' ? value.promoEnd : '';

  if (promoPrice !== null) {
    if (!Number.isInteger(promoPrice) || promoPrice < 1) {
      errors['promoPriceInvalid'] = true;
    } else if (!Number.isNaN(basePrice) && promoPrice >= basePrice) {
      errors['promoPriceTooHigh'] = true;
    }
    if (start === '' || end === '') errors['promoDatesRequired'] = true;
  }
  if (start !== '' && end !== '' && new Date(start).getTime() >= new Date(end).getTime()) {
    errors['promoWindowInvalid'] = true;
  }
  return Object.keys(errors).length > 0 ? errors : null;
};

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateTimeLocal(iso: string | null): string {
  if (iso === null) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FcfaPipe,
    TabsComponent,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    StatusBadgeComponent,
    ModalComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsApi = inject(AdminProductsApi);
  private readonly catalogApi = inject(AdminCatalogApi);
  private readonly mediaApi = inject(AdminMediaApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tabs = TABS;
  readonly activeTab = signal('informations');
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly saving = signal<'draft' | 'publish' | null>(null);
  readonly saveError = signal('');
  readonly submitted = signal(false);
  readonly formTick = signal(0);
  readonly productId = signal<string | null>(null);
  readonly productSlug = signal('');
  readonly status = signal<AdminProductStatus>('DRAFT');
  readonly categories = signal<AdminCategoryOption[]>([]);
  readonly brands = signal<AdminBrandOption[]>([]);
  readonly optionsLoading = signal(true);
  readonly optionsError = signal('');
  readonly images = signal<ProductImageItem[]>([]);
  readonly imagesDirty = signal(false);
  readonly imageUploading = signal(false);
  readonly imageError = signal('');
  readonly imageDeleteTarget = signal<ProductImageItem | null>(null);
  readonly previewOpen = signal(false);
  readonly duplicateOpen = signal(false);
  readonly duplicateLoading = signal(false);
  readonly leaveDialogOpen = signal(false);

  readonly uploadColor = signal('');
  readonly newImageUrl = signal('');
  readonly newImageAlt = signal('');
  readonly newImageColor = signal('');
  readonly imageUrlError = signal('');

  readonly generatorColors = signal('');
  readonly generatorSizes = signal('');
  readonly generatorStock = signal('0');

  private autoSlug = true;
  private variantBaseline = '';
  private pendingLeave: ((allow: boolean) => void) | null = null;

  readonly productForm = this.fb.group(
    {
      name: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(160),
      ]),
      slug: this.fb.nonNullable.control('', [
        Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        Validators.maxLength(180),
      ]),
      description: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(10000),
      ]),
      categoryId: this.fb.nonNullable.control('', [Validators.required]),
      brandId: this.fb.nonNullable.control('', [Validators.required]),
      basePrice: this.fb.nonNullable.control(0, [
        Validators.required,
        Validators.min(0),
        positiveIntegerValidator,
      ]),
      promoPrice: this.fb.control<number | null>(null, [positiveIntegerValidator]),
      promoStart: this.fb.nonNullable.control(''),
      promoEnd: this.fb.nonNullable.control(''),
      seoTitle: this.fb.nonNullable.control('', [Validators.maxLength(255)]),
      seoDescription: this.fb.nonNullable.control('', [Validators.maxLength(500)]),
    },
    { validators: promotionValidator },
  );

  readonly variants = this.fb.array<VariantForm>([], {
    validators: [duplicateVariantsValidator],
  });

  readonly isEdit = computed(() => this.productId() !== null);
  readonly isPublished = computed(() => this.status() === 'PUBLISHED');
  readonly title = computed(() => {
    this.formTick();
    return this.isEdit()
      ? this.productForm.controls.name.value || 'Modifier le produit'
      : 'Nouveau produit';
  });
  readonly categoryOptions = computed(() => {
    const byId = new Map(this.categories().map((category) => [category.id, category]));
    return this.categories().map((category) => {
      const parent = category.parentId ? byId.get(category.parentId) : undefined;
      return {
        value: category.id,
        label: parent ? `${parent.name} / ${category.name}` : category.name,
      };
    });
  });
  readonly brandOptions = computed(() =>
    this.brands().map((brand) => ({ value: brand.id, label: brand.name })),
  );
  readonly hasStock = computed(() => {
    this.formTick();
    return this.variants.controls.some((variant) => Number(variant.controls.stock.value) > 0);
  });
  readonly variantDuplicate = computed(() => {
    this.formTick();
    return this.variants.hasError('duplicateVariants');
  });
  readonly formErrorCount = computed(() => {
    this.formTick();
    let count = 0;
    if (this.productForm.invalid) count += 1;
    if (this.variants.length === 0 || this.variants.invalid) count += 1;
    return count;
  });
  readonly preview = computed(() => {
    this.formTick();
    const raw = this.productForm.getRawValue();
    const images = this.images();
    const variants = this.variants.getRawValue();
    const base = Number(raw.basePrice) || 0;
    const promo = numberOrNull(raw.promoPrice);
    const start = raw.promoStart ? new Date(raw.promoStart).getTime() : null;
    const end = raw.promoEnd ? new Date(raw.promoEnd).getTime() : null;
    const now = Date.now();
    const promoActive =
      promo !== null &&
      promo > 0 &&
      (start === null || start <= now) &&
      (end === null || end >= now);
    return {
      name: raw.name || 'Nom du produit',
      description: raw.description || 'Aucune description pour le moment.',
      basePrice: base,
      promoPrice: promoActive ? promo : null,
      category:
        this.categories().find((category) => category.id === raw.categoryId)?.name ??
        'Catégorie non sélectionnée',
      brand:
        this.brands().find((brand) => brand.id === raw.brandId)?.name ?? 'Marque non sélectionnée',
      image: images[0]?.url ?? null,
      stock: variants.reduce((total, variant) => total + (Number(variant.stock) || 0), 0),
      variants: variants.length,
      colors: [...new Set(variants.map((variant) => variant.color).filter(Boolean))],
      sizes: [...new Set(variants.map((variant) => variant.size).filter(Boolean))],
      seoTitle: raw.seoTitle,
      seoDescription: raw.seoDescription,
    };
  });

  constructor() {
    this.productForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formTick.update((tick) => tick + 1);
    });
    this.variants.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formTick.update((tick) => tick + 1);
    });
    this.productForm.controls.name.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((name) => {
        if (!this.autoSlug) return;
        this.productForm.controls.slug.setValue(slugify(name), { emitEvent: false });
      });
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    await Promise.all([this.loadOptions(), id ? this.loadProduct(id) : this.initCreate()]);
    this.loading.set(false);
  }

  private async loadOptions(): Promise<void> {
    this.optionsLoading.set(true);
    this.optionsError.set('');
    try {
      const options = await firstValueFrom(this.catalogApi.options());
      this.categories.set(options.categories);
      this.brands.set(options.brands);
    } catch {
      this.optionsError.set('Impossible de charger les catégories et marques.');
    } finally {
      this.optionsLoading.set(false);
    }
  }

  private initCreate(): void {
    this.autoSlug = true;
    this.status.set('DRAFT');
    if (this.variants.length === 0) this.addVariant();
    this.productForm.markAsPristine();
    this.variantBaseline = this.variantsSnapshot();
    this.imagesDirty.set(false);
  }

  private async loadProduct(id: string): Promise<void> {
    this.autoSlug = false;
    try {
      const product = await firstValueFrom(this.productsApi.get(id));
      this.applyDetail(product);
    } catch (error) {
      this.loadError.set(
        readApiErrorMessage(error, 'Impossible de charger ce produit. Vérifiez son identifiant.'),
      );
    }
  }

  private applyDetail(product: AdminProductDetail): void {
    this.autoSlug = false;
    this.productId.set(product.id);
    this.productSlug.set(product.slug);
    this.status.set(product.status);
    this.productForm.patchValue({
      name: product.name,
      slug: product.slug,
      description: product.description,
      categoryId: product.categoryId,
      brandId: product.brandId,
      basePrice: product.basePrice,
      promoPrice: product.promoPrice,
      promoStart: toDateTimeLocal(product.promoStart),
      promoEnd: toDateTimeLocal(product.promoEnd),
      seoTitle: product.seoTitle ?? '',
      seoDescription: product.seoDescription ?? '',
    });
    this.variants.clear({ emitEvent: false });
    for (const variant of product.variants) this.variants.push(this.createVariantGroup(variant));
    this.images.set(
      product.images.map((image) => ({
        id: image.id,
        url: image.url,
        alt: image.alt ?? '',
        variantColor: image.variantColor,
        position: image.position,
        persisted: true,
      })),
    );
    this.imagesDirty.set(false);
    this.submitted.set(false);
    this.productForm.markAsPristine();
    this.variantBaseline = this.variantsSnapshot();
  }

  private createVariantGroup(variant?: AdminProductVariant): VariantForm {
    return this.fb.group<VariantControls>({
      id: this.fb.control<string | null>(variant?.id ?? null),
      sku: this.fb.nonNullable.control(variant?.sku ?? ''),
      color: this.fb.nonNullable.control(variant?.color ?? '', [
        Validators.required,
        Validators.maxLength(32),
      ]),
      size: this.fb.nonNullable.control(variant?.size ?? '', [
        Validators.required,
        Validators.maxLength(16),
      ]),
      price: this.fb.control<number | null>(variant?.price ?? null, [positiveIntegerValidator]),
      stock: this.fb.nonNullable.control(variant?.stock ?? 0, [
        Validators.required,
        Validators.min(0),
        positiveIntegerValidator,
      ]),
      lowStockThreshold: this.fb.nonNullable.control(variant?.lowStockThreshold ?? 5, [
        Validators.required,
        Validators.min(0),
        positiveIntegerValidator,
      ]),
    });
  }

  private variantsSnapshot(): string {
    return JSON.stringify(
      this.variants.getRawValue().map((variant) => ({
        id: variant.id,
        color: String(variant.color).trim().toUpperCase(),
        size: String(variant.size).trim().toUpperCase(),
        price: numberOrNull(variant.price),
        stock: Number(variant.stock),
        lowStockThreshold: Number(variant.lowStockThreshold),
      })),
    );
  }

  private variantsChanged(): boolean {
    return this.variantsSnapshot() !== this.variantBaseline;
  }

  onSlugChange(value: string): void {
    this.autoSlug = false;
    this.productForm.controls.slug.setValue(value);
  }

  setCategory(value: string): void {
    this.productForm.controls.categoryId.setValue(value);
    this.productForm.controls.categoryId.markAsTouched();
  }

  setBrand(value: string): void {
    this.productForm.controls.brandId.setValue(value);
    this.productForm.controls.brandId.markAsTouched();
  }

  setTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  async retryLoad(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.loading.set(true);
    this.loadError.set('');
    await Promise.all([this.loadOptions(), id ? this.loadProduct(id) : this.initCreate()]);
    this.loading.set(false);
  }

  // --------------------------------------------------------------- validation

  errorFor(
    name:
      | 'name'
      | 'slug'
      | 'description'
      | 'categoryId'
      | 'brandId'
      | 'basePrice'
      | 'promoPrice'
      | 'promoStart'
      | 'promoEnd'
      | 'seoTitle'
      | 'seoDescription',
  ): string {
    const control = this.productForm.controls[name];
    if (!(control.touched || control.dirty || this.submitted())) return '';
    return this.controlMessage(control, name);
  }

  private controlMessage(control: AbstractControl, name: string): string {
    if (control.hasError('required')) {
      return name === 'categoryId'
        ? 'Sélectionnez une catégorie.'
        : name === 'brandId'
          ? 'Sélectionnez une marque.'
          : 'Ce champ est obligatoire.';
    }
    if (control.hasError('minlength')) {
      return `Minimum ${String(control.getError('minlength').requiredLength)} caractères.`;
    }
    if (control.hasError('maxlength')) {
      return `Maximum ${String(control.getError('maxlength').requiredLength)} caractères.`;
    }
    if (control.hasError('pattern') && name === 'slug') {
      return 'Utilisez uniquement des minuscules, chiffres et tirets.';
    }
    if (control.hasError('min')) return 'La valeur ne peut pas être négative.';
    if (control.hasError('integer')) return 'Saisissez un nombre entier positif.';
    return 'Valeur invalide.';
  }

  promotionError(): string {
    if (!(this.productForm.touched || this.productForm.dirty || this.submitted())) return '';
    const errors = this.productForm.errors ?? {};
    if (errors['promoPriceTooHigh']) {
      return 'Le prix promotionnel doit être strictement inférieur au prix de base.';
    }
    if (errors['promoPriceInvalid'])
      return 'Le prix promotionnel doit être un entier supérieur à 0.';
    if (errors['promoDatesRequired']) {
      return 'Renseignez les dates de début et de fin pour programmer une promotion.';
    }
    if (errors['promoWindowInvalid']) {
      return 'La date de début doit précéder la date de fin.';
    }
    return '';
  }

  variantError(index: number, field: keyof VariantControls): string {
    const control = this.variants.at(index)?.controls[field];
    if (!control || !(control.touched || control.dirty || this.submitted())) return '';
    return this.controlMessage(control, String(field));
  }

  private firstInvalidTab(): string {
    const c = this.productForm.controls;
    if (
      [c.name, c.slug, c.description, c.categoryId, c.brandId].some((control) => control.invalid)
    ) {
      return 'informations';
    }
    if (this.variants.length === 0 || this.variants.invalid) return 'variantes';
    if (c.basePrice.invalid || c.promoPrice.invalid || this.productForm.errors) return 'tarifs';
    if (c.seoTitle.invalid || c.seoDescription.invalid) return 'seo';
    return 'informations';
  }

  private validateForm(): boolean {
    this.submitted.set(true);
    this.productForm.markAllAsTouched();
    this.variants.markAllAsTouched();
    if (this.productForm.valid && this.variants.length > 0 && this.variants.valid) return true;
    this.activeTab.set(this.firstInvalidTab());
    this.toast.error('Corrigez les champs signalés avant d’enregistrer.');
    return false;
  }

  // ---------------------------------------------------------------- variants

  addVariant(): void {
    this.variants.push(this.createVariantGroup());
    this.variants.markAsDirty();
  }

  removeVariant(index: number): void {
    this.variants.removeAt(index);
    this.variants.markAsDirty();
  }

  generateVariants(): void {
    const colors = this.generatorColors()
      .split(/[,;\n]/)
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);
    const sizes = this.generatorSizes()
      .split(/[,;\n]/)
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);
    const stock = Math.max(0, Math.trunc(Number(this.generatorStock()) || 0));
    if (colors.length === 0 || sizes.length === 0) {
      this.toast.error('Saisissez au moins une couleur et une pointure.');
      return;
    }

    const existing = new Set(
      this.variants
        .getRawValue()
        .map(
          (variant) =>
            `${String(variant.color).trim().toUpperCase()}::${String(variant.size).trim().toUpperCase()}`,
        ),
    );
    let added = 0;
    for (const color of colors) {
      for (const size of sizes) {
        if (existing.has(`${color}::${size}`)) continue;
        const group = this.createVariantGroup();
        group.patchValue({ color, size, stock });
        this.variants.push(group);
        existing.add(`${color}::${size}`);
        added += 1;
      }
    }
    if (added === 0) {
      this.toast.warning('Toutes ces combinaisons existent déjà.');
      return;
    }
    this.variants.markAsDirty();
    this.toast.success(`${added} variante(s) ajoutée(s).`);
  }

  // ------------------------------------------------------------------ images

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
    this.images.update((items) => [
      ...items,
      {
        id: null,
        url,
        alt: this.newImageAlt().trim(),
        variantColor: this.newImageColor().trim().toUpperCase() || null,
        position: items.length,
        persisted: false,
      },
    ]);
    this.imagesDirty.set(true);
    this.newImageUrl.set('');
    this.newImageAlt.set('');
    this.newImageColor.set('');
  }

  removeImage(image: ProductImageItem): void {
    if (image.persisted && image.id) {
      this.imageDeleteTarget.set(image);
      return;
    }
    this.images.update((items) =>
      items.filter((item) => item !== image).map((item, index) => ({ ...item, position: index })),
    );
    this.imagesDirty.set(true);
  }

  async confirmDeleteImage(): Promise<void> {
    const image = this.imageDeleteTarget();
    if (!image?.id) return;
    this.imageDeleteTarget.set(null);
    this.imageUploading.set(true);
    this.imageError.set('');
    try {
      await firstValueFrom(this.mediaApi.deleteImage(image.id));
      this.images.update((items) =>
        items
          .filter((item) => item.id !== image.id)
          .map((item, index) => ({ ...item, position: index })),
      );
      await this.persistImageOrder();
      this.toast.success('Image supprimée.');
    } catch (error) {
      this.imageError.set(readApiErrorMessage(error, 'Impossible de supprimer cette image.'));
    } finally {
      this.imageUploading.set(false);
    }
  }

  async moveImage(index: number, direction: -1 | 1): Promise<void> {
    const target = index + direction;
    const items = this.images();
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    const current = reordered[index];
    const other = reordered[target];
    if (!current || !other) return;
    reordered[index] = other;
    reordered[target] = current;
    this.images.set(reordered.map((item, position) => ({ ...item, position })));
    if (this.isEdit()) {
      try {
        await this.persistImageOrder();
      } catch {
        this.images.set(items);
      }
    } else {
      this.imagesDirty.set(true);
    }
  }

  private async persistImageOrder(): Promise<void> {
    const id = this.productId();
    if (!id) return;
    const persisted = this.images().filter((image) => image.id !== null);
    if (persisted.length === 0) return;
    try {
      await firstValueFrom(
        this.mediaApi.reorder(
          id,
          persisted.map((image) => ({ id: image.id!, position: image.position })),
        ),
      );
    } catch (error) {
      this.imageError.set(readApiErrorMessage(error, 'Impossible de réorganiser les images.'));
      throw error;
    }
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) return;
    const productId = this.productId();
    if (!productId) {
      this.imageError.set('Enregistrez d’abord le brouillon pour pouvoir téléverser des images.');
      return;
    }
    this.imageError.set('');
    this.imageUploading.set(true);
    let uploaded = 0;
    try {
      for (const file of files) {
        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
          throw new Error('Format non autorisé. Utilisez JPEG, PNG ou WebP.');
        }
        if (file.size > MAX_IMAGE_BYTES) throw new Error('Image trop volumineuse (max 20 Mo).');
        const color = this.uploadColor().trim();
        const variantColor = color ? slugify(color) : undefined;
        const presign = await firstValueFrom(
          this.mediaApi.presign({
            productSlug: this.productSlug(),
            ...(variantColor ? { variantColor } : {}),
            contentType: file.type,
            declaredSize: file.size,
          }),
        );
        const response = await fetch(presign.uploadUrl, {
          method: presign.method,
          headers: presign.headers,
          body: file,
        });
        if (!response.ok) throw new Error('Le téléversement a échoué. Réessayez.');
        const image = await firstValueFrom(
          this.mediaApi.confirm({
            key: presign.key,
            productSlug: this.productSlug(),
            ...(variantColor ? { variantColor } : {}),
            position: this.images().length,
            alt: file.name.replace(/\.[^.]+$/, '').slice(0, 255),
          }),
        );
        this.images.update((items) => [
          ...items,
          {
            id: image.id,
            url: image.url,
            alt: image.alt ?? '',
            variantColor: image.variantColor,
            position: image.position,
            persisted: true,
          },
        ]);
        uploaded += 1;
      }
      if (uploaded > 0) this.toast.success(`${uploaded} image(s) ajoutée(s).`);
    } catch (error) {
      const apiMessage = readApiErrorMessage(error, '');
      this.imageError.set(
        apiMessage ||
          (error instanceof Error ? error.message : 'Impossible de téléverser l’image.'),
      );
    } finally {
      this.imageUploading.set(false);
    }
  }

  // ------------------------------------------------------------------- saving

  private buildMetadata(): UpdateProductPayload {
    const raw = this.productForm.getRawValue();
    const promoPrice = numberOrNull(raw.promoPrice);
    return {
      name: raw.name.trim(),
      slug: raw.slug.trim() || undefined,
      description: raw.description.trim(),
      categoryId: raw.categoryId,
      brandId: raw.brandId,
      basePrice: Math.trunc(Number(raw.basePrice)),
      promoPrice: promoPrice === null ? null : Math.trunc(promoPrice),
      promoStart:
        promoPrice !== null && raw.promoStart ? new Date(raw.promoStart).toISOString() : null,
      promoEnd: promoPrice !== null && raw.promoEnd ? new Date(raw.promoEnd).toISOString() : null,
      seoTitle: raw.seoTitle.trim(),
      seoDescription: raw.seoDescription.trim(),
    };
  }

  private variantPayload(): ProductVariantPayload[] {
    return this.variants.getRawValue().map((variant) => {
      const price = numberOrNull(variant.price);
      return {
        color: String(variant.color).trim(),
        size: String(variant.size).trim(),
        ...(price !== null ? { price: Math.trunc(price) } : {}),
        stock: Math.trunc(Number(variant.stock)),
        lowStockThreshold: Math.trunc(Number(variant.lowStockThreshold)),
      };
    });
  }

  private imagePayload(): ProductImagePayload[] {
    return this.images().map((image, index) => ({
      url: image.url,
      ...(image.alt ? { alt: image.alt } : {}),
      position: index,
      ...(image.variantColor ? { variantColor: image.variantColor } : {}),
    }));
  }

  async save(mode: 'draft' | 'publish'): Promise<void> {
    if (this.saving() !== null) return;
    this.saveError.set('');
    if (!this.validateForm()) return;
    if (mode === 'publish' && !this.hasStock()) {
      this.activeTab.set('variantes');
      this.toast.error('Un produit publié doit avoir au moins une variante en stock.');
      return;
    }

    this.saving.set(mode);
    const metadata = this.buildMetadata();
    const variants = this.variantPayload();
    const id = this.productId();
    try {
      if (!id) {
        const payload: CreateProductPayload = {
          name: metadata.name!,
          description: metadata.description!,
          categoryId: metadata.categoryId!,
          brandId: metadata.brandId!,
          basePrice: metadata.basePrice!,
          status: mode === 'publish' ? 'PUBLISHED' : 'DRAFT',
          variants,
          ...(metadata.slug ? { slug: metadata.slug } : {}),
          ...(metadata.promoPrice !== null
            ? {
                promoPrice: metadata.promoPrice,
                promoStart: metadata.promoStart ?? undefined,
                promoEnd: metadata.promoEnd ?? undefined,
              }
            : {}),
          ...(metadata.seoTitle ? { seoTitle: metadata.seoTitle } : {}),
          ...(metadata.seoDescription ? { seoDescription: metadata.seoDescription } : {}),
          images: this.imagePayload(),
        };
        const created = await firstValueFrom(this.productsApi.create(payload));
        this.applyDetail(created);
        this.toast.success(mode === 'publish' ? 'Produit publié.' : 'Brouillon enregistré.');
        await this.router.navigate(['/produits', created.id, 'modifier'], { replaceUrl: true });
        return;
      }

      let detail = await firstValueFrom(this.productsApi.update(id, metadata, { skipToast: true }));
      if (this.variantsChanged()) {
        detail = await firstValueFrom(
          this.productsApi.replaceVariants(
            id,
            variants.map((variant, index) => {
              const variantId = this.variants.at(index)?.controls.id.value;
              return variantId ? { ...variant, id: variantId } : variant;
            }),
          ),
        );
      }
      if (mode === 'publish' && detail.status !== 'PUBLISHED') {
        detail = await firstValueFrom(
          this.productsApi.update(id, { status: 'PUBLISHED' }, { skipToast: true }),
        );
      }
      this.applyDetail(detail);
      this.toast.success(mode === 'publish' ? 'Produit publié.' : 'Modifications enregistrées.');
    } catch (error) {
      const message = readApiErrorMessage(
        error,
        'Impossible d’enregistrer le produit. Vérifiez les informations saisies.',
      );
      this.saveError.set(message);
      this.toast.error(message);
    } finally {
      this.saving.set(null);
    }
  }

  openDuplicate(): void {
    if (!this.isEdit()) return;
    this.duplicateOpen.set(true);
  }

  async confirmDuplicate(): Promise<void> {
    const id = this.productId();
    if (!id) return;
    this.duplicateLoading.set(true);
    try {
      const copy = await firstValueFrom(
        this.productsApi.duplicate(id, {
          name: `${this.productForm.controls.name.value.trim()} (copie)`.slice(0, 160),
          copyImages: true,
          copyVariants: true,
          resetStock: false,
        }),
      );
      this.duplicateOpen.set(false);
      this.productForm.markAsPristine();
      this.toast.success('Produit dupliqué en brouillon.');
      await this.router.navigate(['/produits', copy.id, 'modifier']);
    } catch (error) {
      this.toast.error(readApiErrorMessage(error, 'Impossible de dupliquer ce produit.'));
    } finally {
      this.duplicateLoading.set(false);
    }
  }

  openPreview(): void {
    this.previewOpen.set(true);
  }

  goBack(): void {
    void this.router.navigate(['/produits']);
  }

  hasUnsavedChanges(): boolean {
    return this.productForm.dirty || this.imagesDirty() || this.variantsChanged();
  }

  canLeave(): boolean | Promise<boolean> {
    if (!this.hasUnsavedChanges()) return true;
    this.leaveDialogOpen.set(true);
    return new Promise<boolean>((resolve) => {
      this.pendingLeave = resolve;
    });
  }

  confirmLeave(): void {
    this.leaveDialogOpen.set(false);
    this.pendingLeave?.(true);
    this.pendingLeave = null;
  }

  cancelLeave(): void {
    this.leaveDialogOpen.set(false);
    this.pendingLeave?.(false);
    this.pendingLeave = null;
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.hasUnsavedChanges()) return;
    event.preventDefault();
    event.returnValue = '';
  }
}
