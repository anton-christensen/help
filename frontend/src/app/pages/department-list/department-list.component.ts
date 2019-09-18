import {Component, OnInit} from '@angular/core';
import {DepartmentService} from '../../services/department.service';
import {Department} from '../../models/department';
import {CommonService} from '../../services/common.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-department-list',
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.scss']
})
export class DepartmentListComponent implements OnInit {
  public departments$: Observable<Department[]>;

  constructor(private commonService: CommonService,
              private departmentService: DepartmentService) {}

  ngOnInit() {
    this.commonService.setTitle('Departments');
    this.commonService.currentLocation = 'departmentList';

    this.departments$ = this.departmentService.getAll();
  }
}
