import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { ContactApi, PublicConfigService } from '@bruny/data-access';

import { APP_CONFIG, DEFAULT_APP_CONFIG } from '../../core/app-config';
import { ContactComponent } from './contact.component';

const SUCCESS = {
  id: 'msg-1',
  receivedAt: '2026-11-16T10:30:00.000Z',
  message: 'Votre message est envoyé. Nous répondons sous 24 h ouvrées.',
};

async function create(submit: () => unknown = () => of(SUCCESS)) {
  TestBed.resetTestingModule();
  const api = { submit: vi.fn(submit) };
  const publicConfig = {
    getConfig: vi.fn(() => of({ turnstileEnabled: false, turnstileSiteKey: null })),
  };

  await TestBed.configureTestingModule({
    imports: [ContactComponent],
    providers: [
      provideRouter([]),
      { provide: ContactApi, useValue: api },
      { provide: PublicConfigService, useValue: publicConfig },
      { provide: APP_CONFIG, useValue: DEFAULT_APP_CONFIG },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ContactComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, api, publicConfig };
}

function fillValidForm(fixture: ComponentFixture<ContactComponent>) {
  const component = fixture.componentInstance;
  component.form.patchValue({
    name: 'Awa Mbarga',
    email: 'Awa@Example.cm',
    phone: '699 00 00 01',
    subject: 'order',
    orderReference: 'brn-2611-7k3f',
    message: 'Bonjour, je souhaite suivre ma commande passée hier.',
    consent: true,
  });
  fixture.detectChanges();
}

describe('ContactComponent (MKT-02)', () => {
  it('renders the P22 content, form and accessible direct contact buttons', async () => {
    const { fixture } = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Contactez-nous');
    expect(element.textContent).toContain('Nous répondons sous 24 h ouvrées');
    expect(element.querySelector('input#contact-name')).not.toBeNull();
    expect(element.querySelector('input#contact-email')).not.toBeNull();
    expect(element.querySelector('select#contact-subject')).not.toBeNull();
    expect(element.querySelector('textarea#contact-message')).not.toBeNull();

    const whatsapp = element.querySelector('.contact-direct--whatsapp') as HTMLAnchorElement;
    expect(whatsapp.getAttribute('href')).toBe('https://wa.me/237600000000');
    expect(whatsapp.getAttribute('target')).toBe('_blank');
    expect(whatsapp.getAttribute('rel')).toContain('noopener');

    const phone = element.querySelector('.contact-direct--phone') as HTMLAnchorElement;
    expect(phone.getAttribute('href')).toBe('tel:+237600000000');

    const facebook = element.querySelector('.contact-direct--facebook') as HTMLAnchorElement;
    expect(facebook.getAttribute('href')).toBe('https://www.facebook.com/BrunyShopping');
    expect(element.querySelector('iframe')).toBeNull();
  });

  it('marks required fields and does not call the API when invalid', async () => {
    const { fixture, api } = await create();

    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(api.submit).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Indiquez votre nom.');
    expect(fixture.nativeElement.textContent).toContain('Choisissez le sujet de votre demande.');
    expect(fixture.nativeElement.textContent).toContain('Écrivez votre message.');
  });

  it('validates phone, order reference and minimum message length', async () => {
    const { fixture } = await create();
    const component = fixture.componentInstance;

    component.form.controls.phone.setValue('123');
    component.form.controls.phone.markAsTouched();
    component.form.controls.orderReference.setValue('123');
    component.form.controls.orderReference.markAsTouched();
    component.form.controls.message.setValue('court');
    component.form.controls.message.markAsTouched();

    expect(component.phoneError()).toContain('9 chiffres après +237');
    expect(component.orderReferenceError()).toContain('BRN-2611-7K3F');
    expect(component.messageError()).toContain('au moins 20 caractères');
  });

  it('sends normalized values and displays a clear confirmation with its reference', async () => {
    const { fixture, api } = await create();
    fillValidForm(fixture);

    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(api.submit).toHaveBeenCalledWith({
      name: 'Awa Mbarga',
      email: 'awa@example.cm',
      phone: '+237699000001',
      subject: 'order',
      orderReference: 'BRN-2611-7K3F',
      message: 'Bonjour, je souhaite suivre ma commande passée hier.',
      consent: true,
    });
    expect(fixture.nativeElement.textContent).toContain('Message envoyé');
    expect(fixture.nativeElement.textContent).toContain('msg-1');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('explains the rate limit returned by the API', async () => {
    const rateLimited = new HttpErrorResponse({
      status: 429,
      error: { code: 'RATE_LIMITED' },
    });
    const { fixture } = await create(() => throwError(() => rateLimited));
    fillValidForm(fixture);

    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Trop de messages ont été envoyés. Patientez une minute avant de réessayer.',
    );
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('loads CAPTCHA configuration and requires a token when Turnstile is enabled', async () => {
    TestBed.resetTestingModule();
    const api = { submit: vi.fn(() => of(SUCCESS)) };
    const publicConfig = {
      getConfig: vi.fn(() => of({ turnstileEnabled: true, turnstileSiteKey: 'site-key' })),
    };
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        provideRouter([]),
        { provide: ContactApi, useValue: api },
        { provide: PublicConfigService, useValue: publicConfig },
        { provide: APP_CONFIG, useValue: DEFAULT_APP_CONFIG },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ContactComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fillValidForm(fixture);

    expect(fixture.componentInstance.captchaEnabled()).toBe(true);
    expect(fixture.nativeElement.querySelector('bruny-captcha')).not.toBeNull();
    expect(fixture.componentInstance.form.controls.turnstileToken.invalid).toBe(true);

    fixture.componentInstance.onSubmit();
    expect(api.submit).not.toHaveBeenCalled();
  });
});
