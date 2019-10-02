import {Component, OnInit, NgZone} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {AuthService} from 'src/app/services/auth.service';
import {first, map, switchMap} from 'rxjs/operators';
import {tokenStorageKey, TokenWrapper} from '../../models/user';
import {APIResponse, responseAdapter} from '../../models/api-response';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-handle-successful-auth',
  templateUrl: './handle-successful-auth.component.html',
  styleUrls: ['./handle-successful-auth.component.scss']
})
export class HandleSuccessfulAuthComponent implements OnInit {
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private auth: AuthService) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      const authToken = params.token;
      localStorage.setItem(tokenStorageKey, authToken);
      this.auth.getUserByToken().pipe(first()).subscribe();

      const path = localStorage.getItem('preLoginPath');
      localStorage.removeItem('preLoginPath');
      this.router.navigateByUrl(path);
    });
  }

}
