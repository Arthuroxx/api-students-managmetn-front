import { HttpErrorResponse } from '@angular/common/http';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import type { PaginatedStudents, Student } from './students.models';
import { Students } from './students';
import { StudentsService } from './students.service';

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

function createPage(overrides: Partial<PaginatedStudents['meta']> = {}): PaginatedStudents {
  return {
    data: [STUDENT],
    meta: { total: 1, page: 1, limit: 10, totalPages: 1, ...overrides },
  };
}

function setInput(fixture: ComponentFixture<Students>, selector: string, value: string): void {
  const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(selector);

  if (!input) {
    throw new Error(`Input not found: ${selector}`);
  }

  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
}

function click(fixture: ComponentFixture<Students>, selector: string): void {
  const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(selector);

  if (!button) {
    throw new Error(`Button not found: ${selector}`);
  }

  button.click();
  fixture.detectChanges();
}

function text(fixture: ComponentFixture<Students>, selector: string): string {
  return (
    (fixture.nativeElement as HTMLElement)
      .querySelector(selector)
      ?.textContent?.replace(/\s+/g, ' ')
      .trim() ?? ''
  );
}

describe('Students', () => {
  let list: ReturnType<typeof vi.fn>;
  let remove: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    list = vi.fn();
    remove = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Students],
      providers: [provideRouter([]), { provide: StudentsService, useValue: { list, remove } }],
    }).compileComponents();
  });

  it('should load and render the student table', async () => {
    list.mockReturnValue(of(createPage()));

    const fixture = TestBed.createComponent(Students);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(list).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(element.querySelectorAll('.students-table tbody tr')).toHaveLength(1);
    expect(text(fixture, '.student-identity__name')).toBe('Ana Lopez');
    expect(text(fixture, '.student-identity__email')).toBe('ana.lopez@example.com');
    expect(text(fixture, '.students-table__document')).toBe('DOC-123456');
    expect(text(fixture, '.student-identity__avatar')).toBe('AL');
    expect(element.textContent).toContain('May 10, 2000');
    expect(text(fixture, '.students__summary')).toBe('Showing 1–1 of 1 students');
  });

  it('should show a skeleton while the request is pending', async () => {
    const pending = new Subject<PaginatedStudents>();

    list.mockReturnValue(pending.asObservable());

    const fixture = TestBed.createComponent(Students);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.students__skeleton'),
    ).not.toBeNull();

    pending.next(createPage());
    pending.complete();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('.students__skeleton')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.students-table')).not.toBeNull();
  });

  it('should debounce filters, trim values, and reset to the first page', async () => {
    list.mockReturnValue(of(createPage({ total: 25, totalPages: 3 })));

    const fixture = TestBed.createComponent(Students);
    await fixture.whenStable();

    click(fixture, 'button[aria-label="Next page"]');
    expect(list).toHaveBeenLastCalledWith({ page: 2, limit: 10 });

    setInput(fixture, '#filter-first-name', '  Ada  ');

    expect(list).toHaveBeenCalledTimes(2);

    await vi.waitFor(() => expect(list).toHaveBeenCalledTimes(3));
    expect(list).toHaveBeenLastCalledWith({ page: 1, limit: 10, firstName: 'Ada' });
  });

  it('should clear every filter and reload the directory', async () => {
    list.mockReturnValue(of(createPage()));

    const fixture = TestBed.createComponent(Students);
    await fixture.whenStable();

    setInput(fixture, '#filter-first-name', 'Ana');
    await vi.waitFor(() =>
      expect(list).toHaveBeenLastCalledWith({
        page: 1,
        limit: 10,
        firstName: 'Ana',
      }),
    );

    click(fixture, '.students__clear');
    await fixture.whenStable();

    expect(list).toHaveBeenLastCalledWith({ page: 1, limit: 10 });
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#filter-first-name')
        ?.value,
    ).toBe('');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.students__clear')
        ?.disabled,
    ).toBe(true);
  });

  it('should move between pages and disable unavailable controls', async () => {
    list.mockReturnValue(of(createPage({ total: 25, totalPages: 3 })));

    const fixture = TestBed.createComponent(Students);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const previous = element.querySelector<HTMLButtonElement>('button[aria-label="Previous page"]');
    const next = element.querySelector<HTMLButtonElement>('button[aria-label="Next page"]');

    expect(previous?.disabled).toBe(true);
    expect(next?.disabled).toBe(false);

    click(fixture, 'button[aria-label="Next page"]');
    expect(list).toHaveBeenLastCalledWith({ page: 2, limit: 10 });
    expect(text(fixture, '.students__page-status')).toBe('Page 2 of 3');

    click(fixture, 'button[aria-label="Previous page"]');
    expect(list).toHaveBeenLastCalledWith({ page: 1, limit: 10 });
    expect(text(fixture, '.students__page-status')).toBe('Page 1 of 3');
  });

  it('should reload from the first page when the page size changes', async () => {
    list.mockReturnValue(of(createPage({ total: 60, totalPages: 6 })));

    const fixture = TestBed.createComponent(Students);
    await fixture.whenStable();

    click(fixture, 'button[aria-label="Next page"]');
    expect(list).toHaveBeenLastCalledWith({ page: 2, limit: 10 });

    const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(
      '.students__page-size select',
    );

    if (!select) {
      throw new Error('Page size select not found');
    }

    select.value = '25';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(list).toHaveBeenLastCalledWith({ page: 1, limit: 25 });
  });

  it('should explain when no students match the filters', async () => {
    list.mockReturnValue(of({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }));

    const fixture = TestBed.createComponent(Students);
    await fixture.whenStable();

    expect(text(fixture, '.students__state h2')).toBe('No students yet');

    setInput(fixture, '#filter-email', 'missing@example.com');
    await vi.waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    await fixture.whenStable();

    expect(text(fixture, '.students__state h2')).toBe('No students match your filters');
    expect(list).toHaveBeenLastCalledWith({
      page: 1,
      limit: 10,
      email: 'missing@example.com',
    });

    click(fixture, '.students__state .students__action');

    expect(list).toHaveBeenLastCalledWith({ page: 1, limit: 10 });
  });

  it('should show an API error and retry the request', async () => {
    list
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              error: { statusCode: 500, message: 'Database unavailable', error: 'Server Error' },
            }),
        ),
      )
      .mockReturnValue(of(createPage()));

    const fixture = TestBed.createComponent(Students);
    await fixture.whenStable();

    expect(text(fixture, '[role="alert"]')).toContain('Students could not be loaded');
    expect(text(fixture, '[role="alert"]')).toContain('Database unavailable');

    click(fixture, '.students__action');
    await fixture.whenStable();

    expect(list).toHaveBeenCalledTimes(2);
    expect((fixture.nativeElement as HTMLElement).querySelector('.students-table')).not.toBeNull();
  });

  it('should delete a student after confirmation and reload the directory', async () => {
    list.mockReturnValue(of(createPage()));
    remove.mockReturnValue(of(undefined));

    const fixture = TestBed.createComponent(Students);
    await fixture.whenStable();

    click(fixture, 'button[aria-label="Delete Ana Lopez"]');

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('dialog');

    expect(dialog?.hasAttribute('open')).toBe(true);
    expect(text(fixture, '.confirm__message')).toContain('Ana Lopez');

    click(fixture, '.confirm__confirm');
    await fixture.whenStable();

    expect(remove).toHaveBeenCalledWith('student-1');
    expect(list).toHaveBeenCalledTimes(2);
    expect(text(fixture, '.notice')).toContain('Ana Lopez was deleted.');
    expect(dialog?.hasAttribute('open')).toBe(false);
  });

  it('should cancel deletion without sending a request', async () => {
    list.mockReturnValue(of(createPage()));

    const fixture = TestBed.createComponent(Students);
    await fixture.whenStable();

    click(fixture, 'button[aria-label="Delete Ana Lopez"]');
    click(fixture, '.confirm__cancel');

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('dialog');

    expect(dialog?.hasAttribute('open')).toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });

  it('should keep the dialog open and explain a failed deletion', async () => {
    list.mockReturnValue(of(createPage()));
    remove.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    const fixture = TestBed.createComponent(Students);
    await fixture.whenStable();

    click(fixture, 'button[aria-label="Delete Ana Lopez"]');
    click(fixture, '.confirm__confirm');
    await fixture.whenStable();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('dialog');

    expect(dialog?.hasAttribute('open')).toBe(true);
    expect(text(fixture, '.confirm__error')).toContain('permission');
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('should move to the last page when a deletion empties the current page', async () => {
    let calls = 0;

    list.mockImplementation(() => {
      calls += 1;

      if (calls === 1) {
        return of(createPage({ total: 11, totalPages: 2 }));
      }

      if (calls === 2) {
        return of(createPage({ page: 2, total: 11, totalPages: 2 }));
      }

      if (calls === 3) {
        return of({ data: [], meta: { total: 10, page: 2, limit: 10, totalPages: 1 } });
      }

      return of(createPage());
    });

    remove.mockReturnValue(of(undefined));

    const fixture = TestBed.createComponent(Students);
    await fixture.whenStable();

    click(fixture, 'button[aria-label="Next page"]');
    expect(text(fixture, '.students__page-status')).toBe('Page 2 of 2');

    click(fixture, 'button[aria-label="Delete Ana Lopez"]');
    click(fixture, '.confirm__confirm');
    await fixture.whenStable();

    expect(list).toHaveBeenLastCalledWith({ page: 1, limit: 10 });
    expect(text(fixture, '.students__page-status')).toBe('Page 1 of 1');
  });
});
