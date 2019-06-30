import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { PromotionService } from 'src/app/services/promotion.service';
import { Observable } from 'rxjs';
import { User } from 'src/app/models/user';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-lecturers-manager',
  templateUrl: './lecturers-manager.component.html',
  styleUrls: ['./lecturers-manager.component.scss']
})
export class LecturersManagerComponent implements OnInit {
  
  private allLecturers: User[];
  private allNonAdminAndLecturers: User[];
  public  filteredLecturers: User[];
  public  filteredNonAdminAndLecturers: User[];
  private promoter: PromotionService;
  
  
  public form = new FormGroup({
    query: new FormControl(''),
  });
  
  constructor(promoter: PromotionService) {
    this.promoter = promoter;
    promoter.getByRole("lecturer").subscribe(val => { 
      console.log("Lecturers", val);
      this.allLecturers = val; 
      this.filteredLecturers = this.applyFilter(val);
    });
    promoter.getWherRoleIn(["assistant", "student"]).subscribe(val => { 
      console.log("Scrubs", val);
      this.allNonAdminAndLecturers = val; 
      this.filteredNonAdminAndLecturers = this.applyFilter(val);
    });
  }

  ngOnInit() {
    this.form.controls.query.valueChanges.subscribe((val) => {
      this.filteredLecturers = this.applyFilter(this.allLecturers);
      this.filteredNonAdminAndLecturers = this.applyFilter(this.allNonAdminAndLecturers);
        // this.form.controls.courseSlug.updateValueAndValidity();
    });
  }

  public applyFilter(users: User[]): User[] {
    const filter = this.form.controls.query.value;
    const filtered = users.filter( user => user.email.includes(filter) || user.name.includes(filter));
    console.log("Filtering: ", users, filter, filtered);
    return filtered;
  }

  public promote(user: User) {
    this.promoter.setRole(user, 'lecturer');
  }
  public demote(user: User) {
    this.promoter.setRole(user, 'assistant');
  }

}
