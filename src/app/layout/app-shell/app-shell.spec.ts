import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
});
