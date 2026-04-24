import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ArticlesComponent } from './articles/articles.component';
import { AuthGuard } from './guards/auth.guard';
import { EditorComponent } from './editor/editor.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'articles',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'articles',
    component: ArticlesComponent,
  },
  {
    path: 'editor',
    component: EditorComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'editor/:id',
    component: EditorComponent,
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: 'articles',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
