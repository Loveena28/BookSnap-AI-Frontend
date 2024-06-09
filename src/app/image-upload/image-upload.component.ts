import { Component } from '@angular/core';
import { BackendApiService, Result } from '../backend-api.service';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css'],
})
export class ImageUploadComponent {
  selectedFile: File | undefined;
  result$ = new BehaviorSubject<{ value: Summary | null } | undefined>(
    undefined
  );
  constructor(private api: BackendApiService,private snackbar:MatSnackBar) {}

  async onFileSelected(event: Event) {
    this.selectedFile = (event.target as HTMLInputElement)?.files?.[0];
    if (this.selectedFile && this.selectedFile.size > 4.5 * 1024 * 1024) {
      try {
        this.selectedFile = await this.compressImage(this.selectedFile);
        if (this.selectedFile && this.selectedFile.size > 4.5 * 1024 * 1024)
          this.selectedFile = await this.compressImage(this.selectedFile);
        console.log('Image compressed successfully:', this.selectedFile);
      } catch (error) {
        console.error('Failed to compress image:', error);
      }
    } else {
      console.log('Image size is less than 4.5 MB, no need to compress');
    }
  }

  summarize(event: Event) {
    if (!this.selectedFile) {
      return;
    }
    event.preventDefault();
    this.result$.next({ value: null });
    this.api
      .summarizeImage(this.selectedFile)
      .pipe(
        catchError((x) => {
          this.result$.next(undefined);
          this.snackbar.open('Failed to summarize image', 'Close', {
            duration: 3000,
          });
          return of(null);
        }),
        tap(async (x) => {
          console.log(x);
          if (x) {
            try {
              const y = {
                ...x,
                imgsrc: await imgToSrc(this.selectedFile as File),
              };
              this.result$.next({ value: y });
            } catch (error) {
              this.result$.next(undefined);
              console.log(error);
              this.snackbar.open('Failed to summarize image', 'Close', {
                duration: 3000,
              });
            }
          }
        })
      )
      .subscribe();
  }
  generatePDF(result: Summary) {
    console.log(result)
    var a = window.open('', '', 'height=800, width=700');
    var imgElement = a?.document.createElement('img');
    imgElement!.setAttribute('height', '400px');
    imgElement!.src = result.imgsrc;

    var div = a?.document.createElement('div');
    div!.setAttribute('style', 'margin:1.5rem 0');
    var h5 = a?.document.createElement('h5');
    div?.appendChild(h5!);
    h5!.textContent = result.title;
    h5!.setAttribute('style', 'font-size:1.25rem;margin: 0;');

    var h6 = a?.document.createElement('h6');
    div?.appendChild(h6!);
    h6!.textContent = result.author;
    h6!.setAttribute(
      'style',
      'color:#6c757d;font-size: 1rem;margin: 0.5rem 0;'
    );

    var p = a?.document.createElement('p');
    div?.appendChild(p!);
    p!.textContent = result.summary;

    a?.document.body.append(imgElement!);
    a?.document.body.append(div!);
    a?.document.close();
    a?.print();
  }
  compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: Event) => {
        const img = new Image();
        img.src = (event.target as FileReader).result as string;
        img.onload = () => {
          // Set the compression quality, lower value means higher compression
          const quality = 0.7;

          // Create a canvas element to draw and compress the image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);

          // Convert the canvas to a Blob using the specified compression quality
          canvas.toBlob(
            (blob) => {
              resolve(blob as File);
            },
            'image/jpeg',
            quality
          );
        };
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  }
}
type Summary = Result & { imgsrc: string };
const imgToSrc = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => {
      reject('Img to src failed');
    };
    reader.readAsDataURL(file);
  });
