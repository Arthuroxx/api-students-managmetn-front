import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AppHeader } from '../app-header/app-header';
import { AppSidebar } from '../app-sidebar/app-sidebar';

@Component({
  selector: 'sms-app-shell',
  imports: [AppHeader, AppSidebar, RouterOutlet],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeSidebar()',
  },
})
export class AppShell {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  protected readonly sidebarOpen = signal(false);
  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.activeTitle()),
    ),
    { initialValue: this.activeTitle() },
  );

  constructor() {
    effect((onCleanup) => {
      if (!this.sidebarOpen()) {
        return;
      }

      const { body } = this.document;
      const previousOverflow = body.style.overflow;

      body.style.overflow = 'hidden';
      onCleanup(() => {
        body.style.overflow = previousOverflow;
      });
    });
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  private activeTitle(): string {
    let route = this.router.routerState.snapshot.root;

    while (route.firstChild) {
      route = route.firstChild;
    }

    return route.title ?? 'Student Management';
  }
}
