import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { ThemeMode } from '../../core/theme/theme.service';
import { ThemeService } from '../../core/theme/theme.service';

const NEXT_MODE: Readonly<Record<ThemeMode, string>> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

@Component({
  selector: 'sms-app-header',
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  readonly title = input.required<string>();
  readonly menuExpanded = input(false);
  readonly menuToggled = output<void>();

  protected readonly theme = inject(ThemeService);
  protected readonly themeActionLabel = computed(
    () => `Switch to ${NEXT_MODE[this.theme.mode()]} theme`,
  );
}
