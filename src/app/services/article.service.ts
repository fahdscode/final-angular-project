import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';

import { Article, ArticleFormValue } from '../models/article.model';
import { AuthUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private readonly apiBaseUrl = 'http://localhost:3000';
  private readonly http = inject(HttpClient);

  getArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiBaseUrl}/articles`).pipe(
      map((articles) => this.sortArticles(articles)),
      catchError((error: unknown) => this.handleError(error, 'Unable to load articles right now.'))
    );
  }

  getArticleById(articleId: string): Observable<Article | null> {
    return this.http.get<Article | null>(`${this.apiBaseUrl}/articles/${articleId}`).pipe(
      catchError(() => this.http.get<Article[]>(`${this.apiBaseUrl}/articles`, { params: { id: articleId } }).pipe(map((articles) => articles[0] ?? null))),
      catchError((error: unknown) => this.handleError(error, 'Unable to load the article right now.'))
    );
  }

  saveArticle(payload: ArticleFormValue, author: AuthUser, articleId?: string): Observable<Article> {
    const title = payload.title.trim();
    const content = payload.content.trim();

    if (title.length < 3) {
      return throwError(() => new Error('Title must be at least 3 characters long.'));
    }

    if (content.length < 20) {
      return throwError(() => new Error('Content must be at least 20 characters long.'));
    }

    if (articleId) {
      return this.http.get<Article>(`${this.apiBaseUrl}/articles/${articleId}`).pipe(
        switchMap((article) => {
          if (!article) {
            return throwError(() => new Error('Article not found.'));
          }

          if (article.authorId !== author.id) {
            return throwError(() => new Error('You can edit only your own articles.'));
          }

          const updatedArticle: Article = {
            ...article,
            title,
            content,
            updatedAt: new Date().toISOString(),
          };

          return this.http.put<Article>(`${this.apiBaseUrl}/articles/${articleId}`, updatedArticle);
        }),
        catchError((error: unknown) => this.handleError(error, 'Unable to save the article right now.'))
      );
    }

    const createdAt = new Date().toISOString();
    const createdArticle: Article = {
      id: this.createId(),
      title,
      content,
      authorId: author.id,
      authorName: author.name,
      createdAt,
      updatedAt: createdAt,
    };

    return this.http.post<Article>(`${this.apiBaseUrl}/articles`, createdArticle).pipe(
      catchError((error: unknown) => this.handleError(error, 'Unable to save the article right now.'))
    );
  }

  deleteArticle(articleId: string, author: AuthUser): Observable<void> {
    return this.http.get<Article>(`${this.apiBaseUrl}/articles/${articleId}`).pipe(
      switchMap((article) => {
        if (!article) {
          return throwError(() => new Error('Article not found.'));
        }

        if (article.authorId !== author.id) {
          return throwError(() => new Error('You can delete only your own articles.'));
        }

        return this.http.delete<void>(`${this.apiBaseUrl}/articles/${articleId}`);
      }),
      catchError((error: unknown) => this.handleError(error, 'Unable to delete the article right now.'))
    );
  }

  private sortArticles(articles: Article[]): Article[] {
    return [...articles].sort((left, right) => {
      const rightDate = new Date(right.updatedAt).getTime();
      const leftDate = new Date(left.updatedAt).getTime();
      return rightDate - leftDate;
    });
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