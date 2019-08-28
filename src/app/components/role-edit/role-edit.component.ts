import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { User, Role } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-role-edit',
  templateUrl: './role-edit.component.html',
  styleUrls: ['./role-edit.component.scss']
})
export class RoleEditComponent implements OnInit {

  private allUsers: User[];
  public  filteredUsers: User[];
  private userService: UserService;
  public auth: AuthService;

  public form = new FormGroup({
    query: new FormControl(''),
  });

  constructor(
    userService: UserService,
    auth: AuthService
  ) {
    this.auth = auth;
    this.userService = userService;
    userService.getAll().subscribe(val => {
      this.allUsers = val;
      this.filteredUsers = this.applyFilter(val);
    });
  }

  ngOnInit() {
    this.form.controls.query.valueChanges.subscribe((val) => {
      this.filteredUsers = this.applyFilter(this.allUsers);
    });
  }

  public applyFilter(users: User[]): User[] {
    const filter = this.form.controls.query.value.toLocaleLowerCase();
    return users.filter((user) => {
      return user.email.toLocaleLowerCase().includes(filter) || user.name.toLocaleLowerCase().includes(filter);
    }).slice(0, 10);
  }

  public setRole(user: User, role: Role) {
    this.userService.setRole(user, role);
  }
}
