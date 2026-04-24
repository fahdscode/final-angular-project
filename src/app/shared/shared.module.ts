import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { LoaderComponent } from './loader/loader.component';

@NgModule({
  declarations: [LoaderComponent],
  imports: [CommonModule, RouterModule],
  exports: [CommonModule, RouterModule, LoaderComponent],
})
export class SharedModule {}