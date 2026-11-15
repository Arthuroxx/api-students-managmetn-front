import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-config';
import { buildApiUrl } from '../../core/http/api-url';
import type {
  PaginatedStudents,
  Student,
  StudentInput,
  StudentQuery,
  UpdateStudentInput,
} from './students.models';

@Service()
export class StudentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(query: StudentQuery): Observable<PaginatedStudents> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);

    for (const field of ['firstName', 'lastName', 'email'] as const) {
      const value = query[field]?.trim();

      if (value) {
        params = params.set(field, value);
      }
    }

    return this.http.get<PaginatedStudents>(buildApiUrl(this.baseUrl, 'students'), { params });
  }

  getById(id: string): Observable<Student> {
    return this.http.get<Student>(this.studentUrl(id));
  }

  create(input: StudentInput): Observable<Student> {
    return this.http.post<Student>(buildApiUrl(this.baseUrl, 'students'), input);
  }

  update(id: string, input: UpdateStudentInput): Observable<Student> {
    return this.http.patch<Student>(this.studentUrl(id), input);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(this.studentUrl(id));
  }

  private studentUrl(id: string): string {
    return buildApiUrl(this.baseUrl, `students/${encodeURIComponent(id)}`);
  }
}
