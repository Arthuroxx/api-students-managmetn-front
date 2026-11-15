import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-config';
import type { PaginatedStudents } from './students.models';
import { StudentsService } from './students.service';

const API_URL = 'http://localhost:3000';

const RESPONSE: PaginatedStudents = {
  data: [
    {
      id: 'student-1',
      firstName: 'Ana',
      lastName: 'Lopez',
      email: 'ana.lopez@example.com',
      documentNumber: 'DOC-123456',
      birthDate: '2000-05-10T00:00:00.000Z',
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
    },
  ],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

describe('StudentsService', () => {
  let service: StudentsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_URL },
      ],
    });

    service = TestBed.inject(StudentsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should request a page with every active filter', () => {
    const next = vi.fn();

    service
      .list({ page: 2, limit: 25, firstName: 'Ana', lastName: 'Lopez', email: 'example.com' })
      .subscribe(next);

    const request = http.expectOne(
      (candidate) => candidate.url === `${API_URL}/students` && candidate.method === 'GET',
    );

    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('25');
    expect(request.request.params.get('firstName')).toBe('Ana');
    expect(request.request.params.get('lastName')).toBe('Lopez');
    expect(request.request.params.get('email')).toBe('example.com');

    request.flush(RESPONSE);

    expect(next).toHaveBeenCalledWith(RESPONSE);
  });

  it('should trim filters and omit blank values', () => {
    service
      .list({ page: 1, limit: 10, firstName: '  Ana  ', lastName: '   ', email: '' })
      .subscribe();

    const request = http.expectOne(
      (candidate) =>
        candidate.url === `${API_URL}/students` && candidate.params.get('firstName') === 'Ana',
    );

    expect(request.request.params.get('firstName')).toBe('Ana');
    expect(request.request.params.has('lastName')).toBe(false);
    expect(request.request.params.has('email')).toBe(false);

    request.flush({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } });
  });

  it('should propagate API failures', () => {
    const error = vi.fn();

    service.list({ page: 1, limit: 10 }).subscribe({ error });

    http
      .expectOne((candidate) => candidate.url === `${API_URL}/students`)
      .flush(
        { statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' },
        { status: 403, statusText: 'Forbidden' },
      );

    expect(error).toHaveBeenCalledOnce();
  });
});
