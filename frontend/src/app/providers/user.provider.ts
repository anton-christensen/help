import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {first, map} from 'rxjs/operators';
import {APIResponse, responseAdapter} from '../models/api-response';
import {Token, tokenStorageKey, TokenWrapper} from '../models/user';

@Injectable()
export class UserProvider {
  constructor(private http: HttpClient) {}

  // We must have some kind of user before the rest of the app loads
  public authenticate(): Promise<Token> {
    return new Promise<Token>((resolve) => {
      // Look on local storage for a token
      const token = localStorage.getItem(tokenStorageKey);

      if (token) {
        // If we have one, great!
        resolve(token);
      } else {
        // Otherwise, we will request a new anonymous token
        this.http.get<APIResponse<TokenWrapper>>(`${environment.api}/anon/auth`).pipe(
          first(),
          map((response) => responseAdapter<TokenWrapper>(response).token),
        ).subscribe((newToken) => {
          localStorage.setItem(tokenStorageKey, newToken);
          resolve(newToken);
        });
      }
    });
  }
}
