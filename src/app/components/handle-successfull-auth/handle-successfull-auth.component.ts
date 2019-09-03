import {Component, OnInit, NgZone} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {AuthService} from 'src/app/services/auth.service';

@Component({
  selector: 'app-handle-successfull-auth',
  templateUrl: './handle-successfull-auth.component.html',
  styleUrls: ['./handle-successfull-auth.component.scss']
})
export class HandleSuccessfullAuthComponent implements OnInit {
  constructor(
    private activatedRoute: ActivatedRoute,
    public auth: AuthService,
    private router: Router,
    private ngZone: NgZone) { }

  ngOnInit() {
    // Note: Below 'queryParams' can be replaced with 'params' depending on your requirements
    this.activatedRoute.queryParams.subscribe(params => {
      const authToken = params.token;
      this.auth.verifyLoginAAU(authToken).then(() => {
        this.ngZone.run(() => {
          this.router.navigateByUrl(localStorage.getItem('pre-login-path'));
        });
      });
    });
  }

}
