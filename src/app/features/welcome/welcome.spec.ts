import { VERSION } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Welcome } from './welcome';

describe('Welcome', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Welcome],
    }).compileComponents();
  });

  it('should render the page heading and main landmark', async () => {
    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('main#main-content')).not.toBeNull();
    expect(element.querySelector('h1')?.textContent).toContain(
      'A calmer way to manage student records.',
    );
  });

  it('should show the installed Angular version', async () => {
    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(VERSION.full);
  });
});
