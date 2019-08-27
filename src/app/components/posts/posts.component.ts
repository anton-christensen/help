import {Component, OnInit, AfterViewInit} from '@angular/core';
import {Observable} from 'rxjs';
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
// declare var SimpleMDE : any;

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.scss']
})
export class PostsComponent implements OnInit, AfterViewInit {
  public course$: Observable<Course>;
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
              private session: SessionService) {
  }

  ngOnInit() {
    this.course$ = this.session.getCourse$();

    this.posts$ = this.course$.pipe(
      switchMap((course) => {
        return this.postService.getAllByCourse(course);
      })
    );
  }

  ngAfterViewInit() {
    this.wysiwyg = new SimpleMDE({
      forceSync: true,
      spellChecker: false,
      status: false,
      placeholder: "Write a post on the bulletin board.\nStyling is done in markdown.\nClick the ?-mark to get an overview"
    });
    this.wysiwyg.codemirror.on("change", () => {
      this.form.controls['content'].setValue( this.wysiwyg.value() );
    });
  }

  public submitPost(course: Course) {
    if (this.form.invalid) {
      return;
    }

    const post = new Post(this.form.value.id, course.id, this.form.value.content);
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
  }

  public deletePost(post: Post) {
    this.modalService.add('Are you sure you want to delete this post?')
      .then(() => {
        this.postService.deletePost(post);
      })
      .catch(() => {});
  }

  public cancelEdit() {
    this.wysiwyg.value("");
    this.form.reset();
    this.editing = false;

    if(this.wysiwyg.isFullscreenActive()) {
      SimpleMDE.toggleFullScreen(this.wysiwyg);
    }
  }

  public hasCreatedDate(post: any): boolean {
    return CommonService.documentIsCreatedDatePresent(post);
  }
}
