import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import {CommonService} from '../../services/common.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  constructor(public auth: AuthService,
              private commonService: CommonService) {}

  ngOnInit() {
    this.commonService.setTitle(`Admin panel`);
  }

}
