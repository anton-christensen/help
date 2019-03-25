import { Component, OnInit } from '@angular/core';
import {AuthService} from '../services/auth.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styles: []
})
export class LoginComponent implements OnInit {

  constructor(private auth: AuthService) { }

  ngOnInit() {
  }

  public login() {
    this.auth.login();
  }

  public logout() {
    this.auth.logout();
  }

  loggedIn() {
    return this.auth.loggedIn();
  }
}
