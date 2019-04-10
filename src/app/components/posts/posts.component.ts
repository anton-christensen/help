import { Component, OnInit, Input } from '@angular/core';
import {Observable} from 'rxjs';
import {Post} from 'src/app/models/post';
import { AuthService } from 'src/app/services/auth.service';
import { PostService } from 'src/app/services/post.service';
import { FormGroup, FormControl } from '@angular/forms';
import { Course } from 'src/app/models/course';
import { CommonService } from 'src/app/services/common.service';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.scss']
})
export class PostsComponent implements OnInit {
  @Input() public course: Course;
  public posts$: Observable<Post[]>;
  public editing = false;

  public form = new FormGroup({
    id: new FormControl(),
    content: new FormControl('')
  });

  constructor(public  common        :CommonService,
              public  modalService  :ModalService,
              public  auth          :AuthService,
              private postalService :PostService) {
  }

  ngOnInit() {
    this.posts$ = this.postalService.getPosts(this.course.slug);
  }

  public submitPost() {
    if (this.form.invalid) {
      return;
    }

    const post = new Post(this.form.value.id, this.course.slug, this.form.value.content);
    this.postalService.createOrUpdatePost(post).then(() => {
      this.form.reset();
      this.editing = false;
    });
  }

  public editPost(post: Post) {
    this.form.setValue({
      content: post.content,
      id: post.id
    });

    this.editing = true;
  }
  
  public deletePost(post: Post) {
    this.modalService.add('Are you sure you want to delete this post?')
      .then(() => {
        this.postalService.deletePost(post);
      })
      .catch(() => {});
  }
}
