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

  constructor(@Inject(DOCUMENT) private document: Document,
              public auth: AuthService,
              private router: Router,
              private location: PlatformLocation) {
    router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.currentPath = val.urlAfterRedirects;
      }
    });
    this.returnTarget = `${location.protocol}//${location.hostname}${location.port.length ? ':' + location.port : ''}`;
  }

  ngOnInit() {
  }

  public clickLogin() {
    localStorage.setItem('pre-login-path', this.currentPath);
    this.document.location.href = `https://help.aau.dk/login?target=${this.returnTarget}`;
  }

}
