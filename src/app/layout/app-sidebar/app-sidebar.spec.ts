import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppSidebar } from './app-sidebar';

describe('AppSidebar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSidebar],
      providers: [
        provideRouter([
          { path: '', children: [] },
          { path: 'students', children: [] },
        ]),
      ],
    }).compileComponents();
  });

  it('should render the navigation links', async () => {
    const fixture = TestBed.createComponent(AppSidebar);
    await fixture.whenStable();

    const links = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.sidebar__link'),
    );

    expect(links.map((link) => link.textContent?.trim())).toEqual(['Overview', 'Students']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/', '/students']);
  });

  it('should mark the active route for assistive technology', async () => {
    const fixture = TestBed.createComponent(AppSidebar);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.sidebar__link')
        ?.getAttribute('aria-current'),
    ).toBe('page');
  });

  it('should emit when a navigation link or the close control is used', async () => {
    const fixture = TestBed.createComponent(AppSidebar);
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();

    let navigated = 0;
    let closed = 0;
    fixture.componentInstance.navigated.subscribe(() => {
      navigated += 1;
    });
    fixture.componentInstance.closed.subscribe(() => {
      closed += 1;
    });

    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLAnchorElement>('.sidebar__link')?.click();
    element.querySelector<HTMLButtonElement>('.sidebar__close')?.click();

    expect(navigated).toBe(1);
    expect(closed).toBe(1);
  });
});
