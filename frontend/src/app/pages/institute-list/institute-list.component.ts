import { Component, OnInit } from '@angular/core';
import {InstituteService} from '../../services/institute.service';
import {Institute} from '../../models/institute';
import {CommonService} from '../../services/common.service';

@Component({
  selector: 'app-institute-list',
  templateUrl: './institute-list.component.html',
  styleUrls: ['./institute-list.component.scss']
})
export class InstituteListComponent implements OnInit {
  public institutes: Institute[];

  constructor(private commonService: CommonService,
              private instituteService: InstituteService) {}

  ngOnInit() {
    this.commonService.setTitle('Departments');
    this.commonService.currentLocation = 'instituteList';

    this.institutes = this.instituteService.getAll();
  }
}
