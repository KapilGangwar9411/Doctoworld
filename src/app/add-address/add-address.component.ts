import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-address',
  templateUrl: './add-address.component.html',
  styleUrls: ['./add-address.component.scss']
})
export class AddAddressComponent {
  constructor(private modalService: NgbModal, private activeModal: NgbActiveModal) { }
  dismiss() {
    this.activeModal.close();
  }

}
