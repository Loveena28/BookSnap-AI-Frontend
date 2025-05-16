import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { environment as env } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BackendApiService {
  constructor(private http: HttpClient) {}
  summarizeImage(formdata: FormData) {

    return this.http.post<Result>(env.baseUrl + 'ocr', formdata).pipe(
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
  genre: string;
  summary: string;
}
