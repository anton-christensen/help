import {Component, OnInit} from '@angular/core';
import {FormGroup, FormControl, Validators} from '@angular/forms';
import {UserService} from 'src/app/services/user.service';
import {User, Role} from 'src/app/models/user';
import {AuthService} from 'src/app/services/auth.service';
import {BehaviorSubject, combineLatest, merge, Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, first, map, shareReplay, switchMap, tap} from 'rxjs/operators';

@Component({
  selector: 'app-role-edit',
  templateUrl: './role-edit.component.html',
  styleUrls: ['./role-edit.component.scss']
})
export class RoleEditComponent implements OnInit {
  public foundUsers$: Observable<User[]>;
  public pageSize = 5;
  public currentPage = 0;
  public numPages = 0;
  private pageSubject = new BehaviorSubject<number>(this.currentPage);
  private newUserSubject = new Subject<User[]>();

  public form = new FormGroup({
    query: new FormControl('', [Validators.email, Validators.pattern(/[.@]aau.dk$/)])
  });

  constructor(private userService: UserService,
              private auth: AuthService) {}

  ngOnInit() {
    this.foundUsers$ = merge(
      combineLatest([
        this.form.controls.query.valueChanges.pipe(
          debounceTime(300),
          distinctUntilChanged(),
          tap(() => this.currentPage = 0)),
        this.pageSubject]).pipe(
          switchMap((values) => this.userService.searchByNameOrEmail(values[0].trim(), this.pageSize, this.currentPage)),
          tap((paginatedResult) => this.numPages = paginatedResult.numPages),
          map((paginatedResult) => paginatedResult.data),
          shareReplay(1),
      ),
      this.newUserSubject);
  }

  public setRole(user: User, role: Role) {
    this.userService.setRole(user, role).pipe(first()).subscribe();
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.userService.createUserWithEmail(this.form.controls.query.value.trim()).pipe(first())
      .subscribe((user) => {
        this.form.controls.query.setValue(user.email);
        this.newUserSubject.next([user]);
      });
  }

  nextPage() {
    this.currentPage++;
    this.pageSubject.next(this.currentPage)
  }

  prevPage() {
    this.currentPage--;
    this.pageSubject.next(this.currentPage);
  }
}
