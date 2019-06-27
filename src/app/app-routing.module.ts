import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AdminComponent} from './pages/admin/admin.component';
import {CourseListComponent} from './pages/course-list/course-list.component';
import {CourseExistsGuard} from './guards/course-exists.guard';
import {CourseComponent} from './pages/course/course.component';
import {IsLecturerGuard} from './guards/is-role.guard';
import {InstituteListComponent} from './pages/institute-list/institute-list.component';
import {InstituteExistsGuard} from './guards/institute-exists.guard';

/*
/ -> /institutes
/institiutes (institute-list)
/institiutes/:institute -> /institiutes/:institute/courses
/institiutes/:institute/courses (courses-list)
/institiutes/:institute/courses/:course (course)

/admin
 # promote users to professors (professors are attached to an institute)
 # add courses to institutes
   # add users as TAs
*/

// { path: 'admin/courses', component: CourseEditComponent, canActivate: [IsLecturerGuard]},
const routes: Routes = [
  {path: 'admin', component: AdminComponent, canActivate: [IsLecturerGuard]},
  {path: 'institutes/:institute/courses/:course', component: CourseComponent, canActivate: [InstituteExistsGuard, CourseExistsGuard]},
  {path: 'institutes/:institute/courses', component: CourseListComponent, canActivate: [InstituteExistsGuard]},
  {path: 'institutes/:institute', canActivate: [InstituteExistsGuard], redirectTo: '/institutes/:institute/courses'},
  {path: 'institutes', component: InstituteListComponent},
  {path: '**', redirectTo: 'institutes'},
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
