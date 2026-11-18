import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expectNoA11yViolations } from '../../testing/a11y';
import { AppShell } from './app-shell';

describe('AppShell', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', children: [] },
          { path: 'students', children: [] },
        ]),
      ],
    }).compileComponents();
  });

  it('should render the shell landmarks', async () => {
    const fixture = TestBed.createComponent(AppShell);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('main#main-content')).not.toBeNull();
    expect(element.querySelector('sms-app-header')).not.toBeNull();
    expect(element.querySelector('sms-app-sidebar')).not.toBeNull();
  });

  it('should toggle the mobile navigation drawer', async () => {
    const fixture = TestBed.createComponent(AppShell);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.app-header__menu')?.click();
    fixture.detectChanges();

    expect(element.querySelector('.sidebar.is-open')).not.toBeNull();
    expect(element.querySelector('.shell__backdrop')).not.toBeNull();
    expect(document.body.style.overflow).toBe('hidden');

    element.querySelector<HTMLButtonElement>('.shell__backdrop')?.click();
    fixture.detectChanges();

    expect(element.querySelector('.sidebar.is-open')).toBeNull();
    expect(element.querySelector('.shell__backdrop')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('should close the drawer with the Escape key', async () => {
    const fixture = TestBed.createComponent(AppShell);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.app-header__menu')?.click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(element.querySelector('.sidebar.is-open')).toBeNull();
  });

  it('should move focus into the drawer and restore it on close', async () => {
    const fixture = TestBed.createComponent(AppShell);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const menu = element.querySelector<HTMLButtonElement>('.app-header__menu');
    // jsdom does not evaluate media queries, so the mobile-only trigger stays display:none.
    // Force it visible to exercise the focus-restore path.
    menu!.style.display = 'inline-flex';
    menu?.focus();
    menu?.click();
    await fixture.whenStable();

    expect(element.querySelector('.shell__body')?.hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(element.querySelector('#app-sidebar'));

    element.querySelector<HTMLButtonElement>('.shell__backdrop')?.click();
    await fixture.whenStable();

    expect(element.querySelector('.shell__body')?.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(menu);
  });

  it('should have no WCAG 2.2 AA violations', async () => {
    const fixture = TestBed.createComponent(AppShell);
    await fixture.whenStable();

    await expectNoA11yViolations(fixture.nativeElement as HTMLElement);
  });
});
