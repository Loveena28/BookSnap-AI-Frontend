import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { environment as env } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BackendApiService {
  constructor(private http: HttpClient) {}
  summarizeImage(file: File) {
    console.log(file); // Existing log for debugging

    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<Result>(env.baseUrl + 'ocr', formData).pipe(
      tap((response) => {
        if (response) {
          console.log('Backend response:', response);
        } else {
          console.log('Empty response from backend');
        }
      })
    );
  }
}
export interface Result {
  title: string;
  author: string;
  summary: string;
}
