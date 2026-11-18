import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { expectNoA11yViolations } from '../../testing/a11y';
import type { PaginatedStudents, Student } from '../students/students.models';
import { StudentsService } from '../students/students.service';
import { Welcome } from './welcome';

const RECENT: readonly Student[] = [
  {
    id: 'student-1',
    firstName: 'Ana',
    lastName: 'Lopez',
    email: 'ana.lopez@example.com',
    documentNumber: 'DOC-1',
    birthDate: '2000-05-10T00:00:00.000Z',
    createdAt: '2026-11-05T10:00:00.000Z',
    updatedAt: '2026-11-05T10:00:00.000Z',
  },
  {
    id: 'student-2',
    firstName: 'Bruno',
    lastName: 'Diaz',
    email: 'bruno.diaz@example.com',
    documentNumber: 'DOC-2',
    birthDate: '2001-03-14T00:00:00.000Z',
    createdAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-04T10:00:00.000Z',
  },
  {
    id: 'student-3',
    firstName: 'Carla',
    lastName: 'Ruiz',
    email: 'carla.ruiz@example.com',
    documentNumber: 'DOC-3',
    birthDate: '1999-08-22T00:00:00.000Z',
    createdAt: '2026-11-03T10:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
  },
  {
    id: 'student-4',
    firstName: 'Diego',
    lastName: 'Soto',
    email: 'diego.soto@example.com',
    documentNumber: 'DOC-4',
    birthDate: '2002-01-30T00:00:00.000Z',
    createdAt: '2026-11-02T10:00:00.000Z',
    updatedAt: '2026-11-02T10:00:00.000Z',
  },
  {
    id: 'student-5',
    firstName: 'Elena',
    lastName: 'Mora',
    email: 'elena.mora@example.com',
    documentNumber: 'DOC-5',
    birthDate: '2003-06-18T00:00:00.000Z',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
];

function page(data: readonly Student[], total = data.length): PaginatedStudents {
  return {
    data,
    meta: { total, page: 1, limit: 5, totalPages: Math.ceil(total / 5) },
  };
}

function text(element: HTMLElement, selector: string): string {
  return element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

describe('Welcome', () => {
  let list: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    list = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Welcome],
      providers: [provideRouter([]), { provide: StudentsService, useValue: { list } }],
    }).compileComponents();
  });

  it('should request the five most recent students from the API', async () => {
    list.mockReturnValue(of(page(RECENT, 12)));

    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    expect(list).toHaveBeenCalledWith({ page: 1, limit: 5 });
  });

  it('should render the real total and the recently added students', async () => {
    list.mockReturnValue(of(page(RECENT, 12)));

    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(text(element, '.dashboard__value')).toBe('12');
    expect(element.querySelectorAll('.recent-list__item')).toHaveLength(5);
    expect(text(element, '.recent-list__name')).toBe('Ana Lopez');
    expect(element.querySelector('.recent-list__date')?.getAttribute('datetime')).toBe(
      '2026-11-05T10:00:00.000Z',
    );
    expect(text(element, '.recent-list__date')).toContain('2026');
  });

  it('should render a single View Students action that links to the student list', async () => {
    list.mockReturnValue(of(page(RECENT)));

    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const actions = element.querySelectorAll('.dashboard__action');

    expect(actions).toHaveLength(1);
    expect(actions[0].textContent?.trim()).toBe('View Students');
    expect(actions[0].getAttribute('href')).toBe('/students');
  });

  it('should show a skeleton while the request is pending', () => {
    const pending = new Subject<PaginatedStudents>();

    list.mockReturnValue(pending.asObservable());

    const fixture = TestBed.createComponent(Welcome);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.dashboard__skeleton')).not.toBeNull();
    expect(element.querySelector('.dashboard__value')).toBeNull();

    pending.next(page(RECENT, 5));
    pending.complete();
    fixture.detectChanges();

    expect(element.querySelector('.dashboard__skeleton')).toBeNull();
    expect(text(element, '.dashboard__value')).toBe('5');
  });

  it('should show an empty state when no students exist', async () => {
    list.mockReturnValue(of(page([], 0)));

    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(text(element, '.dashboard__value')).toBe('0');
    expect(element.querySelector('.dashboard__empty')).not.toBeNull();
    expect(element.querySelector('.recent-list')).toBeNull();
  });

  it('should show an error state and retry the request', async () => {
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
      .mockReturnValue(of(page(RECENT)));

    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;

    expect(text(element, '[role="alert"]')).toContain('Overview could not be loaded');
    expect(text(element, '[role="alert"]')).toContain('Database unavailable');
    expect(element.querySelector('.dashboard__grid')).toBeNull();

    (element.querySelector('.state-panel__action') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(list).toHaveBeenCalledTimes(2);
    expect(element.querySelector('.recent-list')).not.toBeNull();
  });

  it('should have no WCAG 2.2 AA violations in the loaded dashboard', async () => {
    list.mockReturnValue(of(page(RECENT, 12)));

    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    await expectNoA11yViolations(fixture.nativeElement as HTMLElement);
  });

  it('should have no WCAG 2.2 AA violations in the empty state', async () => {
    list.mockReturnValue(of(page([], 0)));

    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    await expectNoA11yViolations(fixture.nativeElement as HTMLElement);
  });

  it('should have no WCAG 2.2 AA violations in the error state', async () => {
    list.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    const fixture = TestBed.createComponent(Welcome);
    await fixture.whenStable();

    await expectNoA11yViolations(fixture.nativeElement as HTMLElement);
  });
});
