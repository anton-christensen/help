import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import {CommonService} from '../../services/common.service';
import {Observable} from 'rxjs';
import {AngularFirestore} from '@angular/fire/firestore';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  d: Observable<any>;

  constructor(public auth: AuthService,
              private afStore: AngularFirestore,
              private commonService: CommonService) {}

  ngOnInit() {
    this.commonService.currentLocation = 'admin';
    this.commonService.setTitle(`Admin panel`);

    // this.d = this.afStore.collection('courses').valueChanges();
  }

}
