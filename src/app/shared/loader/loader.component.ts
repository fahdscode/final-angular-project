import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loader',
  template: `
    <div class="loader-wrap" role="status" aria-live="polite">
      <span class="loader-spin" aria-hidden="true"></span>
      <span>{{ label() }}</span>
    </div>
  `,
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderComponent {
  label = input('Loading...');
}