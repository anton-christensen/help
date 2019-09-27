import {Observable} from 'rxjs';

export class RequestCache<T, T2> {
  private readonly timeLimit;
  private readonly requestFunction: (T) => Observable<T2>;
  private readonly cache: {
    [key: string]: Observable<T2>
  };

  constructor(request: (T) => Observable<T2>, timeLimit = 750) {
    this.requestFunction = request;
    this.timeLimit = timeLimit;
    this.cache = {};
  }

  public getObservable(query: T): Observable<T2> {
    const key = JSON.stringify(query);
    let observable = this.cache[key];

    if (!observable) {
      observable = this.requestFunction(query);

      this.cache[key] = observable;
      setTimeout(() => {
        delete this.cache[key];
      }, this.timeLimit)
    }

    return observable;
  }
}
