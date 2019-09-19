import {Injectable} from '@angular/core';
import {Department} from '../models/department';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {environment} from '../../environments/environment';
import {map, shareReplay, switchMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private readonly allDepartments$: Observable<Department[]>;

  constructor(private http: HttpClient) {
    this.allDepartments$ = this.http.get<Department[]>(`${environment.api}/departments`).pipe(
      shareReplay(1)
    );
  }

  public getAll(): Observable<Department[]> {
    return this.allDepartments$;
  }

  public getBySlug(slug: string): Observable<Department> {
    return this.allDepartments$.pipe(
      map((departments) => departments.find((department) => department.slug === slug)),
    );
  }

  public isActualDepartment(slug: string): Observable<boolean> {
    return this.getBySlug(slug).pipe(
      switchMap((department) => of(!!department))
    );
  }
}
