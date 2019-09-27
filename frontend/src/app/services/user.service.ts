import {shareReplay} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {RequestCache} from '../utils/request-cache';
import {HttpClient} from '@angular/common/http';
import {combineLatest, Observable} from 'rxjs';
import {Role, User} from '../models/user';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private byID = new RequestCache<string, User>((userID) => {
    return this.http.get<User>(`${environment.api}/users/${userID}`).pipe(
      shareReplay(1)
    );
  });

  private byNameOrEmail = new RequestCache<string, User[]>((query) => {
    return this.http.get<User[]>(`${environment.api}/users`, {params: {q: query}}).pipe(
      shareReplay(1)
    );
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

  public searchByNameOrEmail(query: string): Observable<User[]> {
    return this.byNameOrEmail.getObservable(query);
  }

  public createUserWithEmail(email: string): Observable<User> {
    return this.http.post<User>(`${environment.api}/users`, {
      email,
      anon: true,
      name: '',
      role: 'student'
    });
  }

  public setRole(user: User, role: Role) {
    return this.http.put<User>(`${environment.api}/users/${user.id}`, {
      role
    });
  }
}
