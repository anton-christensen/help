import {Component, OnInit, AfterViewInit} from '@angular/core';
import {Observable, combineLatest} from 'rxjs';
import {Post} from 'src/app/models/post';
import {AuthService} from 'src/app/services/auth.service';
import {PostService} from 'src/app/services/post.service';
import {FormGroup, FormControl} from '@angular/forms';
import {Course} from 'src/app/models/course';
import {ModalService} from 'src/app/services/modal.service';
import {SessionService} from 'src/app/services/session.service';
import {switchMap} from 'rxjs/operators';
import {CommonService} from '../../services/common.service';
import * as SimpleMDE from 'simplemde';
import { ScrollToService } from '@nicky-lenaers/ngx-scroll-to';
import { User } from 'src/app/models/user';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.scss']
})
export class PostsComponent implements OnInit, AfterViewInit {
  public course$: Observable<Course>;
  public course: Course;
  public user: User;
  public posts$: Observable<Post[]>;
  public editing = false;
  private wysiwyg: SimpleMDE;

  public form = new FormGroup({
    id: new FormControl(),
    content: new FormControl('')
  });

  constructor(public modalService: ModalService,
              public auth: AuthService,
              private postService: PostService,
              private session: SessionService,
              private _scrollToService: ScrollToService) {
  }

  ngOnInit() {
    this.course$ = this.session.getCourse$();

    this.posts$ = this.course$.pipe(
      switchMap((course) => {
        return this.postService.getAllByCourse(course);
      })
    );
  }

  private reInitEditor() {

  }

  ngAfterViewInit() {
    combineLatest(this.auth.user$, this.course$).subscribe((val) => {
      const user = val[0];
      const course = val[1];
      if (!user || !course || this.wysiwyg) {
        return;
      }
      if (!course.associatedUserIDs.includes(user.id) && user.role !== 'admin') {
        return;
      }

      this.wysiwyg = new SimpleMDE({
        forceSync: true,
        spellChecker: false,
        status: false,
        placeholder: 'Write a post on the bulletin board.\nPosts can be styled by using markdown.\nClick the \'?\' to get an overview of what is possible.'
      });
      this.wysiwyg.codemirror.on('change', () => {
        this.form.controls.content.setValue( this.wysiwyg.value() );
      });
    });
  }

  public submitPost(course: Course) {
    if (this.form.invalid) {
      return;
    }

    const post: Post = {
      id: this.form.value.id,
      content: this.form.value.content,
      courseID: course.id,
      created: firebase.firestore.FieldValue.serverTimestamp()
    };

    this.postService.createOrUpdatePost(post).then(() => {
      this.cancelEdit();
    });
  }

  public editPost(post: Post) {
    this.form.setValue({
      content: post.content,
      id: post.id
    });
    this.wysiwyg.value(post.content);

    this.editing = true;

    this._scrollToService.scrollTo({target: 'editor-header', duration: 250});
  }

  public deletePost(post: Post) {
    this.modalService.add(
      'Are you sure you want to delete this post?',
      {text: 'Yes, delete', type: 'negative'},
      {text: 'No, keep it', type: 'neutral'})
      .then((btn) => {
        if (btn.type !== 'negative') {
          return;
        }
        this.postService.deletePost(post);
      })
      .catch();
  }

  public cancelEdit() {
    this.wysiwyg.value('');
    this.form.reset();
    this.editing = false;

    if (this.wysiwyg.isFullscreenActive()) {
      SimpleMDE.toggleFullScreen(this.wysiwyg);
    }
  }

  public hasCreatedDate(post: any): boolean {
    return CommonService.documentIsCreatedDatePresent(post);
  }
}
