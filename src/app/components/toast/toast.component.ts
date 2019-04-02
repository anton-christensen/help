import { Component, OnInit } from '@angular/core';
import { ToastService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styles: []
})
export class ToastComponent implements OnInit {

  constructor(public toastService: ToastService) { }

  ngOnInit() {
  }

}
