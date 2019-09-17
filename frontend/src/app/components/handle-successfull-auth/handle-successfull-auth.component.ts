import {Component, OnInit, NgZone} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {AuthService} from 'src/app/services/auth.service';
import {ToastService} from '../../services/toasts.service';

@Component({
  selector: 'app-handle-successfull-auth',
  templateUrl: './handle-successfull-auth.component.html',
  styleUrls: ['./handle-successfull-auth.component.scss']
})
export class HandleSuccessfullAuthComponent implements OnInit {
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    private auth: AuthService,
    private toastService: ToastService) { }

  ngOnInit() {
    // Note: Below 'queryParams' can be replaced with 'params' depending on your requirements
    this.activatedRoute.queryParams.subscribe(params => {
      const authToken = params.token;
      this.auth.verifyLoginAAU(authToken).then((user) => {
        this.ngZone.run(() => {
          this.toastService.add(`Logged in as ${user.role}`);
          const path = localStorage.getItem('preLoginPath');
          localStorage.removeItem('preLoginPath');
          this.router.navigateByUrl(path);
        });
      });
    });
  }

}
