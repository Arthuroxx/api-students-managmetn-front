import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppHeader } from './app-header';

describe('AppHeader', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AppHeader],
      providers: [provideRouter([])],
    }).compileComponents();
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
});
