import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { User, Role } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-role-edit',
  templateUrl: './role-edit.component.html',
  styleUrls: ['./role-edit.component.scss']
})
export class RoleEditComponent implements OnInit {

  private allUsers: User[];
  public  filteredUsers: User[];

  public form = new FormGroup({
    query: new FormControl(''),
  });

  constructor(
    private userService: UserService,
    public  auth: AuthService,
    private modalService: ModalService
  ) {
    userService.getAll().subscribe(val => {
      this.allUsers = val;
      this.filteredUsers = this.applyFilter(val);
    });
  }

  ngOnInit() {
    this.form.controls.query.valueChanges.subscribe((val : string) => {
      this.filteredUsers = this.applyFilter(this.allUsers);
      val = val.toLowerCase();
      // if no users match the query, the query is a valid email, its an email from the university
      var isEmailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
      if(this.filteredUsers.length == 0 && isEmailRegex.test(val) && /[.@]aau.dk$/.test(val)) {
        this.modalService.add(`The email ${val} does not exsist on help.aau.dk yet, would you like to add it?`).then(
          () => {
            // yes please
            this.auth.createOrUpdateUser(val);
          },
          () => {
            // no thanks
          }
        )
      }
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
