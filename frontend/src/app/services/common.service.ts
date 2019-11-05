import { Injectable } from '@angular/core';
import {Title} from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  public currentLocation: 'departmentList' | 'courseList' | 'course' | 'admin';
  constructor(private title: Title) { }

  public setTitle(title: string) {
    if (title) {
      this.title.setTitle(`${title} – Help`);
    } else {
      this.title.setTitle('Help');
    }
  }
}
