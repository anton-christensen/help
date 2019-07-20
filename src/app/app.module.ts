import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {AngularFireModule} from '@angular/fire';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {AngularFireMessagingModule} from '@angular/fire/messaging';
import {MarkdownModule} from 'ngx-markdown';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {environment} from '../environments/environment';


import {ToastsComponent} from './components/toasts/toasts.component';
import {FooterComponent} from './components/footer/footer.component';
import {CourseListComponent} from './pages/course-list/course-list.component';
import {CourseComponent} from './pages/course/course.component';
import {StudentComponent} from './components/student/student.component';
import {AssistantComponent} from './components/assistant/assistant.component';
import {PostsComponent} from './components/posts/posts.component';
import {CourseLinkComponent} from './components/course-link/course-link.component';
import {LoaderComponent} from './components/loader/loader.component';
import {CourseBurgerBarComponent} from './components/course-burger-bar/course-burger-bar.component';
import {AdminComponent} from './pages/admin/admin.component';
import { ModalComponent } from './components/modal/modal.component';
import { CourseEditComponent } from './pages/course-edit/course-edit.component';
import { InstituteListComponent } from './pages/institute-list/institute-list.component';
import { MenuComponent } from './components/menu/menu.component';
import { EmphasizedComponent } from './components/emphasized/emphasized.component';
import { RoleEditComponent } from './components/role-edit/role-edit.component';

@NgModule({
  declarations: [
    AppComponent,
    ToastsComponent,
    FooterComponent,
    CourseListComponent,
    CourseComponent,
    StudentComponent,
    AssistantComponent,
    PostsComponent,
    CourseLinkComponent,
    LoaderComponent,
    CourseBurgerBarComponent,
    AdminComponent,
    ModalComponent,
    CourseEditComponent,
    InstituteListComponent,
    MenuComponent,
    EmphasizedComponent,
    RoleEditComponent,
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
export class AppModule {}
