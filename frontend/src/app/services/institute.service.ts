import {Injectable} from '@angular/core';
import {Institute} from '../models/institute';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {environment} from '../../environments/environment';
import {map, shareReplay, switchMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InstituteService {
  private readonly allInstitutes$: Observable<Institute[]>;

  constructor(private http: HttpClient) {
    this.allInstitutes$ = this.http.get<Institute[]>(environment.api).pipe(
      shareReplay(1)
    );
  }

  public getAll(): Observable<Institute[]> {
    return this.allInstitutes$;
  }

  public getBySlug(slug: string): Observable<Institute> {
    return this.allInstitutes$.pipe(
      map((institutes) => institutes.find((institute) => institute.slug === slug)),
    );
  }

  public isActualInstitute(slug: string): Observable<boolean> {
    return this.getBySlug(slug).pipe(
      switchMap((institute) => of(!!institute))
    );
  }
}
