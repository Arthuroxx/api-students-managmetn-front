import { TestBed } from '@angular/core/testing';
import { BrandMark } from './brand-mark';

describe('BrandMark', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandMark],
    }).compileComponents();
  });

  it('should render the product name by default', async () => {
    const fixture = TestBed.createComponent(BrandMark);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.brand-mark__name')?.textContent).toContain('Student Management');
  });

  it('should hide the product name when requested', async () => {
    const fixture = TestBed.createComponent(BrandMark);
    fixture.componentRef.setInput('showName', false);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.brand-mark__name')).toBeNull();
  });
});
