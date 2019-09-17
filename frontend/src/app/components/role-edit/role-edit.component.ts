import {Component, OnInit} from '@angular/core';
import {FormGroup, FormControl, Validators} from '@angular/forms';
import {UserService} from 'src/app/services/user.service';
import {User, Role} from 'src/app/models/user';
import {AuthService} from 'src/app/services/auth.service';
import {Observable, Subject} from 'rxjs';
import {switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-role-edit',
  templateUrl: './role-edit.component.html',
  styleUrls: ['./role-edit.component.scss']
})
export class RoleEditComponent implements OnInit {
  private email$ = new Subject<string>();
  public user$: Observable<User>;
  private user: User;
  public gettingUser = false;

  public form = new FormGroup({
    email: new FormControl('', [Validators.email, Validators.pattern(/[.@]aau.dk$/)])
  });

  constructor(private userService: UserService,
              private auth: AuthService) {}

  ngOnInit() {
    this.user$ = this.email$.pipe(
      switchMap((email: string) => {
        this.gettingUser = true;
        return this.userService.getByEmail(email);
      })
    );

    this.user$
      .subscribe((user) => {
        this.gettingUser = false;
        this.user = user;
      });

    this.form.controls.email.valueChanges
      .subscribe((email) => {
        this.findUser(email.trim());
    });
  }

  public setRole(user: User, role: Role) {
    this.userService.setRole(user, role);
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.userService.createUserWithEmail(this.form.controls.email.value)
      .then(() => {
        this.findUser(this.form.controls.email.value);
      });
  }

  private findUser(email: string) {
    if (this.user || /[.@]aau.dk$/.test(email.toLowerCase())) {
      this.email$.next(email);
    }
  }
}
