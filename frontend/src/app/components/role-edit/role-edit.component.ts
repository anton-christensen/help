import {Component, OnInit} from '@angular/core';
import {FormGroup, FormControl, Validators} from '@angular/forms';
import {UserService} from 'src/app/services/user.service';
import {User, Role} from 'src/app/models/user';
import {AuthService} from 'src/app/services/auth.service';
import {Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, first, shareReplay, switchMap, tap} from 'rxjs/operators';

@Component({
  selector: 'app-role-edit',
  templateUrl: './role-edit.component.html',
  styleUrls: ['./role-edit.component.scss']
})
export class RoleEditComponent implements OnInit {
  public foundUsers$: Observable<User[]>;
  public pageSize = 5;
  public currentPage = 0;

  public form = new FormGroup({
    query: new FormControl('', [Validators.email, Validators.pattern(/[.@]aau.dk$/)])
  });

  constructor(private userService: UserService,
              private auth: AuthService) {}

  ngOnInit() {
    this.foundUsers$ = this.form.controls.query.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((val) => this.userService.searchByNameOrEmail(val.trim(), this.pageSize, this.currentPage)),
      tap(() => this.currentPage = 0),
      shareReplay(1)
    );
  }

  public setRole(user: User, role: Role) {
    this.userService.setRole(user, role).pipe(first()).subscribe();
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.userService.createUserWithEmail(this.form.controls.query.value).pipe(first())
      .subscribe((user) => {
        this.form.controls.query.setValue(user.email);
      });
  }
}
