import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastService } from '@bruny/core';
import {
  AdminCatalogApi,
  AdminMediaApi,
  AdminProductDetail,
  AdminProductsApi,
} from '@bruny/data-access';
import { ProductFormComponent } from './product-form.component';

const category = { id: 'cat-1', name: 'Chaussures', slug: 'chaussures', parentId: null };
const brand = { id: 'brand-1', name: 'Bruny', slug: 'bruny' };

const detail: AdminProductDetail = {
  id: 'product-1',
  name: 'Air Max 90',
  slug: 'air-max-90',
  description: 'Une sneaker confortable pour tous les jours.',
  status: 'DRAFT',
  basePrice: 45000,
  promoPrice: null,
  promoStart: null,
  promoEnd: null,
  effectivePrice: 45000,
  seoTitle: 'Air Max 90',
  seoDescription: 'Découvrez la Air Max 90.',
  categoryId: category.id,
  brandId: brand.id,
  category: { id: category.id, name: category.name, slug: category.slug },
  brand: { id: brand.id, name: brand.name, slug: brand.slug, logo: null },
  deletedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  variants: [
    {
      id: 'variant-1',
      sku: 'AM90-NOIR-42',
      color: 'NOIR',
      size: '42',
      price: null,
      stock: 8,
      reservedStock: 0,
      lowStockThreshold: 5,
      version: 1,
    },
  ],
  images: [
    {
      id: 'image-1',
      url: 'https://cdn.example.com/am90.jpg',
      alt: 'Air Max 90',
      position: 0,
      variantColor: null,
    },
  ],
};

function setup(productId: string | null = null) {
  const productsApi = {
    get: vi.fn().mockReturnValue(of(detail)),
    create: vi.fn().mockReturnValue(of(detail)),
    update: vi.fn().mockReturnValue(of(detail)),
    replaceVariants: vi.fn().mockReturnValue(of(detail)),
    duplicate: vi.fn().mockReturnValue(of({ ...detail, id: 'product-copy' })),
  };
  const catalogApi = {
    options: vi.fn().mockReturnValue(of({ categories: [category], brands: [brand] })),
  };
  const mediaApi = {
    presign: vi.fn(),
    confirm: vi.fn(),
    deleteImage: vi.fn().mockReturnValue(of(void 0)),
    reorder: vi.fn().mockReturnValue(of(void 0)),
  };
  const toast = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  };
  const router = { navigate: vi.fn().mockResolvedValue(true) };

  TestBed.configureTestingModule({
    imports: [ProductFormComponent],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: {
              get: (key: string) => (key === 'id' ? productId : null),
            },
          },
        },
      },
      { provide: Router, useValue: router },
      { provide: AdminProductsApi, useValue: productsApi },
      { provide: AdminCatalogApi, useValue: catalogApi },
      { provide: AdminMediaApi, useValue: mediaApi },
      { provide: ToastService, useValue: toast },
    ],
  });

  const fixture = TestBed.createComponent(ProductFormComponent);
  fixture.detectChanges();
  return {
    fixture,
    component: fixture.componentInstance,
    productsApi,
    catalogApi,
    mediaApi,
    toast,
    router,
  };
}

async function ready(productId: string | null = null) {
  const context = setup(productId);
  await context.fixture.whenStable();
  return context;
}

function fillValidForm(component: ProductFormComponent, stock = 5): void {
  component.productForm.patchValue({
    name: 'Air Max 90',
    slug: 'air-max-90',
    description: 'Une sneaker confortable pour tous les jours.',
    categoryId: category.id,
    brandId: brand.id,
    basePrice: 45000,
  });
  component.variants.at(0).patchValue({ color: 'NOIR', size: '42', stock });
}

describe('ProductFormComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('initialise un brouillon avec une variante vide et les options catalogue', async () => {
    const { component, catalogApi } = await ready();

    expect(catalogApi.options).toHaveBeenCalled();
    expect(component.isEdit()).toBe(false);
    expect(component.variants.length).toBe(1);
    expect(component.hasUnsavedChanges()).toBe(false);
    expect(component.categories()).toEqual([category]);
  });

  it('bloque l’enregistrement d’un brouillon invalide', async () => {
    const { component, productsApi, toast } = await ready();

    await component.save('draft');

    expect(productsApi.create).not.toHaveBeenCalled();
    expect(component.submitted()).toBe(true);
    expect(toast.error).toHaveBeenCalledWith('Corrigez les champs signalés avant d’enregistrer.');
  });

  it('enregistre un brouillon avec variantes puis redirige vers l’édition', async () => {
    const { component, productsApi, router, toast } = await ready();
    fillValidForm(component);

    await component.save('draft');

    expect(productsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Air Max 90',
        status: 'DRAFT',
        variants: [expect.objectContaining({ color: 'NOIR', size: '42', stock: 5 })],
      }),
    );
    expect(toast.success).toHaveBeenCalledWith('Brouillon enregistré.');
    expect(router.navigate).toHaveBeenCalledWith(['/produits', 'product-1', 'modifier'], {
      replaceUrl: true,
    });
  });

  it('refuse la publication sans stock', async () => {
    const { component, productsApi, toast } = await ready();
    fillValidForm(component, 0);

    await component.save('publish');

    expect(productsApi.create).not.toHaveBeenCalled();
    expect(component.activeTab()).toBe('variantes');
    expect(toast.error).toHaveBeenCalledWith(
      'Un produit publié doit avoir au moins une variante en stock.',
    );
  });

  it('publie un produit avec stock', async () => {
    const { component, productsApi } = await ready();
    fillValidForm(component);

    await component.save('publish');

    expect(productsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PUBLISHED' }),
    );
  });

  it('charge un produit existant sans le marquer comme modifié', async () => {
    const { component, productsApi } = await ready('product-1');

    expect(productsApi.get).toHaveBeenCalledWith('product-1');
    expect(component.isEdit()).toBe(true);
    expect(component.productForm.controls.name.value).toBe('Air Max 90');
    expect(component.variants.length).toBe(1);
    expect(component.images()).toHaveLength(1);
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it('demande confirmation avant de quitter avec des modifications', async () => {
    const { component } = await ready('product-1');
    component.productForm.controls.name.setValue('Air Max 90 modifiée');
    component.productForm.controls.name.markAsDirty();

    expect(component.hasUnsavedChanges()).toBe(true);
    const leaving = component.canLeave();
    expect(component.leaveDialogOpen()).toBe(true);

    component.confirmLeave();
    await expect(leaving).resolves.toBe(true);
    expect(component.leaveDialogOpen()).toBe(false);
  });

  it('annule la sortie quand l’utilisateur reste sur le formulaire', async () => {
    const { component } = await ready('product-1');
    component.productForm.controls.name.setValue('Air Max 90 modifiée');
    component.productForm.controls.name.markAsDirty();

    const leaving = component.canLeave();
    component.cancelLeave();

    await expect(leaving).resolves.toBe(false);
  });

  it('génère les combinaisons couleur × pointure sans doublon', async () => {
    const { component } = await ready();
    component.removeVariant(0);
    component.generatorColors.set('noir, blanc');
    component.generatorSizes.set('40, 41');

    component.generateVariants();

    expect(component.variants.length).toBe(4);
    expect(component.variantPayload()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: 'NOIR', size: '40' }),
        expect.objectContaining({ color: 'BLANC', size: '41' }),
      ]),
    );
  });

  it('ajoute une image par URL au brouillon', async () => {
    const { component } = await ready();
    component.newImageUrl.set('https://cdn.example.com/photo.webp');
    component.newImageAlt.set('Photo produit');

    component.addImageFromUrl();

    expect(component.images()).toHaveLength(1);
    expect(component.imagesDirty()).toBe(true);
    expect(component.imagePayload()).toEqual([
      {
        url: 'https://cdn.example.com/photo.webp',
        alt: 'Photo produit',
        position: 0,
      },
    ]);
  });

  it('refuse une URL d’image invalide', async () => {
    const { component } = await ready();
    component.newImageUrl.set('pas-une-url');

    component.addImageFromUrl();

    expect(component.images()).toHaveLength(0);
    expect(component.imageUrlError()).toContain('URL complète');
  });

  it('duplique un produit existant en brouillon', async () => {
    const { component, productsApi, router, toast } = await ready('product-1');

    component.openDuplicate();
    await component.confirmDuplicate();

    expect(productsApi.duplicate).toHaveBeenCalledWith(
      'product-1',
      expect.objectContaining({ name: 'Air Max 90 (copie)', copyImages: true }),
    );
    expect(toast.success).toHaveBeenCalledWith('Produit dupliqué en brouillon.');
    expect(router.navigate).toHaveBeenCalledWith(['/produits', 'product-copy', 'modifier']);
  });
});
