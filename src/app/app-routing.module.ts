import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AdminComponent} from './components/admin/admin.component';
import {CourseListComponent} from './components/course-list/course-list.component';
import {CourseExistsGuard} from './guards/course-exists.guard';
import {IsAdminGuard} from './guards/is-admin.guard';
import {CourseComponent} from './components/course/course.component';

const routes: Routes = [
  { path: 'admin', component: AdminComponent, canActivate: [IsAdminGuard]},
  { path: 'courses', component: CourseListComponent},
  { path: 'courses/:course', component: CourseComponent, canActivate: [CourseExistsGuard] },
  { path: '**', redirectTo: 'courses' },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
