import { Service, signal } from '@angular/core';

/**
 * Carries a one-time success message from a student write flow to the page that
 * displays the result. It intentionally lives in memory so a refresh clears it.
 */
@Service()
export class StudentFeedbackService {
  private readonly current = signal<string | null>(null);

  readonly message = this.current.asReadonly();

  set(message: string): void {
    this.current.set(message);
  }

  clear(): void {
    this.current.set(null);
  }
}
