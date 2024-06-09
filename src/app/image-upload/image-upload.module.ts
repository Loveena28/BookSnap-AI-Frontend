import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageUploadComponent } from './image-upload.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageUploadRoutingModule } from './image-upload-routing.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
@NgModule({
  declarations: [ImageUploadComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ImageUploadRoutingModule,
    MatSnackBarModule
  ],
  exports: [ImageUploadComponent]
})
export class ImageUploadModule {
}
