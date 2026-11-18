import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Students } from './students';

describe('Students', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Students],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render the placeholder page heading', async () => {
    const fixture = TestBed.createComponent(Students);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Students');
    expect(element.querySelector('.students__empty h2')?.textContent).toContain(
      'Student list coming next',
    );
  });
});
