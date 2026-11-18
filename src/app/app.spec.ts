import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { expectNoA11yViolations } from './testing/a11y';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a skip link to the main content', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const skipLink = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      '.skip-link',
    );

    expect(skipLink?.textContent).toContain('Skip to main content');
    expect(skipLink?.getAttribute('href')).toBe('#main-content');
  });

  it('should have no WCAG 2.2 AA violations', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    await expectNoA11yViolations(fixture.nativeElement as HTMLElement);
  });
});
