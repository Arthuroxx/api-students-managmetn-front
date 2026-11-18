import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormField,
  FormRoot,
  email,
  form,
  maxLength,
  required,
  validate,
} from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { describeApiError, type ApiErrorMessages } from '../../../core/http/api-error';
import { StudentFeedbackService } from '../student-feedback.service';
import { toDateInputValue, todayIsoDate } from '../students.format';
import type { Student, StudentInput, UpdateStudentInput } from '../students.models';
import { StudentsService } from '../students.service';

type StudentField = keyof StudentInput;
type MutableStudentInput = { -readonly [K in keyof StudentInput]?: StudentInput[K] };

const LOAD_ERROR_MESSAGES: ApiErrorMessages = {
  fallback: 'The student could not be loaded. Please try again.',
  byStatus: {
    403: 'You do not have permission to view this student.',
  },
};

const SAVE_ERROR_MESSAGES: ApiErrorMessages = {
  fallback: 'The student could not be saved. Please try again.',
  byStatus: {
    400: 'Check the form values and try again.',
    403: 'You do not have permission to save student records.',
    404: 'This student no longer exists.',
    409: 'A student with this email address or document number already exists.',
  },
  preferApiMessageFor: [400, 409],
};

@Component({
  selector: 'sms-student-editor',
  imports: [FormField, FormRoot, RouterLink],
  templateUrl: './student-editor.html',
  styleUrl: './student-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentEditor {
  private readonly students = inject(StudentsService);
  private readonly feedback = inject(StudentFeedbackService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly studentId = this.route.snapshot.paramMap.get('id');
  protected readonly isEdit = this.studentId !== null;
  protected readonly maxBirthDate = todayIsoDate();
  protected readonly loading = signal(this.isEdit);
  protected readonly loadError = signal<string | null>(null);
  protected readonly notFound = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly model = signal<StudentInput>({
    firstName: '',
    lastName: '',
    email: '',
    documentNumber: '',
    birthDate: '',
  });

  protected readonly editorForm = form(
    this.model,
    (path) => {
      required(path.firstName, { message: 'Enter the first name.' });
      maxLength(path.firstName, 100, { message: 'First name must be 100 characters or fewer.' });

      required(path.lastName, { message: 'Enter the last name.' });
      maxLength(path.lastName, 100, { message: 'Last name must be 100 characters or fewer.' });

      required(path.email, { message: 'Enter the email address.' });
      email(path.email, { message: 'Enter a valid email address.' });
      maxLength(path.email, 255, { message: 'Email must be 255 characters or fewer.' });

      required(path.documentNumber, { message: 'Enter the document number.' });
      maxLength(path.documentNumber, 50, {
        message: 'Document number must be 50 characters or fewer.',
      });

      required(path.birthDate, { message: 'Enter the date of birth.' });
      validate(path.birthDate, (context) => {
        const value = context.value();

        if (!value || value <= this.maxBirthDate) {
          return undefined;
        }

        return {
          kind: 'futureDate',
          message: 'The date of birth cannot be in the future.',
        };
      });
    },
    {
      submission: {
        action: async (field) => {
          await this.save(field().value());
          return undefined;
        },
      },
    },
  );

  private original: StudentInput | null = null;

  constructor() {
    if (this.isEdit) {
      this.load();
    }
  }

  protected showFieldError(field: StudentField): boolean {
    const state = this.editorForm[field]();

    return state.touched() && state.invalid();
  }

  protected fieldErrorMessage(field: StudentField): string | null {
    return this.editorForm[field]().errors()[0]?.message ?? null;
  }

  protected retryLoad(): void {
    this.load();
  }

  protected cancel(): void {
    void this.router.navigate(
      this.isEdit && this.studentId ? ['/students', this.studentId] : ['/students'],
    );
  }

  private load(): void {
    const id = this.studentId;

    if (!id) {
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);
    this.notFound.set(false);

    this.students
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (student: Student) => {
          this.original = {
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            documentNumber: student.documentNumber,
            birthDate: toDateInputValue(student.birthDate),
          };
          this.model.set(this.original);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (
            error instanceof HttpErrorResponse &&
            (error.status === 400 || error.status === 404)
          ) {
            this.notFound.set(true);
          } else {
            this.loadError.set(describeApiError(error, LOAD_ERROR_MESSAGES));
          }

          this.loading.set(false);
        },
      });
  }

  private async save(value: StudentInput): Promise<void> {
    this.formError.set(null);
    const input = normalizeStudentInput(value);

    try {
      if (this.isEdit && this.studentId) {
        const changes = this.changedFields(input);

        if (Object.keys(changes).length === 0) {
          await this.router.navigate(['/students', this.studentId]);
          return;
        }

        await firstValueFrom(this.students.update(this.studentId, changes));
        this.feedback.set('Student updated successfully.');
        await this.router.navigate(['/students', this.studentId]);
        return;
      }

      const created = await firstValueFrom(this.students.create(input));
      this.feedback.set('Student created successfully.');
      await this.router.navigate(['/students', created.id]);
    } catch (error) {
      this.formError.set(describeApiError(error, SAVE_ERROR_MESSAGES));
    }
  }

  private changedFields(input: StudentInput): UpdateStudentInput {
    const original = this.original;

    if (!original) {
      return input;
    }

    const changes: MutableStudentInput = {};

    for (const field of Object.keys(input) as (keyof StudentInput)[]) {
      if (input[field] !== original[field]) {
        changes[field] = input[field];
      }
    }

    return changes;
  }
}

function normalizeStudentInput(value: StudentInput): StudentInput {
  return {
    firstName: value.firstName.trim(),
    lastName: value.lastName.trim(),
    email: value.email.trim().toLowerCase(),
    documentNumber: value.documentNumber.trim().toUpperCase(),
    birthDate: value.birthDate.trim(),
  };
}
