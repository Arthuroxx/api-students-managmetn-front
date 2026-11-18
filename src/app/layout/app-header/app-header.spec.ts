import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AUTH_STORAGE_KEY } from '../../core/auth/auth.service';
import { AppHeader } from './app-header';

describe('AppHeader', () => {
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AppHeader],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render the page title and navigation state', async () => {
    const fixture = TestBed.createComponent(AppHeader);
    fixture.componentRef.setInput('title', 'Students');
    fixture.componentRef.setInput('menuExpanded', true);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.app-header__title')?.textContent).toContain('Students');
    expect(element.querySelector('.app-header__menu')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('should emit when the navigation button is used', async () => {
    const fixture = TestBed.createComponent(AppHeader);
    fixture.componentRef.setInput('title', 'Overview');
    await fixture.whenStable();

    let toggled = false;
    fixture.componentInstance.menuToggled.subscribe(() => {
      toggled = true;
    });

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.app-header__menu')
      ?.click();

    expect(toggled).toBe(true);
  });

  it('should switch themes from the header control', async () => {
    const fixture = TestBed.createComponent(AppHeader);
    fixture.componentRef.setInput('title', 'Overview');
    await fixture.whenStable();

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.app-header__theme',
    );

    button?.click();
    fixture.detectChanges();

    expect(button?.getAttribute('aria-label')).toBe('Switch to dark theme');
  });

  it('should hide the account section for guests', async () => {
    const fixture = TestBed.createComponent(AppHeader);
    fixture.componentRef.setInput('title', 'Overview');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('.app-header__account')).toBeNull();
  });

  it('should show the signed-in account and clear it on sign out', async () => {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'signed-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3_600_000,
        role: 'ADMIN',
        email: 'admin@example.com',
      }),
    );

    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(AppHeader);
    fixture.componentRef.setInput('title', 'Overview');
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.app-header__account-email')?.textContent).toContain(
      'admin@example.com',
    );
    expect(element.querySelector('.app-header__account-role')?.textContent).toContain('ADMIN');

    element.querySelector<HTMLButtonElement>('.app-header__signout')?.click();

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
