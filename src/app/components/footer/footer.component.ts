import { Component, OnInit, Inject } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  public returnTarget = 'https://help.aau.dk';
  private currentPath = '/';

  constructor(public auth: AuthService) {}

  ngOnInit() {}


}
