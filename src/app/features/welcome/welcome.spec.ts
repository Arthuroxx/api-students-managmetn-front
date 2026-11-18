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

  it('should render the welcome heading and a link to the student list', async () => {
    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const action = element.querySelector('a');

    expect(element.querySelector('h1')?.textContent).toContain('Student Management');
    expect(action?.textContent?.trim()).toBe('View Students');
    expect(action?.getAttribute('href')).toBe('/students');
  });

  it('should have no WCAG 2.2 AA violations', async () => {
    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    await expectNoA11yViolations(fixture.nativeElement as HTMLElement);
  });
});
