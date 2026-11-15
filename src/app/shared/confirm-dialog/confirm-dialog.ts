import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import type { ElementRef } from '@angular/core';

@Component({
  selector: 'sms-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  readonly open = input(false);
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
  readonly error = input<string | null>(null);
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly document = inject(DOCUMENT);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');
  private previouslyFocused: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const dialog = this.dialog()?.nativeElement;

      if (!dialog) {
        return;
      }

      if (this.open()) {
        this.show(dialog);
      } else {
        this.hide(dialog);
      }
    });
  }

  protected cancel(): void {
    if (this.busy()) {
      return;
    }

    this.cancelled.emit();
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.cancel();
  }

  private show(dialog: HTMLDialogElement): void {
    if (dialog.hasAttribute('open')) {
      return;
    }

    this.previouslyFocused =
      this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
      this.cancelButton()?.nativeElement.focus();
    }
  }

  private hide(dialog: HTMLDialogElement): void {
    if (!dialog.hasAttribute('open')) {
      return;
    }

    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }

    this.previouslyFocused?.focus();
    this.previouslyFocused = null;
  }
}
