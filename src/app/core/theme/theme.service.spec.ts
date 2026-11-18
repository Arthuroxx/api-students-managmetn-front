import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const root = document.documentElement;

  beforeEach(() => {
    localStorage.clear();
    delete root.dataset['theme'];
  });

  afterEach(() => {
    localStorage.clear();
    delete root.dataset['theme'];
  });

  it('should use the system theme by default', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.tick();

    expect(service.mode()).toBe('system');
    expect(root.dataset['theme']).toBeUndefined();
  });

  it('should apply and persist an explicit theme', () => {
    const service = TestBed.inject(ThemeService);

    service.setMode('dark');
    TestBed.tick();

    expect(service.mode()).toBe('dark');
    expect(root.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('student-management.theme')).toBe('dark');
  });

  it('should cycle through system, light, and dark', () => {
    const service = TestBed.inject(ThemeService);

    service.cycle();
    expect(service.mode()).toBe('light');

    service.cycle();
    expect(service.mode()).toBe('dark');

    service.cycle();
    TestBed.tick();

    expect(service.mode()).toBe('system');
    expect(root.dataset['theme']).toBeUndefined();
  });
});
