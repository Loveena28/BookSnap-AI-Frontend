import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ToolbarComponent } from './toolbar.component';
import { ImageUploadComponent } from '../image-upload/image-upload.component';

const routes: Routes = [
  {
    path: '',
    component: ToolbarComponent,
    children: [
      {
        path: '',
        redirectTo: 'upload',
        pathMatch: 'full',
      },
      {
        path: 'upload',
        component: ImageUploadComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ToolbarRoutingModule {}
