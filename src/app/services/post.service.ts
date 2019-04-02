import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { ToastService } from './toasts.service';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Post } from '../models/post';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  constructor(private db: AngularFirestore) { }

  public getPosts(course: String): Observable<Post[]> {
    return this.db.collection<Post>('posts', ref => {
        return ref.where('course', '==', course).orderBy('created', 'desc');
    }).snapshotChanges().pipe(map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data();
        const id = a.payload.doc.id;
        return {id, ...data};
      });
    }));
  }

  public createOrUpdatePost(post: Post): Promise<void> {
    const id = post.id ? post.id : this.db.collection<Post>('posts').ref.doc().id;
    const ref = this.db.firestore.collection('posts').doc(id);
    return ref.set(Object.assign({id: id}, post));
  }

  public deletePost(post: Post): Promise<void> {
    return this.db.collection<Post>('posts').doc(post.id).delete();
  }
}
