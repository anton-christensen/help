import {Component, OnInit} from '@angular/core';
import {AuthService} from './services/auth.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Question} from './question';
import {Post} from './post';
import {AngularFireMessaging} from '@angular/fire/messaging';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent implements OnInit {
  public name: string;
  public questions$: Observable<Question[]>;
  public posts$: Observable<Post[]>;

  public roomNumber: string;

  public postId: string;
  public postContent: string;

  constructor(public auth: AuthService,
              private db: AngularFirestore,
              private afMessaging: AngularFireMessaging) {

    this.postId = '';

    this.questions$ = this.db.collection<Question>('questions', ref => ref.orderBy('created')).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return {id, ...data};
        });
      }));

    this.posts$ = this.db.collection<Post>('posts', ref => ref.orderBy('created', 'desc')).snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return {id, ...data};
        });
      }));

    this.afMessaging.messages
      .subscribe((message) => {
        console.log(message);
      });
  }

  ngOnInit(): void {
    const sub = this.auth.user$
      .subscribe(() => {
        this.afMessaging.requestToken
          .subscribe((token) => {
              sub.unsubscribe();
              this.auth.addMessagingToken(token);
            },
            (error) => {
              sub.unsubscribe();
              console.error(error);
            }
          );
        }
    );
  }

  submitPost() {
    const id = this.postId ? this.postId : this.db.collection('posts').ref.doc().id;
    const ref = this.db.firestore.collection('posts').doc(id);

    console.log(id);

    ref.get()
      .then(doc => {
        if(doc.exists)
          return ref.update('content', this.postContent);
        else
          return ref.set(Object.assign({}, new Post(id, this.postContent)));
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

  public timeConverter(timestamp) {
    // var time = (Date.now()-1000*60*60) - question.created.toMillis();
    var time = timestamp.toMillis();
    return time;
  }

}
