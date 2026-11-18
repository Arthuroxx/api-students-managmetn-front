import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expectNoA11yViolations } from '../../testing/a11y';
import { Forbidden } from './forbidden';

function text(element: HTMLElement, selector: string): string {
  return element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

describe('Forbidden', () => {
  it('should explain the permission error and offer a way back', async () => {
    await TestBed.configureTestingModule({
      imports: [Forbidden],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(Forbidden);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const links = Array.from(element.querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    );

    expect(text(element, 'h1')).toBe('Access denied');
    expect(text(element, '.forbidden__code')).toBe('403');
    expect(text(element, '.forbidden__lede')).toContain('does not have permission');
    expect(links).toEqual(['/students', '/']);
  });

  it('should have no WCAG 2.2 AA violations', async () => {
    await TestBed.configureTestingModule({
      imports: [Forbidden],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(Forbidden);
    await fixture.whenStable();

    await expectNoA11yViolations(fixture.nativeElement as HTMLElement);
  });
});
