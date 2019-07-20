import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { PromotionService } from 'src/app/services/promotion.service';
import { Observable } from 'rxjs';
import { User, Role } from 'src/app/models/user';
import { debounceTime } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-role-edit',
  templateUrl: './role-edit.component.html',
  styleUrls: ['./role-edit.component.scss']
})
export class RoleEditComponent implements OnInit {
  
  private allUsers: User[];
  public  filteredUsers: User[];
  private promoter: PromotionService;
  public auth: AuthService;
  
  public form = new FormGroup({
    query: new FormControl(''),
  });
  
  constructor(
    promoter: PromotionService,
    auth: AuthService  
  ) {
    this.auth = auth;
    this.promoter = promoter;
    promoter.getAll().subscribe(val => {
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
    const filter = this.form.controls.query.value;
    const filtered = users.filter( user => user.email.includes(filter) || user.name.includes(filter));
    return filtered.sort( (a,b) => a.email.localeCompare(b.email) );
  }

  public setRole(user: User, role: Role) {
    this.promoter.setRole(user, role);
  }
}
