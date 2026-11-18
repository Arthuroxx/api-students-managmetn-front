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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthorizationService } from '../../../core/auth/authorization.service';
import { describeApiError, type ApiErrorMessages } from '../../../core/http/api-error';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { StudentFeedbackService } from '../student-feedback.service';
import {
  formatBirthDate,
  formatTimestamp,
  studentFullName,
  studentInitials,
} from '../students.format';
import type { Student } from '../students.models';
import { StudentsService } from '../students.service';

const LOAD_ERROR_MESSAGES: ApiErrorMessages = {
  fallback: 'The student could not be loaded. Please try again.',
  byStatus: {
    403: 'You do not have permission to view this student.',
  },
};

const DELETE_ERROR_MESSAGES: ApiErrorMessages = {
  fallback: 'The student could not be deleted. Please try again.',
  byStatus: {
    403: 'You do not have permission to delete student records.',
    404: 'This student no longer exists.',
  },
};

@Component({
  selector: 'sms-student-detail',
  imports: [ConfirmDialog, RouterLink],
  templateUrl: './student-detail.html',
  styleUrl: './student-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDetail {
  private readonly students = inject(StudentsService);
  private readonly feedback = inject(StudentFeedbackService);
  private readonly authorization = inject(AuthorizationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly canManage = this.authorization.canManageStudents;
  protected readonly studentId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly student = signal<Student | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly confirmOpen = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  protected readonly fullName = studentFullName;
  protected readonly initials = studentInitials;
  protected readonly birthDate = formatBirthDate;
  protected readonly timestamp = formatTimestamp;

  protected readonly deleteMessage = computed(() => {
    const student = this.student();

    if (!student) {
      return 'Delete this student record? This action cannot be undone.';
    }

    return `Delete ${studentFullName(student)}? The record will be permanently removed and cannot be recovered.`;
  });

  constructor() {
    this.consumeNotice();
    this.load();
  }

  protected retry(): void {
    this.load();
  }

  protected requestDelete(): void {
    if (!this.canManage()) {
      return;
    }

    this.deleteError.set(null);
    this.confirmOpen.set(true);
  }

  protected cancelDelete(): void {
    if (this.deleting()) {
      return;
    }

    this.confirmOpen.set(false);
  }

  protected confirmDelete(): void {
    if (this.deleting() || !this.student()) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.students
      .remove(this.studentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deleting.set(false);
          this.confirmOpen.set(false);
          this.feedback.set('Student deleted successfully.');
          void this.router.navigate(['/students']);
        },
        error: (error: unknown) => {
          this.deleting.set(false);
          this.deleteError.set(describeApiError(error, DELETE_ERROR_MESSAGES));
        },
      });
  }

  private consumeNotice(): void {
    const message = this.feedback.message();

    if (message) {
      this.notice.set(message);
      this.feedback.clear();
    }
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);

    this.students
      .getById(this.studentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (student: Student) => {
          this.student.set(student);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (
            error instanceof HttpErrorResponse &&
            (error.status === 400 || error.status === 404)
          ) {
            this.notFound.set(true);
          } else {
            this.error.set(describeApiError(error, LOAD_ERROR_MESSAGES));
          }

          this.loading.set(false);
        },
      });
  }
}
