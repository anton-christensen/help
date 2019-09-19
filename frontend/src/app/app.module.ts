import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {AngularFireModule} from '@angular/fire';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {AngularFireMessagingModule} from '@angular/fire/messaging';
import {MarkdownModule} from 'ngx-markdown';
import {ScrollToModule} from '@nicky-lenaers/ngx-scroll-to';
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
import {AdminComponent} from './pages/admin/admin.component';
import {ModalComponent} from './components/modal/modal.component';
import {CourseEditComponent} from './pages/course-edit/course-edit.component';
import {InstituteListComponent} from './pages/institute-list/institute-list.component';
import {MenuComponent} from './components/menu/menu.component';
import {EmphasizedComponent} from './components/emphasized/emphasized.component';
import {RoleEditComponent} from './components/role-edit/role-edit.component';
import {HandleSuccessfullAuthComponent} from './components/handle-successfull-auth/handle-successfull-auth.component';
import { ServiceWorkerModule } from '@angular/service-worker';

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
    AdminComponent,
    ModalComponent,
    CourseEditComponent,
    InstituteListComponent,
    MenuComponent,
    EmphasizedComponent,
    RoleEditComponent,
    HandleSuccessfullAuthComponent,
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule,
    MarkdownModule.forRoot(),
    ScrollToModule.forRoot(),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireMessagingModule,
    AngularFirestoreModule,
    AngularFireAuthModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}