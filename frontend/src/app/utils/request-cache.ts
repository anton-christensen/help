import {Observable} from 'rxjs';

export class RequestCache<T, T2> {
  private readonly timeLimit = 750;
  private readonly requestFunction: (T) => Observable<T2>;
  private cache: {
    key: T,
    time: number,
    observable: Observable<T2>
  }[];

  constructor(request: (T) => Observable<T2>) {
    this.requestFunction = request;
    this.cache = [];
  }

  public getObservable(query: T): Observable<T2> {
    let found = this.cache.find((el) => JSON.stringify(el.key) === JSON.stringify(query));
    if (!found || found.time < Date.now() - this.timeLimit) {
      found = {
        key: query,
        time: Date.now(),
        observable: this.requestFunction(query)
      };

      this.cache.push(found);
    }

    return found.observable;
  }
}
