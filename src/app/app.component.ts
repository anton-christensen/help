import {Component} from '@angular/core';
import {AuthService} from './services/auth.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Question} from './question';
import {Post} from './post';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent {
  public name: string;
  public questions$: Observable<Question[]>;
  public posts$: Observable<Post[]>;

  public roomNumber: string;

  public postId: string;
  public postContent: string;

  constructor(public auth: AuthService,
              private db: AngularFirestore) {

    this.postId = '';
    this.name = Math.random() > 0.5 ? 'Anton' : 'Henrik';

    this.questions$ = this.db.collection<Question>('questions').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return {id, ...data};
        });
      }));

    this.posts$ = this.db.collection<Post>('posts').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return {id, ...data};
        });
      }));
  }

  submitPost() {
    const id = this.postId ? this.postId : this.db.collection('posts').ref.doc().id;
    const ref = this.db.firestore.collection('posts').doc(id);

    console.log(id);

    ref.get()
      .then(doc => {
        ref.set(Object.assign({}, new Post(id, this.postContent)));
      })
      .then(() => {
        this.postId = '';
        this.postContent = '';
      });
  }

  submitQuestion() {
    const id = this.db.collection('questions').ref.doc().id;
    const ref = this.db.firestore.collection('questions').doc(id);

    ref.get()
      .then(doc => {
          ref.set(Object.assign({}, new Question(id, this.roomNumber)));
      })
      .then(() => {
        this.roomNumber = '';
      });
  }

  public deleteQuestion(id) {
    const ref = this.db.firestore.collection('questions').doc(id);
    return ref.get()
      .then(() => {
        ref.delete();
      });
  }

  public deletePost(id: string) {
    const ref = this.db.firestore.collection('posts').doc(id);
    return ref.get()
      .then(() => {
        ref.delete();
      });
  }

  editPost(id: string) {
    return this.db.doc<Post>(`posts/${id}`).valueChanges()
      .subscribe((post) => {
        this.postId = id;
        this.postContent = post.content;
      });
  }

  public isDatePresent(question: Question): boolean {
    return question && question.created && question.created['seconds'];
  }

}
