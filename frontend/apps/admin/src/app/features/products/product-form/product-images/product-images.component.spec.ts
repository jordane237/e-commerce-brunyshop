import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastService } from '@bruny/core';
import { AdminMediaApi } from '@bruny/data-access';

import { detectImageMime, validateImageFile } from './image-file-validation';
import { ProductImagesComponent } from './product-images.component';
import type { ProductImageItem } from './product-images.types';

const IMAGE = {
  id: 'image-1',
  url: 'https://media.test/image-1.webp',
  thumbnailUrl: 'https://media.test/image-1-thumb.webp',
  alt: 'Vue de face',
  position: 0,
  variantColor: 'NOIR',
  persisted: true,
} satisfies ProductImageItem;

function jpegFile(name = 'photo.jpg', size = 8): File {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, ...Array(size).fill(0)])], name, {
    type: 'image/jpeg',
  });
}

function pdfFile(): File {
  return new File([new TextEncoder().encode('%PDF-1.7 fake')], 'document.pdf', {
    type: 'image/jpeg',
  });
}

function setup(
  options: {
    productId?: string | null;
    productSlug?: string;
    images?: ProductImageItem[];
    colors?: string[];
  } = {},
) {
  const mediaApi = {
    config: vi.fn().mockReturnValue(
      of({
        maxFileSizeBytes: 5 * 1024 * 1024,
        maxImagesPerProduct: 10,
        presignExpiresSeconds: 300,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    ),
    presign: vi.fn().mockImplementation((payload: { productSlug: string }) =>
      of({
        uploadUrl: `https://storage.test/${payload.productSlug}`,
        key: `products/${payload.productSlug}/common/a.jpg`,
        publicUrl: 'https://media.test/a.jpg',
        expiresIn: 300,
        method: 'PUT' as const,
        headers: { 'Content-Type': 'image/jpeg' },
      }),
    ),
    upload: vi.fn().mockReturnValue(of(35, 100)),
    confirm: vi.fn().mockImplementation((payload: { position: number; alt: string }) =>
      of({
        id: `uploaded-${payload.position}`,
        url: `https://media.test/uploaded-${payload.position}.webp`,
        thumbnailUrl: `https://media.test/uploaded-${payload.position}-thumb.webp`,
        alt: payload.alt,
        position: payload.position,
        variantColor: 'NOIR',
      }),
    ),
    updateImage: vi.fn().mockImplementation((_id: string, payload: object) =>
      of({
        ...IMAGE,
        ...payload,
      }),
    ),
    deleteImage: vi.fn().mockReturnValue(of(void 0)),
    reorder: vi.fn().mockReturnValue(of({ updated: 1 })),
  };
  const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };

  TestBed.configureTestingModule({
    imports: [ProductImagesComponent],
    providers: [
      { provide: AdminMediaApi, useValue: mediaApi },
      { provide: ToastService, useValue: toast },
    ],
  });

  const fixture = TestBed.createComponent(ProductImagesComponent);
  fixture.componentRef.setInput('productId', options.productId ?? null);
  fixture.componentRef.setInput('productSlug', options.productSlug ?? '');
  fixture.componentRef.setInput('images', options.images ?? []);
  fixture.componentRef.setInput('colors', options.colors ?? ['NOIR', 'BLEU MARINE']);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, mediaApi, toast };
}

async function waitFor(predicate: () => boolean, timeout = 2000): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeout) throw new Error('Condition non satisfaite à temps.');
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

function selectFiles(component: ProductImagesComponent, files: File[]): void {
  const input = document.createElement('input');
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  component.onFilesSelected({ target: input } as unknown as Event);
}

describe('validation des fichiers image', () => {
  it('détecte le type réel et refuse un PDF déguisé', async () => {
    expect(await detectImageMime(jpegFile())).toBe('image/jpeg');
    await expect(
      validateImageFile(pdfFile(), 5 * 1024 * 1024, ['image/jpeg', 'image/png', 'image/webp']),
    ).resolves.toEqual({
      mime: null,
      error: 'Format non pris en charge. Utilisez une image JPEG, PNG ou WebP.',
    });
  });

  it('refuse un fichier trop lourd avec un message lisible', async () => {
    const result = await validateImageFile(jpegFile('grand.jpg', 30), 10, [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);
    expect(result.mime).toBeNull();
    expect(result.error).toContain('trop volumineux');
  });
});

describe('ProductImagesComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('refuse les fichiers invalides sans bloquer les fichiers valides', async () => {
    const { component } = setup({ productId: 'product-1', productSlug: 'air-max' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    component.maxFileBytes.set(20);

    selectFiles(component, [jpegFile('ok.jpg'), pdfFile(), jpegFile('grand.jpg', 40)]);

    await waitFor(() => component.queue().length === 3 && component.gallery().length === 1);
    expect(component.gallery()).toHaveLength(1);
    expect(component.queue().filter((item) => item.status === 'error')).toHaveLength(2);
    expect(
      component
        .queue()
        .map((item) => item.error)
        .join(' '),
    ).toContain('Format non pris');
    expect(
      component
        .queue()
        .map((item) => item.error)
        .join(' '),
    ).toContain('trop volumineux');
  });

  it('téléverse plusieurs fichiers et expose des états puis des aperçus', async () => {
    const { component, mediaApi } = setup({ productId: 'product-1', productSlug: 'air-max' });

    selectFiles(component, [jpegFile('un.jpg'), jpegFile('deux.jpg')]);

    await waitFor(() => component.gallery().length === 2);
    expect(mediaApi.presign).toHaveBeenCalledTimes(2);
    expect(mediaApi.upload).toHaveBeenCalledTimes(2);
    expect(mediaApi.confirm).toHaveBeenCalledTimes(2);
    expect(component.queue().every((item) => item.status === 'success')).toBe(true);
    expect(component.gallery()[0]?.thumbnailUrl).toContain('-thumb.webp');
  });

  it('garde les fichiers en attente avant la création puis les envoie après le brouillon', async () => {
    const { fixture, component, mediaApi } = setup();

    selectFiles(component, [jpegFile('brouillon.jpg')]);
    await waitFor(() => component.queue()[0]?.status === 'pending');
    expect(mediaApi.presign).not.toHaveBeenCalled();
    expect(component.hasUnsavedChanges()).toBe(true);

    // Le formulaire est désactivé pendant l’enregistrement du brouillon.
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    await component.uploadPending('new-product', 'nouveau-produit');

    expect(mediaApi.presign).toHaveBeenCalledWith(
      expect.objectContaining({ productSlug: 'nouveau-produit', contentType: 'image/jpeg' }),
    );
    expect(component.gallery()).toHaveLength(1);
    expect(component.queue()[0]?.status).toBe('success');
  });

  it('définit l’image principale et persiste le nouvel ordre', async () => {
    const second = {
      ...IMAGE,
      id: 'image-2',
      url: 'https://media.test/image-2.webp',
      thumbnailUrl: 'https://media.test/image-2-thumb.webp',
      position: 1,
      alt: 'Vue de profil',
    };
    const { component, mediaApi } = setup({
      productId: 'product-1',
      images: [IMAGE, second],
    });

    component.setPrimary(1);
    await waitFor(() => mediaApi.reorder.mock.calls.length > 0);

    expect(component.gallery()[0]?.id).toBe('image-2');
    expect(mediaApi.reorder).toHaveBeenCalledWith('product-1', [
      { id: 'image-2', position: 0 },
      { id: 'image-1', position: 1 },
    ]);
  });

  it('modifie le texte alternatif et la couleur d’une image existante', async () => {
    const { component, mediaApi } = setup({
      productId: 'product-1',
      images: [IMAGE],
    });
    const input = document.createElement('input');
    input.value = 'Vue de trois quarts';

    component.onAltBlur(component.gallery()[0]!, { target: input } as unknown as Event);
    await waitFor(() => mediaApi.updateImage.mock.calls.length === 1);
    expect(mediaApi.updateImage).toHaveBeenCalledWith('image-1', {
      alt: 'Vue de trois quarts',
    });

    component.onImageColorChange(component.gallery()[0]!, 'BLEU MARINE');
    await waitFor(() => mediaApi.updateImage.mock.calls.length === 2);
    expect(mediaApi.updateImage).toHaveBeenLastCalledWith('image-1', {
      variantColor: 'BLEU MARINE',
    });
  });

  it('conserve une couleur retirée des variantes dans les options', () => {
    const { component } = setup({ images: [{ ...IMAGE, variantColor: 'ANCIENNE' }] });
    expect(component.colorOptionsFor('ANCIENNE')).toContainEqual({
      value: 'ANCIENNE',
      label: 'ANCIENNE (retirée des variantes)',
    });
  });

  it('supprime une image persistée et promeut la suivante', async () => {
    const second = {
      ...IMAGE,
      id: 'image-2',
      position: 1,
      alt: 'Deuxième',
    };
    const { component, mediaApi } = setup({
      productId: 'product-1',
      images: [IMAGE, second],
    });

    component.requestDelete(component.gallery()[0]!);
    await component.confirmDelete();

    expect(mediaApi.deleteImage).toHaveBeenCalledWith('image-1');
    expect(component.gallery()).toHaveLength(1);
    expect(component.gallery()[0]?.id).toBe('image-2');
  });

  it('ajoute une image par URL et marque la galerie comme modifiée', () => {
    const { component } = setup();
    component.newImageUrl.set('https://cdn.example.com/photo.webp');
    component.newImageAlt.set('Photo produit');

    component.addImageFromUrl();

    expect(component.gallery()).toHaveLength(1);
    expect(component.dirty()).toBe(true);
    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('refuse une URL d’image invalide', () => {
    const { component } = setup();
    component.newImageUrl.set('pas-une-url');

    component.addImageFromUrl();

    expect(component.gallery()).toHaveLength(0);
    expect(component.imageUrlError()).toContain('URL complète');
  });
});
