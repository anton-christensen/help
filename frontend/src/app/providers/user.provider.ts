import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {first, map, switchMap} from 'rxjs/operators';
import {APIResponse, responseAdapter} from '../models/api-response';
import {Token, tokenStorageKey, TokenWrapper} from '../models/user';

@Injectable()
export class UserProvider {
  constructor(private http: HttpClient) {}

  public authenticate(): Promise<Token> {
    return new Promise<Token>((resolve) => {
      const token = localStorage.getItem(tokenStorageKey);

      if (token) {
        resolve(token)
      } else {
        this.http.get<APIResponse<TokenWrapper>>(`${environment.api}/anon/auth`).pipe(
          first(),
          map((response) => responseAdapter<TokenWrapper>(response).token),
        ).subscribe((token) => {
          localStorage.setItem(tokenStorageKey, token);
          resolve(token);
        });
      }
    });
  }
}
