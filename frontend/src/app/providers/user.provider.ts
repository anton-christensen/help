import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {first, map, tap} from 'rxjs/operators';
import {APIResponse, responseAdapter} from '../models/api-response';

type Token = string;
interface TokenWrapper {
  token: Token;
}

@Injectable()
export class UserProvider {
  constructor(private http: HttpClient) {}

  public authenticate(): Promise<Token> {
    return new Promise<Token>((resolve) => {
      const token = localStorage.getItem('token');

      if (token) {
        resolve(token)
      } else {
        return this.http.get<APIResponse<TokenWrapper>>(`${environment.api}/anon/auth`).pipe(
          first(),
          map((response) => responseAdapter<TokenWrapper>(response).token),
        ).subscribe((token) => {
            localStorage.setItem('token', token);
            resolve(token);
          });
      }
    });
  }
}
