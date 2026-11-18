import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { StudentFeedbackService } from '../student-feedback.service';
import type { Student } from '../students.models';
import { StudentsService } from '../students.service';
import { StudentEditor } from './student-editor';

@Component({ template: '' })
class StubPage {}

@Component({ template: '<router-outlet />', imports: [RouterOutlet] })
class Host {}

const STUDENT: Student = {
  id: 'student-1',
  firstName: 'Ana',
  lastName: 'Lopez',
  email: 'ana.lopez@example.com',
  documentNumber: 'DOC-123456',
  birthDate: '2000-05-10T00:00:00.000Z',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
};

function setInput(element: HTMLElement, selector: string, value: string): void {
  const input = element.querySelector<HTMLInputElement>(selector);

  if (!input) {
    throw new Error(`Input not found: ${selector}`);
  }

  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function fillForm(element: HTMLElement): void {
  setInput(element, '#student-first-name', ' Ana ');
  setInput(element, '#student-last-name', 'Lopez');
  setInput(element, '#student-email', ' ANA.LOPEZ@example.com ');
  setInput(element, '#student-document', ' doc-123456 ');
  setInput(element, '#student-birth-date', '2000-05-10');
}

function submitForm(element: HTMLElement): void {
  element
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function text(fixture: ComponentFixture<unknown>, selector: string): string {
  return (
    (fixture.nativeElement as HTMLElement)
      .querySelector(selector)
      ?.textContent?.replace(/\s+/g, ' ')
      .trim() ?? ''
  );
}

describe('StudentEditor', () => {
  let students: {
    getById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let feedback: StudentFeedbackService;
  let router: Router;

  beforeEach(async () => {
    students = { getById: vi.fn(), create: vi.fn(), update: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideRouter([
          { path: 'students', pathMatch: 'full', component: StubPage },
          { path: 'students/new', component: StudentEditor },
          { path: 'students/:id/edit', component: StudentEditor },
          { path: 'students/:id', component: StubPage },
        ]),
        { provide: StudentsService, useValue: students },
      ],
    }).compileComponents();

    feedback = TestBed.inject(StudentFeedbackService);
    router = TestBed.inject(Router);
  });

  async function render(path: string): Promise<ComponentFixture<Host>> {
    await router.navigateByUrl(path);

    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    fixture.detectChanges();

    return fixture;
  }

  it('should create a student and open its detail page', async () => {
    students.create.mockReturnValue(of({ ...STUDENT, id: 'created-1' }));

    const fixture = await render('/students/new');
    const element = fixture.nativeElement as HTMLElement;

    expect(text(fixture, 'h1')).toContain('Add a student');

    fillForm(element);
    submitForm(element);
    await fixture.whenStable();

    expect(students.create).toHaveBeenCalledWith({
      firstName: 'Ana',
      lastName: 'Lopez',
      email: 'ana.lopez@example.com',
      documentNumber: 'DOC-123456',
      birthDate: '2000-05-10',
    });
    expect(feedback.message()).toBe('Student created successfully.');
    await vi.waitFor(() => expect(router.url).toBe('/students/created-1'));
  });

  it('should show validation messages and skip the API for an empty form', async () => {
    const fixture = await render('/students/new');
    const element = fixture.nativeElement as HTMLElement;

    submitForm(element);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture, '#student-first-name-error')).toContain('Enter the first name.');
    expect(text(fixture, '#student-last-name-error')).toContain('Enter the last name.');
    expect(text(fixture, '#student-email-error')).toContain('Enter the email address.');
    expect(text(fixture, '#student-document-error')).toContain('Enter the document number.');
    expect(text(fixture, '#student-birth-date-error')).toContain('Enter the date of birth.');
    expect(students.create).not.toHaveBeenCalled();
  });

  it('should reject an invalid email and a future birth date', async () => {
    const fixture = await render('/students/new');
    const element = fixture.nativeElement as HTMLElement;

    setInput(element, '#student-first-name', 'Ana');
    setInput(element, '#student-last-name', 'Lopez');
    setInput(element, '#student-email', 'not-an-email');
    setInput(element, '#student-document', 'DOC-1');
    setInput(element, '#student-birth-date', '2999-01-01');

    submitForm(element);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture, '#student-email-error')).toContain('Enter a valid email address.');
    expect(text(fixture, '#student-birth-date-error')).toContain('cannot be in the future');
    expect(students.create).not.toHaveBeenCalled();
  });

  it('should load an existing student before editing', async () => {
    students.getById.mockReturnValue(of(STUDENT));

    const fixture = await render('/students/student-1/edit');
    const element = fixture.nativeElement as HTMLElement;

    expect(students.getById).toHaveBeenCalledWith('student-1');
    expect(element.querySelector<HTMLInputElement>('#student-first-name')?.value).toBe('Ana');
    expect(element.querySelector<HTMLInputElement>('#student-email')?.value).toBe(
      'ana.lopez@example.com',
    );
    expect(element.querySelector<HTMLInputElement>('#student-birth-date')?.value).toBe(
      '2000-05-10',
    );
    expect(text(fixture, 'h1')).toContain('Edit student');
  });

  it('should send only the changed fields on update', async () => {
    students.getById.mockReturnValue(of(STUDENT));
    students.update.mockReturnValue(of({ ...STUDENT, email: 'new@example.com' }));

    const fixture = await render('/students/student-1/edit');
    const element = fixture.nativeElement as HTMLElement;

    setInput(element, '#student-email', 'new@example.com');
    submitForm(element);
    await fixture.whenStable();

    expect(students.update).toHaveBeenCalledWith('student-1', { email: 'new@example.com' });
    expect(feedback.message()).toBe('Student updated successfully.');
    await vi.waitFor(() => expect(router.url).toBe('/students/student-1'));
  });

  it('should skip the request when nothing changed', async () => {
    students.getById.mockReturnValue(of(STUDENT));

    const fixture = await render('/students/student-1/edit');
    const element = fixture.nativeElement as HTMLElement;

    submitForm(element);
    await fixture.whenStable();

    expect(students.update).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(router.url).toBe('/students/student-1'));
  });

  it('should explain a duplicate student on create', async () => {
    students.create.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { statusCode: 409, message: 'Email already exists', error: 'Conflict' },
          }),
      ),
    );

    const fixture = await render('/students/new');
    const element = fixture.nativeElement as HTMLElement;

    fillForm(element);
    submitForm(element);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture, '[role="alert"]')).toContain('Email already exists');
    expect(router.url).toBe('/students/new');
  });

  it('should explain when saving is not permitted', async () => {
    students.create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    const fixture = await render('/students/new');
    const element = fixture.nativeElement as HTMLElement;

    fillForm(element);
    submitForm(element);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture, '[role="alert"]')).toContain('permission');
  });

  it('should report a missing student and stop loading', async () => {
    students.getById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    const fixture = await render('/students/student-1/edit');

    expect(text(fixture, '.editor__state h2')).toBe('Student not found');
    expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeNull();
  });

  it('should retry a failed load', async () => {
    students.getById
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              error: { statusCode: 500, message: 'Database unavailable', error: 'Server Error' },
            }),
        ),
      )
      .mockReturnValue(of(STUDENT));

    const fixture = await render('/students/student-1/edit');
    const element = fixture.nativeElement as HTMLElement;

    expect(text(fixture, '.editor__state')).toContain('Database unavailable');

    element.querySelector<HTMLButtonElement>('.editor__state-action')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(students.getById).toHaveBeenCalledTimes(2);
    expect(element.querySelector('form')).not.toBeNull();
  });
});
