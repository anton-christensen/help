import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {first} from "rxjs/operators";

@Injectable()
export class UserProvider {
  constructor(private http: HttpClient) {}

  public authenticate(): Promise<string> {
    return new Promise<string>((resolve) => {
      const token = localStorage.getItem('token');

      if (token) {
        resolve(token)
      } else {
        return this.http.get<string>(`${environment.api}/anon/auth`).pipe(first())
          .subscribe((token) => {
            localStorage.setItem('token', token);
            resolve(token);
          });
      }
    });
  }
}
