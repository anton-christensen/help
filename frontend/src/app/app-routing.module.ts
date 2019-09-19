import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AdminComponent} from './pages/admin/admin.component';
import {CourseListComponent} from './pages/course-list/course-list.component';
import {CourseExistsGuard} from './guards/course-exists.guard';
import {CourseComponent} from './pages/course/course.component';
import {IsLecturerGuard} from './guards/is-role.guard';
import {InstituteListComponent} from './pages/institute-list/institute-list.component';
import {InstituteExistsGuard} from './guards/institute-exists.guard';
import {HandleSuccessfullAuthComponent} from './components/handle-successfull-auth/handle-successfull-auth.component';

const routes: Routes = [
  {path: 'auth', component: HandleSuccessfullAuthComponent},
  {path: 'admin', component: AdminComponent, canActivate: [IsLecturerGuard]},
  {path: 'departments/:institute/courses/:course', component: CourseComponent, canActivate: [InstituteExistsGuard, CourseExistsGuard]},
  {path: 'departments/:institute/courses', component: CourseListComponent, canActivate: [InstituteExistsGuard]},
  {path: 'departments/:institute', canActivate: [InstituteExistsGuard], redirectTo: '/departments/:institute/courses'},
  {path: 'departments', component: InstituteListComponent},
  {path: '**', redirectTo: 'departments'},
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }