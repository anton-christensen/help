import { NgModule } from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CourseExistsGuard } from './guards/course-exists.guard';
import { MissingCourseComponent } from './components/missing-course/missing-course.component';

const routes: Routes = [
  { path: 'course-not-found', component: MissingCourseComponent},
  { path: ':course', component: HomeComponent, canActivate: [CourseExistsGuard] },
  { path: '**', redirectTo: 'course-not-found' },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
