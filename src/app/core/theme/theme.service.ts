import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Service, signal } from '@angular/core';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'student-management.theme';
const MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];

@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly mediaQuery =
    this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
  private readonly systemPrefersDark = signal(this.mediaQuery?.matches ?? false);
  private readonly selectedMode = signal<ThemeMode>(this.readStoredMode());

  readonly mode = this.selectedMode.asReadonly();
  readonly resolvedMode = computed<ResolvedTheme>(() => {
    const mode = this.selectedMode();

    if (mode === 'system') {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }

    return mode;
  });

  constructor() {
    this.mediaQuery?.addEventListener('change', this.onSystemThemeChange);
    effect(() => this.applyMode(this.selectedMode()));
  }

  setMode(mode: ThemeMode): void {
    this.selectedMode.set(mode);
    this.persist(mode);
  }

  cycle(): void {
    const currentIndex = MODES.indexOf(this.selectedMode());
    const nextMode = MODES[(currentIndex + 1) % MODES.length] ?? 'system';

    this.setMode(nextMode);
  }

  private readonly onSystemThemeChange = (event: MediaQueryListEvent): void => {
    this.systemPrefersDark.set(event.matches);
  };

  private applyMode(mode: ThemeMode): void {
    const root = this.document.documentElement;

    if (mode === 'system') {
      delete root.dataset['theme'];
      return;
    }

    root.dataset['theme'] = mode;
  }

  private readStoredMode(): ThemeMode {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);

      return MODES.includes(stored as ThemeMode) ? (stored as ThemeMode) : 'system';
    } catch {
      return 'system';
    }
  }

  private persist(mode: ThemeMode): void {
    try {
      if (mode === 'system') {
        this.document.defaultView?.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Storage can be unavailable in private browsing contexts; the in-memory choice still applies.
    }
  }
}
