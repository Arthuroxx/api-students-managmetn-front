import { VERSION } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expectNoA11yViolations } from '../../testing/a11y';
import { Welcome } from './welcome';

describe('Welcome', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Welcome],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render the page heading and a link to the student workspace', async () => {
    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain(
      'A calmer way to manage student records.',
    );
    expect(element.querySelector('.button')?.getAttribute('href')).toBe('/students');
  });

  it('should show the installed Angular version', async () => {
    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(VERSION.full);
  });

  it('should have no WCAG 2.2 AA violations', async () => {
    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    await expectNoA11yViolations(fixture.nativeElement as HTMLElement);
  });
});
