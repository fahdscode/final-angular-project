import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly authService = inject(AuthService);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly isAuthenticated = computed(() => this.currentUser() !== null);

  protected logout(): void {
    this.authService.logout();
  }
}
