import { Component } from '@angular/core';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-send-to-bank',
  templateUrl: './send-to-bank.component.html',
  styleUrls: ['./send-to-bank.component.scss']
})
export class SendToBankComponent {
  constructor(private modalService: NgbModal, private activeModal: NgbActiveModal) { }
  close() {
    this.activeModal.close();
  }
}
