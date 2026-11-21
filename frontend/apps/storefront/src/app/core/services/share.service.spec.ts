import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ShareService } from './share.service';

describe('ShareService', () => {
  it('ouvre le dialog Facebook avec l’URL encodée', () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    const service = TestBed.inject(ShareService);

    service.shareOnFacebook({ url: 'https://brunyshop.cm/produit/air-max', title: 'Air Max' });

    expect(open).toHaveBeenCalledWith(
      'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fbrunyshop.cm%2Fproduit%2Fair-max',
      '_blank',
      'noopener,noreferrer,width=600,height=600',
    );
  });

  it('ouvre WhatsApp avec le message produit', () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    const service = TestBed.inject(ShareService);

    service.shareOnWhatsApp({ url: 'https://brunyshop.cm/produit/air-max', title: 'Air Max' });

    const calledUrl = open.mock.calls[0][0] as string;
    expect(calledUrl).toContain('https://wa.me/?text=');
    expect(decodeURIComponent(calledUrl)).toContain(
      'Regarde ce produit sur BrunyShop : Air Max — https://brunyshop.cm/produit/air-max',
    );
  });

  it('copie le lien avec l’API Clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    const service = TestBed.inject(ShareService);

    const result = await new Promise<boolean>((resolve) => {
      service.copyLink('https://brunyshop.cm/produit/air-max').subscribe(resolve);
    });

    expect(writeText).toHaveBeenCalledWith('https://brunyshop.cm/produit/air-max');
    expect(result).toBe(true);
  });

  it('utilise le fallback execCommand si le clipboard est indisponible', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });
    if (!('execCommand' in document)) {
      (document as unknown as { execCommand: (command: string) => boolean }).execCommand = vi.fn();
    }
    const execCommand = vi.spyOn(document, 'execCommand' as never).mockReturnValue(true);
    const service = TestBed.inject(ShareService);

    const result = await new Promise<boolean>((resolve) => {
      service.copyLink('https://brunyshop.cm/produit/air-max').subscribe(resolve);
    });

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(result).toBe(true);
    execCommand.mockRestore();
  });

  it('utilise le Web Share API si disponible', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const service = TestBed.inject(ShareService);

    const result = await service.shareNative({
      url: 'https://brunyshop.cm/produit/air-max',
      title: 'Air Max',
    });

    expect(share).toHaveBeenCalledWith({
      title: 'Air Max',
      text: 'Air Max',
      url: 'https://brunyshop.cm/produit/air-max',
    });
    expect(result).toBe(true);
  });
});
