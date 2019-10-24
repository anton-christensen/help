import {Observable, ReplaySubject, Subscription} from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export class RequestCache<T, T2> {
  private readonly timeLimit;
  private readonly requestFunction: (T) => Observable<T2>;
  private readonly cache: {
    [key: string]: {
      subscription: Subscription,
      observable:   Observable<T2>
    }
  };

  constructor(request: (T) => Observable<T2>, timeLimit = 750) {
    this.requestFunction = request;
    this.timeLimit = timeLimit;
    this.cache = {};
  }

  public getObservable(query: T, force = false): Observable<T2> {
    const key = JSON.stringify(query);
    let cacheEntry = this.cache[key];

    if (force || !cacheEntry) {
      if(cacheEntry && cacheEntry.subscription) {
        cacheEntry.subscription.unsubscribe();
      }
      
      cacheEntry = { 
        subscription: null, 
        observable: null
      };
      
      cacheEntry.observable = new Observable<T2>((subscriber) => {
        cacheEntry.subscription = this.requestFunction(query).subscribe(data => {
          subscriber.next(data);
        });

        return () => {
          cacheEntry.subscription.unsubscribe();
          delete this.cache[key];
        }
      });
      
      (this.cache[key] as any) = cacheEntry;
      if (this.timeLimit > 0) {
        setTimeout(() => {
          if(this.cache[key]) {
            this.cache[key].subscription.unsubscribe();
            delete this.cache[key];
          }
        }, this.timeLimit)
      }
    }

    return cacheEntry.observable;
  }
}
