import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';

import { AuthUser, LoginCredentials, RegisterPayload, UserRecord } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserKey = 'final-angular-project.current-user';
  private readonly apiBaseUrl = 'http://localhost:3000';
  private readonly http = inject(HttpClient);

  readonly currentUser = signal<AuthUser | null>(this.readCurrentUser());

  login(credentials: LoginCredentials): Observable<AuthUser> {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password;

    if (!email || !password) {
      return throwError(() => new Error('Email and password are required.'));
    }

    return this.http
      .get<UserRecord[]>(`${this.apiBaseUrl}/users`, {
        params: {
          email,
          password,
        },
      })
      .pipe(
        map((users) => users[0] ?? null),
        map((user) => {
          if (!user) {
            throw new Error('Invalid email or password.');
          }

          const authUser = this.toAuthUser(user);
          this.writeCurrentUser(authUser);
          return authUser;
        }),
        catchError((error: unknown) => this.handleError(error, 'Unable to log in right now.'))
      );
  }

  register(payload: RegisterPayload): Observable<AuthUser> {
    const name = payload.name.trim();
    const email = payload.email.trim().toLowerCase();
    const password = payload.password;

    if (!name || !email || !password) {
      return throwError(() => new Error('All registration fields are required.'));
    }

    return this.http
      .get<UserRecord[]>(`${this.apiBaseUrl}/users`, {
        params: {
          email,
        },
      })
      .pipe(
        switchMap((users) => {
          if (users.some((record) => record.email.toLowerCase() === email)) {
            return throwError(() => new Error('This email is already registered.'));
          }

          const record: UserRecord = {
            id: this.createId(),
            name,
            email,
            password,
          };

          return this.http.post<UserRecord>(`${this.apiBaseUrl}/users`, record);
        }),
        map((user) => {
          const authUser = this.toAuthUser(user);
          this.writeCurrentUser(authUser);
          return authUser;
        }),
        catchError((error: unknown) => this.handleError(error, 'Unable to create the account right now.'))
      );
  }

  logout(): void {
    this.currentUser.set(null);
    this.writeCurrentUser(null);
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  getCurrentUserSnapshot(): AuthUser | null {
    return this.currentUser();
  }

  private readCurrentUser(): AuthUser | null {
    try {
      const rawValue = globalThis.localStorage?.getItem(this.currentUserKey);
      if (!rawValue) {
        return null;
      }

      return JSON.parse(rawValue) as AuthUser;
    } catch {
      return null;
    }
  }

  private writeCurrentUser(user: AuthUser | null): void {
    this.currentUser.set(user);
    try {
      globalThis.localStorage?.setItem(this.currentUserKey, JSON.stringify(user));
    } catch {
      throw new Error('Unable to access local storage.');
    }
  }

  private toAuthUser(user: UserRecord): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  private handleError(error: unknown, fallbackMessage: string): Observable<never> {
    if (error instanceof Error) {
      return throwError(() => error);
    }

    return throwError(() => new Error(fallbackMessage));
  }

  private createId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}