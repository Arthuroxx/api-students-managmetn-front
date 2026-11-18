import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../testing/a11y';
import { ConfirmDialog } from './confirm-dialog';

@Component({
  imports: [ConfirmDialog],
  template: `
    <sms-confirm-dialog
      [open]="open()"
      heading="Delete student"
      [message]="message()"
      confirmLabel="Delete student"
      [busy]="busy()"
      [error]="error()"
      (confirmed)="confirm()"
      (cancelled)="cancel()"
    />
  `,
})
class Host {
  readonly open = signal(false);
  readonly message = signal('Delete Ana Lopez?');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly confirmed = signal(0);
  readonly cancelled = signal(0);

  confirm(): void {
    this.confirmed.update((value) => value + 1);
  }

  cancel(): void {
    this.cancelled.update((value) => value + 1);
  }
}

describe('ConfirmDialog', () => {
  async function settle(fixture: ComponentFixture<Host>): Promise<HTMLElement> {
    await fixture.whenStable();
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  async function render(): Promise<ComponentFixture<Host>> {
    const fixture = TestBed.createComponent(Host);

    await settle(fixture);

    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  });

  it('should stay closed until the open input is true', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('dialog')?.hasAttribute('open')).toBe(false);
  });

  it('should open accessibly and emit a confirmation', async () => {
    const fixture = await render();

    fixture.componentInstance.open.set(true);
    const element = await settle(fixture);
    const dialog = element.querySelector('dialog');

    expect(dialog?.hasAttribute('open')).toBe(true);
    expect(dialog?.getAttribute('aria-label')).toBe('Delete student');
    expect(element.querySelector('.confirm__message')?.textContent).toContain('Ana Lopez');

    element.querySelector<HTMLButtonElement>('.confirm__confirm')?.click();
    await settle(fixture);

    expect(fixture.componentInstance.confirmed()).toBe(1);
  });

  it('should emit a cancellation from the cancel button', async () => {
    const fixture = await render();

    fixture.componentInstance.open.set(true);
    const element = await settle(fixture);

    element.querySelector<HTMLButtonElement>('.confirm__cancel')?.click();
    await settle(fixture);

    expect(fixture.componentInstance.cancelled()).toBe(1);
  });

  it('should treat Escape as a cancellation', async () => {
    const fixture = await render();

    fixture.componentInstance.open.set(true);
    const element = await settle(fixture);

    element.querySelector('dialog')?.dispatchEvent(new Event('cancel', { cancelable: true }));

    expect(fixture.componentInstance.cancelled()).toBe(1);
  });

  it('should disable both actions and ignore cancellation while busy', async () => {
    const fixture = await render();

    fixture.componentInstance.open.set(true);
    fixture.componentInstance.busy.set(true);
    const element = await settle(fixture);

    const cancel = element.querySelector<HTMLButtonElement>('.confirm__cancel');
    const confirm = element.querySelector<HTMLButtonElement>('.confirm__confirm');

    expect(cancel?.disabled).toBe(true);
    expect(confirm?.disabled).toBe(true);
    expect(confirm?.textContent).toContain('Working');

    cancel?.click();
    await settle(fixture);

    expect(fixture.componentInstance.cancelled()).toBe(0);
    expect(fixture.componentInstance.confirmed()).toBe(0);
  });

  it('should show an error message', async () => {
    const fixture = await render();

    fixture.componentInstance.open.set(true);
    fixture.componentInstance.error.set('You do not have permission to delete student records.');
    const element = await settle(fixture);

    expect(element.querySelector('.confirm__error')?.textContent).toContain('permission');
  });

  it('should close when the open input becomes false', async () => {
    const fixture = await render();

    fixture.componentInstance.open.set(true);
    await settle(fixture);
    fixture.componentInstance.open.set(false);
    const element = await settle(fixture);

    expect(element.querySelector('dialog')?.hasAttribute('open')).toBe(false);
  });

  it('should have no WCAG 2.2 AA violations while open', async () => {
    const fixture = await render();

    fixture.componentInstance.open.set(true);
    const element = await settle(fixture);

    await expectNoA11yViolations(element);
  });
});
