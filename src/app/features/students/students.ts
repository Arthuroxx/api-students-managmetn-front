import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Subscription } from 'rxjs';
import { readApiErrorMessage } from '../../core/http/api-error';
import type {
  PaginatedStudents,
  Student,
  StudentFilters,
  StudentPageSize,
  StudentQuery,
  StudentsPageMeta,
} from './students.models';
import { STUDENT_PAGE_SIZES, isStudentPageSize } from './students.models';
import { StudentsService } from './students.service';

const FILTER_DEBOUNCE_MS = 300;

interface FilterDraft {
  firstName: string;
  lastName: string;
  email: string;
}

@Component({
  selector: 'sms-students',
  templateUrl: './students.html',
  styleUrl: './students.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Students {
  private readonly studentsService = inject(StudentsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSizes = STUDENT_PAGE_SIZES;
  protected readonly skeletonRows = [0, 1, 2, 3, 4] as const;
  protected readonly filters = signal<FilterDraft>({
    firstName: '',
    lastName: '',
    email: '',
  });
  protected readonly students = signal<readonly Student[]>([]);
  protected readonly meta = signal<StudentsPageMeta | null>(null);
  protected readonly page = signal(1);
  protected readonly limit = signal<StudentPageSize>(10);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly appliedFilters = signal<StudentFilters>({});
  private filterTimer: ReturnType<typeof setTimeout> | null = null;
  private request: Subscription | null = null;

  private readonly birthDateFormatter = new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  private readonly createdAtFormatter = new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  protected readonly query = computed<StudentQuery>(() => ({
    page: this.page(),
    limit: this.limit(),
    ...this.appliedFilters(),
  }));
  protected readonly total = computed(() => this.meta()?.total ?? 0);
  protected readonly totalPages = computed(() => Math.max(this.meta()?.totalPages ?? 1, 1));
  protected readonly rangeStart = computed(() =>
    this.total() === 0 ? 0 : (this.page() - 1) * this.limit() + 1,
  );
  protected readonly rangeEnd = computed(() => Math.min(this.page() * this.limit(), this.total()));
  protected readonly canGoPrevious = computed(() => this.page() > 1);
  protected readonly canGoNext = computed(() => this.page() < this.totalPages());
  protected readonly showSkeleton = computed(() => this.loading() && this.students().length === 0);
  protected readonly hasFilterInput = computed(() =>
    Object.values(this.filters()).some((value) => value.trim().length > 0),
  );
  protected readonly hasActiveFilters = computed(
    () => Object.keys(this.appliedFilters()).length > 0,
  );
  protected readonly statusMessage = computed(() => {
    if (this.loading()) {
      return 'Loading students';
    }

    if (this.error()) {
      return 'Students could not be loaded';
    }

    if (this.total() === 0) {
      return this.hasActiveFilters() ? 'No students match the filters' : 'No students found';
    }

    return `Showing students ${this.rangeStart()} to ${this.rangeEnd()} of ${this.total()}`;
  });

  constructor() {
    this.load();
  }

  protected onFilterInput(field: keyof FilterDraft, event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value;

    if (value === undefined) {
      return;
    }

    this.filters.update((current) => ({ ...current, [field]: value }));
    this.scheduleFilterApply();
  }

  protected submitFilters(event: Event): void {
    event.preventDefault();
    this.cancelPendingFilter();
    this.applyFilters();
  }

  protected clearFilters(): void {
    this.cancelPendingFilter();
    this.filters.set({ firstName: '', lastName: '', email: '' });
    this.appliedFilters.set({});
    this.page.set(1);
    this.load();
  }

  protected changePageSize(event: Event): void {
    const size = Number((event.target as HTMLSelectElement | null)?.value);

    if (!isStudentPageSize(size) || size === this.limit()) {
      return;
    }

    this.limit.set(size);
    this.page.set(1);
    this.load();
  }

  protected previousPage(): void {
    if (!this.canGoPrevious()) {
      return;
    }

    this.page.update((page) => page - 1);
    this.load();
  }

  protected nextPage(): void {
    if (!this.canGoNext()) {
      return;
    }

    this.page.update((page) => page + 1);
    this.load();
  }

  protected retry(): void {
    this.load();
  }

  protected initials(student: Student): string {
    const initials = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.trim();

    return (initials || '?').toUpperCase();
  }

  protected fullName(student: Student): string {
    return `${student.firstName} ${student.lastName}`.trim();
  }

  protected formatBirthDate(value: string): string {
    return this.formatDate(value, this.birthDateFormatter);
  }

  protected formatCreatedAt(value: string): string {
    return this.formatDate(value, this.createdAtFormatter);
  }

  private scheduleFilterApply(): void {
    this.cancelPendingFilter();
    this.filterTimer = setTimeout(() => {
      this.filterTimer = null;
      this.applyFilters();
    }, FILTER_DEBOUNCE_MS);
  }

  private cancelPendingFilter(): void {
    if (this.filterTimer !== null) {
      clearTimeout(this.filterTimer);
      this.filterTimer = null;
    }
  }

  private applyFilters(): void {
    const draft = this.filters();
    const firstName = draft.firstName.trim();
    const lastName = draft.lastName.trim();
    const email = draft.email.trim();
    const filters: StudentFilters = {
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(email ? { email } : {}),
    };

    this.appliedFilters.set(filters);
    this.page.set(1);
    this.load();
  }

  private load(): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    this.request = this.studentsService
      .list(this.query())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: PaginatedStudents) => {
          this.students.set(response.data);
          this.meta.set(response.meta);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.students.set([]);
          this.meta.set(null);
          this.error.set(this.describeError(error));
          this.loading.set(false);
        },
      });
  }

  private describeError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Students could not be loaded. Please try again.';
    }

    switch (error.status) {
      case 400:
        return 'The filters are invalid. Adjust them and try again.';
      case 403:
        return 'You do not have permission to view students.';
      case 0:
        return 'The API is unreachable. Check that it is running and try again.';
      default:
        return (
          readApiErrorMessage(error.error) ?? 'Students could not be loaded. Please try again.'
        );
    }
  }

  private formatDate(value: string, formatter: Intl.DateTimeFormat): string {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '—' : formatter.format(date);
  }
}
