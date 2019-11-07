import { Injectable } from '@angular/core';
import {Title} from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  public currentLocation: 'departmentList' | 'courseList' | 'course' | 'admin';
  private t: string;

  constructor(private title: Title) { }

  public setTitle(title: string) {
    if (title) {
      this.t = `${title} – Help`;
    } else {
      this.t = 'Help';
    }
    this.title.setTitle(this.t);
  }

  public setTitlePre(str: string) {
    this.title.setTitle(`${str} ${this.t}`);
  }
}
