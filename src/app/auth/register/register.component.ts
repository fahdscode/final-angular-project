import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isLoading = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/articles']);
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please correct the highlighted fields.');
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.isLoading.set(false);
        void this.router.navigate(['/articles']);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.extractErrorMessage(error, 'Unable to create the account right now.'));
      },
    });
  }

  protected controlError(controlName: 'name' | 'email' | 'password'): string | null {
    const control = this.form.controls[controlName];

    if (!control.touched && !control.dirty) {
      return null;
    }

    if (control.hasError('required')) {
      return `${this.labelFor(controlName)} is required.`;
    }

    if (controlName === 'email' && control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (control.hasError('minlength')) {
      const minimum = controlName === 'password' ? 6 : 3;
      return `${this.labelFor(controlName)} must be at least ${minimum} characters long.`;
    }

    return null;
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