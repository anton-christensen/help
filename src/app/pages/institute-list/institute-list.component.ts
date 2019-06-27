import { Component, OnInit } from '@angular/core';
import {InstituteService} from '../../services/institute.service';
import {Observable} from 'rxjs';
import {Institute} from '../../models/institute';

@Component({
  selector: 'app-institute-list',
  templateUrl: './institute-list.component.html',
  styleUrls: ['./institute-list.component.scss']
})
export class InstituteListComponent implements OnInit {
  public institutes$: Observable<Institute[]>;

  constructor(private instituteService: InstituteService) { 
  }

  ngOnInit() {
    this.institutes$ = this.instituteService.getAll();
  }

}
