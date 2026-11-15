import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-config';
import { buildApiUrl } from '../../core/http/api-url';
import type { PaginatedStudents, StudentQuery } from './students.models';

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
}
