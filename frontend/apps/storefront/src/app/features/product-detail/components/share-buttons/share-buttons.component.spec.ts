import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ToastService } from '@bruny/core';
import { ShareButtonsComponent } from './share-buttons.component';
import { ShareService } from '../../../../core/services/share.service';

describe('ShareButtonsComponent', () => {
  it('affiche trois boutons de partage', () => {
    TestBed.configureTestingModule({
      imports: [ShareButtonsComponent],
      providers: [
        {
          provide: ShareService,
          useValue: {
            shareOnFacebook: vi.fn(),
            shareOnWhatsApp: vi.fn(),
            copyLink: vi.fn(() => ({ subscribe: (cb: (v: boolean) => void) => cb(true) })),
          },
        },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(ShareButtonsComponent);
    fixture.componentRef.setInput('productSlug', 'air-max');
    fixture.componentRef.setInput('productName', 'Air Max');
    fixture.componentRef.setInput('productPrice', 25000);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(3);
    expect(fixture.nativeElement.getAttribute('role')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="group"]')).not.toBeNull();
  });

  it('appelle le partage Facebook', () => {
    const shareService = {
      shareOnFacebook: vi.fn(),
      shareOnWhatsApp: vi.fn(),
      copyLink: vi.fn(() => ({ subscribe: vi.fn() })),
    };
    TestBed.configureTestingModule({
      imports: [ShareButtonsComponent],
      providers: [
        { provide: ShareService, useValue: shareService },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(ShareButtonsComponent);
    fixture.componentRef.setInput('productSlug', 'air-max');
    fixture.componentRef.setInput('productName', 'Air Max');
    fixture.componentRef.setInput('productPrice', 25000);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.share-buttons__btn--facebook').click();
    expect(shareService.shareOnFacebook).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/produit/air-max'),
        title: 'Air Max',
      }),
    );
  });

  it('appelle le partage WhatsApp', () => {
    const shareService = {
      shareOnFacebook: vi.fn(),
      shareOnWhatsApp: vi.fn(),
      copyLink: vi.fn(() => ({ subscribe: vi.fn() })),
    };
    TestBed.configureTestingModule({
      imports: [ShareButtonsComponent],
      providers: [
        { provide: ShareService, useValue: shareService },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(ShareButtonsComponent);
    fixture.componentRef.setInput('productSlug', 'air-max');
    fixture.componentRef.setInput('productName', 'Air Max');
    fixture.componentRef.setInput('productPrice', 25000);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.share-buttons__btn--whatsapp').click();
    expect(shareService.shareOnWhatsApp).toHaveBeenCalled();
  });

  it('affiche un toast après copie réussie', () => {
    const toast = { success: vi.fn(), error: vi.fn() };
    const shareService = {
      shareOnFacebook: vi.fn(),
      shareOnWhatsApp: vi.fn(),
      copyLink: vi.fn(() => ({ subscribe: (cb: (v: boolean) => void) => cb(true) })),
    };
    TestBed.configureTestingModule({
      imports: [ShareButtonsComponent],
      providers: [
        { provide: ShareService, useValue: shareService },
        { provide: ToastService, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(ShareButtonsComponent);
    fixture.componentRef.setInput('productSlug', 'air-max');
    fixture.componentRef.setInput('productName', 'Air Max');
    fixture.componentRef.setInput('productPrice', 25000);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.share-buttons__btn--copy').click();
    expect(toast.success).toHaveBeenCalledWith('Lien copié !');
  });
});
