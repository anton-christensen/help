import {APP_INITIALIZER, NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {AngularFireModule} from '@angular/fire';
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
import {DepartmentListComponent} from './pages/department-list/department-list.component';
import {MenuComponent} from './components/menu/menu.component';
import {RoleEditComponent} from './components/role-edit/role-edit.component';
import {HandleSuccessfulAuthComponent} from './components/handle-successful-auth/handle-successful-auth.component';
import {ServiceWorkerModule} from '@angular/service-worker';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {TokenInterceptor} from './providers/token.interceptor';
import {UserProvider} from "./providers/user.provider";

export function userProviderFactory(provider: UserProvider) {
  return () => provider.authenticate();
}

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
    DepartmentListComponent,
    MenuComponent,
    RoleEditComponent,
    HandleSuccessfulAuthComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    MarkdownModule.forRoot(),
    ScrollToModule.forRoot(),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireMessagingModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    UserProvider,
    {
      provide: APP_INITIALIZER,
      useFactory: userProviderFactory,
      deps: [UserProvider],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})

export class AppModule {}
