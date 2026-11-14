import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BrandMark } from '../../shared/brand/brand-mark';
import { NAV_ITEMS } from '../navigation';

@Component({
  selector: 'sms-app-sidebar',
  imports: [BrandMark, RouterLink, RouterLinkActive],
  templateUrl: './app-sidebar.html',
  styleUrl: './app-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebar {
  readonly open = input(false);
  readonly closed = output<void>();
  readonly navigated = output<void>();

  protected readonly items = NAV_ITEMS;
}
