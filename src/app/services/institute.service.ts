import { Injectable } from '@angular/core';
import {AngularFirestore, QueryFn} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Institute } from '../models/institute';
import {CommonService} from './common.service';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InstituteService {

  constructor(private afStore: AngularFirestore) { }

  public getAll(): Observable<Institute[]> {
    return this.getMultiple((ref) => {
      return ref.orderBy('title', 'asc');
    });
  }

  public getBySlug(slug: string): Observable<Institute> {
    return this.getSingle((ref) => {
      return ref.where('slug', '==', slug);
    });
  }

  public isActualInstitute(slug: string): Observable<boolean> {
    return this.getBySlug(slug).pipe(
      map((institute) => {
        return !!institute;
      })
    );
  }

  private getSingle(qFn: QueryFn): Observable<Institute> {
    return CommonService.getSingle<Institute>(this.afStore, 'institutes', qFn);
  }

  private getMultiple(qFn: QueryFn): Observable<Institute[]> {
    return CommonService.getMultiple<Institute>(this.afStore, 'institutes', qFn);
  }
}
