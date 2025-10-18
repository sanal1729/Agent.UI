import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Organization } from '../entities/classes/organization';

@Injectable({ providedIn: 'root' })
export class OrgService {
    private readonly baseUrl = `${environment.baseUrl}/organization`;

    constructor(private http: HttpClient) { }

    list(payload: {
        filter: string | null;
        sort: string | null;
        pageNumber: number;
        pageSize: number;
        includeNavigations: boolean;
    }): Observable<{ organizations: Organization[]; totalCount: number }> {
        const params = new HttpParams()
            .set('filter', payload.filter ?? '')
            .set('sort', payload.sort ?? '')
            .set('pageNumber', payload.pageNumber.toString())
            .set('pageSize', payload.pageSize.toString())
            .set('includeNavigations', String(payload.includeNavigations));

        return this.http.get<{ organizations: Organization[]; totalCount: number }>(`${this.baseUrl}/list`, {
            params,
            withCredentials: true
        });
    }


    // list(payload: {
    //     filter: string | null;
    //     sort: string | null;
    //     pageNumber: number;
    //     pageSize: number;
    //     includeNavigations: boolean;

    // }): Observable<Organization[]> {
    //     return this.http.post<Organization[]>(`${this.baseUrl}/list`, payload, { withCredentials: true });
    // }


      update(org: Partial<Organization>): Observable<Organization> {
    return this.http.put<Organization>(
      `${this.baseUrl}`,
      org,
      { withCredentials: true }
    ).pipe(
      catchError((err: HttpErrorResponse) => throwError(() => err))
    );
  }

     create(org: Organization): Observable<Organization> {
    return this.http.post<Organization>(
      `${this.baseUrl}`,
      org,
      { withCredentials: true }
    ).pipe(
      catchError((err: HttpErrorResponse) => throwError(() => err))
    );
  }

   delete(org: Organization): Observable<Organization> {
  return this.http.delete<Organization>(
    `${this.baseUrl}`,
    {
      body: org,
      withCredentials: true
    }
  ).pipe(
    catchError((err: HttpErrorResponse) => throwError(() => err))
  );
}


}
