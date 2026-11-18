import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { describeApiError, type ApiErrorMessages } from '../../core/http/api-error';
import { formatTimestamp, studentFullName } from '../students/students.format';
import type { Student } from '../students/students.models';
import { StudentsService } from '../students/students.service';

const RECENT_LIMIT = 5;

const OVERVIEW_ERROR_MESSAGES: ApiErrorMessages = {
  fallback: 'The overview could not be loaded. Please try again.',
  byStatus: {
    403: 'You do not have permission to view student information.',
  },
};

@Component({
  selector: 'sms-welcome',
  imports: [RouterLink],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Welcome {
  private readonly studentsService = inject(StudentsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly skeletonRows = [0, 1, 2, 3, 4] as const;
  protected readonly total = signal(0);
  protected readonly recent = signal<readonly Student[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly fullName = studentFullName;
  protected readonly formatCreatedAt = formatTimestamp;

  protected readonly statusMessage = computed(() => {
    if (this.loading()) {
      return 'Loading overview';
    }

    if (this.error()) {
      return 'Overview could not be loaded';
    }

    if (this.total() === 0) {
      return 'No students yet';
    }

    return `${this.total()} students registered`;
  });

  constructor() {
    this.load();
  }

  protected retry(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.studentsService
      .list({ page: 1, limit: RECENT_LIMIT })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.total.set(response.meta.total);
          this.recent.set(response.data);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.total.set(0);
          this.recent.set([]);
          this.error.set(describeApiError(error, OVERVIEW_ERROR_MESSAGES));
          this.loading.set(false);
        },
      });
  }
}
