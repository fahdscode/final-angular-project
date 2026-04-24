import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

import { Article } from '../models/article.model';
import { AuthService } from '../services/auth.service';
import { ArticleService } from '../services/article.service';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.css',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticlesComponent implements OnInit {
  private readonly articleService = inject(ArticleService);
  private readonly authService = inject(AuthService);

  protected readonly articles = signal<Article[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly currentUser = this.authService.currentUser;
  protected readonly currentUserId = computed(() => this.currentUser()?.id ?? null);

  ngOnInit(): void {
    this.loadArticles();
  }

  protected canEdit(article: Article): boolean {
    return this.currentUserId() === article.authorId;
  }

  protected deleteArticle(article: Article): void {
    const currentUser = this.currentUser();
    if (!currentUser) {
      return;
    }

    const confirmed = globalThis.confirm(`Delete “${article.title}”?`);
    if (!confirmed) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.articleService.deleteArticle(article.id, currentUser).subscribe({
      next: () => this.loadArticles(),
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.extractErrorMessage(error, 'Unable to delete the article right now.'));
      },
    });
  }

  private loadArticles(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.articleService.getArticles().subscribe({
      next: (articles) => {
        this.articles.set(articles);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.extractErrorMessage(error, 'Unable to load articles right now.'));
      },
    });
  }

  private extractErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallbackMessage;
  }
}