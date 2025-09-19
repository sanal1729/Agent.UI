import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthResponse } from '../entities/interfaces/auth.response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.baseUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  register(payload: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, payload, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  refresh(): Observable<AuthResponse> {
    console.log('refresh');
    return this.http.post<AuthResponse>(`${this.baseUrl}/renewal`, {}, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  logout(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  /**
   * Centralized error handler for HTTP requests.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMsg = 'An unexpected error occurred.';
    if (error.error instanceof ErrorEvent) {
      // Client-side/network error
      errorMsg = `Client-side error: ${error.error.message}`;
    } else if (error.status === 0) {
      errorMsg = 'Network error: Unable to connect to the server.';
    } else if (error.error?.message) {
      errorMsg = error.error.message;
    } else {
      errorMsg = `Server returned code ${error.status}: ${error.message}`;
    }

    console.error('AuthService error:', error);
    return throwError(() => new Error(errorMsg));
  }
}
