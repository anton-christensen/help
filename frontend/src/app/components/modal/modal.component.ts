import {Component} from '@angular/core';
import {ModalService} from 'src/app/services/modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  constructor(public modalService: ModalService) { }

  public clicked(event: MouseEvent) {
    if ((event.target as Element).className === 'modal-wrapper') {
      this.modalService.reject();
    }
  }
}
