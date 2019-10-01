import {map, shareReplay} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {RequestCache} from '../utils/request-cache';
import {HttpClient} from '@angular/common/http';
import {combineLatest, Observable, of} from 'rxjs';
import {Role, User} from '../models/user';
import {environment} from '../../environments/environment';
import {APIResponse, responseAdapter} from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private byID = new RequestCache<string, User>((userID) => {
    return this.http.get<APIResponse<User>>(`${environment.api}/users/${userID}`).pipe(
      map((response) => responseAdapter<User>(response)),
      shareReplay(1)
    );
  });

  private byNameOrEmail = new RequestCache<{q: string, l: number, p: number}, User[]>(({q, l, p}) => {
    if (q) {
      return this.http.get<APIResponse<User[]>>(`${environment.api}/users`, {params: {q, l, p}}).pipe(
        map((response) => responseAdapter<User[]>(response)),
        map((users) => users === null ? [] : users),
        shareReplay(1)
      );
    } else {
      return of([]);
    }

  }, 5000);

  constructor(private http: HttpClient) {}

  public getByID(userID: string): Observable<User> {
    return this.byID.getObservable(userID);
  }

  public getAllByID(associatedUserIDs: string[]): Observable<User[]> {
    const observables = [] as Observable<User>[];
    for (const id of associatedUserIDs) {
      observables.push(this.getByID(id));
    }

    return combineLatest(observables);
  }

  public searchByNameOrEmail(query: string, limit: number, page: number): Observable<User[]> {
    return this.byNameOrEmail.getObservable({q: query, l: limit, p: page});
  }

  public createUserWithEmail(email: string): Observable<User> {
    return this.http.post<APIResponse<User>>(`${environment.api}/users`, {
      email,
      anon: true,
      name: '',
      role: 'student'
    }).pipe(
      map((response) => responseAdapter<User>(response)),
    );
  }

  public setRole(user: User, role: Role) {
    return this.http.put<APIResponse<User>>(`${environment.api}/users/${user.id}`, {
      role
    }).pipe(
      map((response) => responseAdapter<User>(response)),
    );
  }
}
