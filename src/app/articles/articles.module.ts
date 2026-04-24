import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { ArticlesComponent } from './articles.component';

@NgModule({
  declarations: [ArticlesComponent],
  imports: [SharedModule],
  exports: [ArticlesComponent],
})
export class ArticlesModule {}