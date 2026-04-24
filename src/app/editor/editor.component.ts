import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Article } from '../models/article.model';
import { AuthService } from '../services/auth.service';
import { ArticleService } from '../services/article.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly articleService = inject(ArticleService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly articleId = signal<string | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly currentUser = this.authService.currentUser;
  protected readonly title = computed(() => (this.articleId() ? 'Edit article' : 'Create article'));

  protected readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', [Validators.required, Validators.minLength(20)]],
  });

  ngOnInit(): void {
    const routeArticleId = this.route.snapshot.paramMap.get('id');

    if (!routeArticleId) {
      return;
    }

    this.articleId.set(routeArticleId);
    this.isLoading.set(true);

    this.articleService.getArticleById(routeArticleId).subscribe({
      next: (article) => {
        this.isLoading.set(false);

        if (!article) {
          this.errorMessage.set('Article not found.');
          return;
        }

        if (article.authorId !== this.currentUser()?.id) {
          this.errorMessage.set('You can edit only your own articles.');
          return;
        }

        this.patchForm(article);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.extractErrorMessage(error, 'Unable to load the article right now.'));
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please correct the highlighted fields.');
      return;
    }

    const user = this.currentUser();
    if (!user) {
      void this.router.navigate(['/login']);
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    this.articleService.saveArticle(this.form.getRawValue(), user, this.articleId() ?? undefined).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        void this.router.navigate(['/articles']);
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(this.extractErrorMessage(error, 'Unable to save the article right now.'));
      },
    });
  }

  protected controlError(controlName: 'title' | 'content'): string | null {
    const control = this.form.controls[controlName];

    if (!control.touched && !control.dirty) {
      return null;
    }

    if (control.hasError('required')) {
      return `${this.labelFor(controlName)} is required.`;
    }

    if (control.hasError('minlength')) {
      const minimum = controlName === 'title' ? 3 : 20;
      return `${this.labelFor(controlName)} must be at least ${minimum} characters long.`;
    }

    return null;
  }

  private patchForm(article: Article): void {
    this.form.patchValue({
      title: article.title,
      content: article.content,
    });
  }

  private labelFor(controlName: string): string {
    return controlName.charAt(0).toUpperCase() + controlName.slice(1);
  }

  private extractErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallbackMessage;
  }
}