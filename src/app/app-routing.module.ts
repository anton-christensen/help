import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AdminComponent} from './components/pages/admin/admin.component';
import {CourseListComponent} from './components/pages/course-list/course-list.component';
import {CourseExistsGuard} from './guards/course-exists.guard';
import {CourseComponent} from './components/pages/course/course.component';
import {LecturerComponent} from './components/pages/lecturer/lecturer.component';
import { IsAdminGuard, IsLecturerGuard } from './guards/is-role.guard';

const routes: Routes = [
  { path: 'admin', component: AdminComponent, canActivate: [IsAdminGuard]},
  { path: 'admin/courses/', component: LecturerComponent, canActivate: [IsLecturerGuard]},
  { path: 'courses', component: CourseListComponent},
  { path: 'courses/:course', component: CourseComponent, canActivate: [CourseExistsGuard] },
  //{ path: '**', redirectTo: 'courses' },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
