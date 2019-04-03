import {NgModule} from "@angular/core";
import {ReactiveFormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {AngularFireModule} from "@angular/fire";
import {AngularFireAuthModule} from "@angular/fire/auth";
import {AngularFirestoreModule} from "@angular/fire/firestore";
import {AngularFireMessagingModule} from "@angular/fire/messaging";
import {MarkdownModule} from "ngx-markdown";

import {AppComponent} from "./app.component";
import {AppRoutingModule} from "./app-routing.module";
import {environment} from "../environments/environment";

import {ToastComponent} from "./components/toast/toast.component";
import {FooterComponent} from "./components/footer/footer.component";
import {CourseListComponent} from "./components/course-list/course-list.component";
import {CourseComponent} from "./components/course/course.component";
import {StudentComponent} from "./components/student/student.component";
import {TaComponent} from "./components/ta/ta.component";
import {PostsComponent} from "./components/posts/posts.component";

@NgModule({
  declarations: [
    AppComponent,
    ToastComponent,
    FooterComponent,
    CourseListComponent,
    CourseComponent,
    StudentComponent,
    TaComponent,
    PostsComponent,
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
