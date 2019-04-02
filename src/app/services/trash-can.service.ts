import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TrashCan } from '../models/trash-can';
import { map } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { ToastService } from './toasts.service';

@Injectable({
  providedIn: 'root'
})
export class TrashCanService {

  constructor(private db: AngularFirestore,
              private toastService: ToastService) {}

  public getTrashCans(course: String): Observable<TrashCan[]> {
    return this.db.collection<TrashCan>('trash-cans', (ref) => {
      return ref.where('course', '==', course).orderBy('created', 'desc')
    }).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return {id, ...data};
        });
      }));
  }

  public addTrashCan(course: string, room): Promise<any> {
    const id = this.db.collection<TrashCan>('trash-cans').ref.doc().id;
    const ref = this.db.collection<TrashCan>('trash-cans').doc(id);
    
    return ref.set(Object.assign({}, new TrashCan(id, course, room)));
  }

  public deleteTrashCan(can: TrashCan): Promise<any> {
    return this.db.collection<TrashCan>('trash-cans').doc(can.id).delete();
    }
}
