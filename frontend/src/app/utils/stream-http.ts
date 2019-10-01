import {from, Observable} from 'rxjs';
import {filter, map, scan, flatMap} from 'rxjs/operators';
import {APIResponse, responseAdapter} from '../models/api-response';

export function getListStreamObservable<T extends {id: string}>(url): Observable<T[]> {
  return new Observable<T[]>((subscriber) => {
    let firstTime = true;
    let results = [];

    getStreamObservable<APIResponse<T[]> | {new_val: T | null, old_val: T | null}>(url)
      .subscribe((response) => {
        if (!response) {
          return;
        }

        if (firstTime) {
          firstTime = false;
          const responseData = responseAdapter<T[]>(response as APIResponse<T[]>);
          results = responseData === null ? [] : responseData;
        } else {
          const oldVal = (response as {old_val: T | null}).old_val;
          const newVal = (response as {new_val: T | null}).new_val;
          if (newVal === null) {
            // Deletion
            results.splice(results.findIndex((val) => val.id === oldVal.id), 1);
          } else if (oldVal === null) {
            // Insertion
            results.push(newVal);
          } else {
            // Update
            results[results.findIndex((val) => val.id === oldVal.id)] = newVal;
          }
        }
        subscriber.next(results);
      }
    );
  });
}

export function getSingleStreamObservable<T>(url): Observable<T> {
  return new Observable<T>((subscriber) => {
    let firstTime = true;

    getStreamObservable<APIResponse<T> | {new_val: T | null, old_val: T | null}>(url)
      .subscribe((response) => {
        if (!response) {
          return;
        }

        if (firstTime) {
          firstTime = false;
          subscriber.next(responseAdapter<T>(response as APIResponse<T>));
        } else {
          const oldVal = (response as {old_val: T | null}).old_val;
          const newVal = (response as {new_val: T | null}).new_val;
          if (newVal === null) {
            // Deletion
            subscriber.next(null);
          } else if (oldVal === null) {
            // Insertion
            subscriber.next(newVal);
          } else {
            // Update
            subscriber.next(newVal);
          }
        }
      });
  });
}

function getStreamObservable<T>(url): Observable<T> {
  const xhr = new XMLHttpRequest();
  const textStream = extractStream(xhr, {endWithNewline: true});
  const jsonStream = collate(textStream).pipe(
    flatMap((v: string[]) => from(v)),
    map((jsonData: string) => JSON.parse(jsonData))
  );

  xhr.open('GET', url);

  const token = localStorage.getItem('token');
  if (token) {
    xhr.setRequestHeader('auth-token', token);
  }

  xhr.setRequestHeader('stream', 'true');
  xhr.send();

  return jsonStream;
}

function extractStream(xhr, options) {
  return new Observable((subscriber) => {
    let charactersSeen = 0;

    function notified() {
      if (xhr.readyState >= 3 && xhr.responseText.length > charactersSeen) {
        subscriber.next(xhr.responseText.substring(charactersSeen));
        charactersSeen = xhr.responseText.length;
      }
      if (xhr.readyState === 4) {
        if (options.endWithNewline && xhr.responseText[xhr.responseText.length - 1] !== '\n') { subscriber.next('\n'); }
        subscriber.complete();
      }
    }
    xhr.onreadystatechange = notified;
    xhr.onprogress = notified;
    xhr.onerror = (e) => subscriber.error(event);
  });
}

interface ILineSeparator {
  isLine: boolean;
  line: string;
  nextLine: string;
}

function collate(stream) {
  return stream.pipe(
    scan((state, data: string) => {
      const index = data.lastIndexOf('\n');
      const startOfLine = state.nextLine;
      if (index >= 0) {
        const line = startOfLine + data.substring(0, index + 1);
        const nextLine = data.substring(index + 1);
        return {
          isLine: true,
          line,
          nextLine
        };
      } else {
        return {
          isLine: false,
          line: '',
          nextLine: data,
        };
      }
    }, { isLine: true, nextLine: '', line: '' }),
    filter((x: ILineSeparator) => x.isLine),
    map((x: ILineSeparator) => x.line.split('\n').filter((i) => i.length > 0))
  );
}
