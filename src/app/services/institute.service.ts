import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Institute } from '../models/institute';

@Injectable({
  providedIn: 'root'
})
export class InstituteService {

  constructor(private db: AngularFirestore) { }

  public getAll(): Observable<Institute[]> {
    return this.db.collection<Institute>('institutes', ref => {
      return ref.orderBy('title', 'asc');
    }).snapshotChanges().pipe(map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data();
        const id = a.payload.doc.id;
        return {id, ...data};
      });
    }));
  }
}
