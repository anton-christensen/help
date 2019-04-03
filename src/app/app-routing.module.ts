import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CourseListComponent} from './components/course-list/course-list.component';
import {CourseExistsGuard} from './guards/course-exists.guard';
import {CourseComponent} from './components/course/course.component';

const routes: Routes = [
  { path: 'courses', component: CourseListComponent},
  { path: 'course/:course', component: CourseComponent, canActivate: [CourseExistsGuard] },
  { path: '**', redirectTo: 'courses' },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
