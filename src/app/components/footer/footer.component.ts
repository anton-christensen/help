import { Component, OnInit } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import {AuthService} from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  public returnTarget: string = "https://help.aau.dk";
  constructor(public auth: AuthService,
              private router: Router,
              private location: PlatformLocation) { 
    console.log(location);
    this.returnTarget = `${location.protocol}//${location.hostname}${location.port.length ? ':'+location.port : ''}`;
    console.log(this.returnTarget);
  }

  ngOnInit() {
  }

}
