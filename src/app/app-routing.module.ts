import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AdminComponent} from './pages/admin/admin.component';
import {CourseListComponent} from './pages/course-list/course-list.component';
import {CourseExistsGuard} from './guards/course-exists.guard';
import {CourseComponent} from './pages/course/course.component';
import {LecturerComponent} from './pages/lecturer/lecturer.component';
import { IsAdminGuard, IsLecturerGuard } from './guards/is-role.guard';
import {InstituteListComponent} from './pages/institute-list/institute-list.component';
import {InstituteExistsGuard} from './guards/institute-exists.guard';

const routes: Routes = [
  { path: 'admin', component: AdminComponent, canActivate: [IsAdminGuard]},
  { path: 'institutes', component: InstituteListComponent},

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

  { path: ':institute', canActivate: [InstituteExistsGuard], children: [
      { path: 'admin/courses', component: LecturerComponent, canActivate: [IsLecturerGuard]},
      { path: 'courses', component: CourseListComponent},
      { path: 'courses/:course', component: CourseComponent, canActivate: [CourseExistsGuard] },
      { path: '', redirectTo: 'courses', pathMatch: 'full' },
    ]},
  { path: '**', redirectTo: 'institutes' },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
