import { Component } from '@angular/core';
import { BackendApiService, Result } from '../backend-api.service';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import jsPDF from 'jspdf';
import { ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css'],
})
export class ImageUploadComponent {
  summaryMode: 'short' | 'detailed' = 'short';
  @ViewChild('fileInput') fileInput!: ElementRef;
  isDetailed = false;
  selectedFile: File | undefined;
  result$ = new BehaviorSubject<{ value: Summary | null } | undefined>(
    undefined
  );
  constructor(private api: BackendApiService, private snackbar: MatSnackBar) {}

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
    const mode = this.isDetailed ? 'detailed' : 'short';

    if (!this.selectedFile) return;
    event.preventDefault();
    this.result$.next({ value: null });

    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('summary_mode', mode);

    this.api
      .summarizeImage(formData) // Update the service method to accept FormData
      .pipe(
        catchError((err) => {
          this.result$.next(undefined);
          this.snackbar.open('Failed to summarize image', 'Close', {
            duration: 3000,
          });
          return of(null);
        }),
        tap(async (x) => {
          if (x) {
            try {
              const y = {
                ...x,
                imgsrc: await imgToSrc(this.selectedFile as File),
              };
              this.result$.next({ value: y });
            } catch (error) {
              this.result$.next(undefined);
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
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let cursorY = margin;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = result.imgsrc;

    image.onload = () => {
      let imgWidth = image.naturalWidth * 0.75; // Convert px to pt
      let imgHeight = image.naturalHeight * 0.75;

      const maxWidth = pageWidth - 2 * margin;
      const maxHeight = pageHeight / 2;

      // Scale down proportionally if needed
      if (imgWidth > maxWidth || imgHeight > maxHeight) {
        const widthRatio = maxWidth / imgWidth;
        const heightRatio = maxHeight / imgHeight;
        const scale = Math.min(widthRatio, heightRatio);
        imgWidth *= scale;
        imgHeight *= scale;
      }

      // Center the image horizontally
      const centerX = (pageWidth - imgWidth) / 2;

      doc.addImage(image, 'JPEG', centerX, cursorY, imgWidth, imgHeight);
      cursorY += imgHeight + 20;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(result.title, margin, cursorY);

      cursorY += 20;
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Genre: ${result.genre}`, margin, cursorY);

      cursorY += 20;
      doc.text(`By ${result.author}`, margin, cursorY);

      cursorY += 30;
      doc.setFontSize(11);
      doc.setTextColor(50);

      // Wrap summary manually to fit within margins
      const summaryLines = doc.splitTextToSize(
        result.summary,
        pageWidth - 2 * margin
      );
      summaryLines.forEach((line: string[]) => {
        if (cursorY > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += 18;
      });

      doc.save(`${result.title}.pdf`);
    };

    image.onerror = () => {
      this.snackbar.open('Failed to load cover image', 'Close', {
        duration: 3000,
      });
    };
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
  clear() {
    this.selectedFile = undefined;
    this.result$.next(undefined);

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
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
