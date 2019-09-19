import {Component, OnInit, NgZone} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {AuthService} from 'src/app/services/auth.service';
import {ToastService} from '../../services/toasts.service';

@Component({
  selector: 'app-handle-successful-auth',
  templateUrl: './handle-successful-auth.component.html',
  styleUrls: ['./handle-successful-auth.component.scss']
})
export class HandleSuccessfulAuthComponent implements OnInit {
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
      localStorage.setItem('token', authToken);
      this.auth.getUser()
        .subscribe(() => {
          const path = localStorage.getItem('preLoginPath');
          localStorage.removeItem('preLoginPath');
          this.router.navigateByUrl(path);
      });
    });
  }

}
