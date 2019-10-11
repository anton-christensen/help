import {Component, forwardRef, OnInit} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {User} from '../../models/user';
import {ToastService} from '../../services/toasts.service';

@Component({
  selector: 'app-associated-users-control',
  templateUrl: './associated-users-control.component.html',
  styleUrls: ['./associated-users-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AssociatedUsersControlComponent),
      multi: true
    }
  ]
})
export class AssociatedUsersControlComponent implements OnInit, ControlValueAccessor {
  public users: User[];

  private propagateChange = (val: any) => {};

  constructor(private toastService: ToastService) { }

  ngOnInit() {
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
  }

  writeValue(value: User[]): void {
    this.users = value;
  }

  removeUser(user: User) {
    const newUsers = this.users.filter((u) => u.id !== user.id);

    // Check if this removal means there are no admins og lecturers left
    if (!newUsers.find((u) => u.role === 'admin' || u.role === 'lecturer')) {
      this.toastService.add('There must be at least one admin or lecturer associated with every course');
    } else {
      this.users = newUsers;
      this.propagateChange(this.users);
    }
  }
}
