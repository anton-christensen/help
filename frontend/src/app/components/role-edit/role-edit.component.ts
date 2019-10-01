import {Component, OnInit} from '@angular/core';
import {FormGroup, FormControl, Validators} from '@angular/forms';
import {UserService} from 'src/app/services/user.service';
import {User, Role} from 'src/app/models/user';
import {AuthService} from 'src/app/services/auth.service';
import {BehaviorSubject, combineLatest, Observable, Subject} from 'rxjs';
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
  public morePages = false;

  private pageSubject = new BehaviorSubject<number>(0);

  public form = new FormGroup({
    query: new FormControl('', [Validators.email, Validators.pattern(/[.@]aau.dk$/)])
  });

  constructor(private userService: UserService,
              private auth: AuthService) {}

  ngOnInit() {
    this.foundUsers$ = combineLatest([
      this.form.controls.query.valueChanges.pipe(debounceTime(300),distinctUntilChanged()),
      this.pageSubject]).pipe(
        tap((values) => this.currentPage = values[1] === this.currentPage ? 0 : values[1]),
        switchMap((values) => this.userService.searchByNameOrEmail(values[0].trim(), this.pageSize, this.currentPage)),
        tap((results) => this.morePages = results.length === this.pageSize),
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

  nextPage() {
    this.pageSubject.next(this.currentPage + 1)
  }
}
