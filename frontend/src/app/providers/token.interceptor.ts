import {Injectable} from '@angular/core';
import {HttpRequest, HttpHandler, HttpEvent, HttpInterceptor} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Token, tokenStorageKey} from '../models/user';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor() {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token: Token = localStorage.getItem(tokenStorageKey);

    if (token) {
      request = request.clone({
        setHeaders: {
          'auth-token': token
        }
      });
    }

    return next.handle(request);
  }
}
