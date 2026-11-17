import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { AuthorizationService } from '../../../core/auth/authorization.service';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { StudentFeedbackService } from '../student-feedback.service';
import type { Student } from '../students.models';
import { StudentsService } from '../students.service';
import { StudentDetail } from './student-detail';

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
  updatedAt: '2026-11-02T10:00:00.000Z',
};

function text(fixture: ComponentFixture<unknown>, selector: string): string {
  return (
    (fixture.nativeElement as HTMLElement)
      .querySelector(selector)
      ?.textContent?.replace(/\s+/g, ' ')
      .trim() ?? ''
  );
}

describe('StudentDetail', () => {
  let students: {
    getById: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let feedback: StudentFeedbackService;
  let router: Router;
  let canManage: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    students = { getById: vi.fn(), remove: vi.fn() };
    canManage = signal(true);

    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideRouter([
          { path: 'students', component: StubPage },
          { path: 'students/:id/edit', component: StubPage },
          { path: 'students/:id', component: StudentDetail },
        ]),
        { provide: StudentsService, useValue: students },
        { provide: AuthorizationService, useValue: { canManageStudents: canManage } },
      ],
    }).compileComponents();

    feedback = TestBed.inject(StudentFeedbackService);
    router = TestBed.inject(Router);
  });

  async function render(path = '/students/student-1'): Promise<ComponentFixture<Host>> {
    await router.navigateByUrl(path);

    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    fixture.detectChanges();

    return fixture;
  }

  it('should render the student record with formatted dates', async () => {
    students.getById.mockReturnValue(of(STUDENT));

    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;
    const values = Array.from(element.querySelectorAll('.detail__item dd')).map((node) =>
      node.textContent?.trim(),
    );

    expect(students.getById).toHaveBeenCalledWith('student-1');
    expect(text(fixture, 'h1')).toBe('Ana Lopez');
    expect(text(fixture, '.detail__email')).toBe('ana.lopez@example.com');
    expect(values).toEqual([
      'ana.lopez@example.com',
      'DOC-123456',
      'May 10, 2000',
      'Nov 1, 2026',
      'Nov 2, 2026',
      'student-1',
    ]);
    expect(element.querySelector('.detail__avatar')?.textContent).toContain('AL');
    expect(element.querySelector('.detail__edit')?.getAttribute('href')).toBe(
      '/students/student-1/edit',
    );
  });

  it('should show a skeleton while the record is loading', async () => {
    const pending = new Subject<Student>();

    students.getById.mockReturnValue(pending.asObservable());

    const fixture = await render();

    expect((fixture.nativeElement as HTMLElement).querySelector('.detail__loading')).not.toBeNull();

    pending.next(STUDENT);
    pending.complete();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.detail__loading')).toBeNull();
    expect(text(fixture, 'h1')).toBe('Ana Lopez');
  });

  it('should report a missing student', async () => {
    students.getById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    const fixture = await render();

    expect(text(fixture, '.detail__state h1')).toBe('Student not found');
    expect(text(fixture, '.detail__state')).toContain('may have been deleted');
  });

  it('should show an API error and retry the request', async () => {
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

    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(text(fixture, '.detail__state')).toContain('Database unavailable');

    element.querySelector<HTMLButtonElement>('.detail__state-action')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(students.getById).toHaveBeenCalledTimes(2);
    expect(text(fixture, 'h1')).toBe('Ana Lopez');
  });

  it('should show and clear a one-time success notice', async () => {
    students.getById.mockReturnValue(of(STUDENT));
    feedback.set('Student updated successfully.');

    const fixture = await render();

    expect(text(fixture, '.notice')).toContain('Student updated successfully.');
    expect(feedback.message()).toBeNull();
  });

  it('should delete the student after confirmation and return to the directory', async () => {
    students.getById.mockReturnValue(of(STUDENT));
    students.remove.mockReturnValue(of(undefined));

    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>('.detail__delete')?.click();
    fixture.detectChanges();

    const dialog = element.querySelector('dialog');

    expect(dialog?.hasAttribute('open')).toBe(true);
    expect(text(fixture, '.confirm__message')).toContain('Ana Lopez');

    element.querySelector<HTMLButtonElement>('.confirm__confirm')?.click();
    await fixture.whenStable();

    expect(students.remove).toHaveBeenCalledWith('student-1');
    expect(feedback.message()).toBe('Student deleted successfully.');
    await vi.waitFor(() => expect(router.url).toBe('/students'));
  });

  it('should cancel deletion without sending a request', async () => {
    students.getById.mockReturnValue(of(STUDENT));

    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>('.detail__delete')?.click();
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>('.confirm__cancel')?.click();
    fixture.detectChanges();

    expect(element.querySelector('dialog')?.hasAttribute('open')).toBe(false);
    expect(students.remove).not.toHaveBeenCalled();
  });

  it('should keep the dialog open and explain a failed deletion', async () => {
    students.getById.mockReturnValue(of(STUDENT));
    students.remove.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>('.detail__delete')?.click();
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>('.confirm__confirm')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('dialog')?.hasAttribute('open')).toBe(true);
    expect(text(fixture, '.confirm__error')).toContain('permission');
    expect(router.url).toBe('/students/student-1');
  });

  it('should hide edit and delete actions from read-only users', async () => {
    canManage.set(false);
    students.getById.mockReturnValue(of(STUDENT));

    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    expect(text(fixture, 'h1')).toBe('Ana Lopez');
    expect(element.querySelector('.detail__edit')).toBeNull();
    expect(element.querySelector('.detail__delete')).toBeNull();
    expect(element.querySelector('sms-confirm-dialog')).toBeNull();
    expect(text(fixture, '.access-badge')).toBe('Read-only access');
  });

  it('should have no WCAG 2.2 AA violations on the loaded record', async () => {
    students.getById.mockReturnValue(of(STUDENT));

    const fixture = await render();

    await expectNoA11yViolations(fixture.nativeElement as HTMLElement);
  });

  it('should have no WCAG 2.2 AA violations in the not-found state', async () => {
    students.getById.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    const fixture = await render();

    await expectNoA11yViolations(fixture.nativeElement as HTMLElement);
  });
});
