import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AdminComponent} from './pages/admin/admin.component';
import {CourseListComponent} from './pages/course-list/course-list.component';
import {CourseExistsGuard} from './guards/course-exists.guard';
import {CourseComponent} from './pages/course/course.component';
import {IsLecturerGuard} from './guards/is-role.guard';
import {DepartmentListComponent} from './pages/department-list/department-list.component';
import {DepartmentExistsGuard} from './guards/department-exists-guard.service';
import {HandleSuccessfulAuthComponent} from './components/handle-successful-auth/handle-successful-auth.component';

const routes: Routes = [
  {path: 'auth', component: HandleSuccessfulAuthComponent},
  {path: 'admin', component: AdminComponent, canActivate: [IsLecturerGuard]},

  // Long links
  {path: 'departments/:department/courses/:course', component: CourseComponent, canActivate: [DepartmentExistsGuard, CourseExistsGuard]},
  {path: 'departments/:department/courses', component: CourseListComponent, canActivate: [DepartmentExistsGuard]},
  {path: 'departments/:department', canActivate: [DepartmentExistsGuard], redirectTo: '/departments/:department/courses'},
  {path: 'departments', component: DepartmentListComponent},

  // Short links
  {path: ':department/:course', component: CourseComponent, canActivate: [DepartmentExistsGuard, CourseExistsGuard]},
  {path: ':department', component: CourseListComponent, canActivate: [DepartmentExistsGuard]},
  {path: '', component: DepartmentListComponent},

  {path: '**', redirectTo: ''},
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
