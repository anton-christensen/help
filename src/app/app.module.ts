import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {environment} from '../environments/environment.prod';
import {AngularFireModule} from '@angular/fire';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {AppRoutingModule} from './app-routing.module';
import {ReactiveFormsModule} from '@angular/forms';
import {AngularFireMessagingModule} from '@angular/fire/messaging';
import {MarkdownModule} from 'ngx-markdown';
import { AdminComponent } from './components/admin/admin.component';
import { StudentComponent } from './components/student/student.component';
import { PostsComponent } from './components/posts/posts.component';
import { FooterComponent } from './components/footer/footer.component';
import { HomeComponent } from './components/home/home.component';
import { ToastComponent } from './components/toast/toast.component';
import { MissingCourseComponent } from './components/missing-course/missing-course.component';

@NgModule({
  declarations: [
    AppComponent,
    AdminComponent,
    StudentComponent,
    PostsComponent,
    FooterComponent,
    HomeComponent,
    ToastComponent,
    MissingCourseComponent,
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireMessagingModule,
    AngularFirestoreModule,
    AngularFireAuthModule,
    MarkdownModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
