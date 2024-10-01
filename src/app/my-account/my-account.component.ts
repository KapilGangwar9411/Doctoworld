import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SelectLocationComponent } from '../select-location/select-location.component';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/network/api.service';
import { UiElementsService } from '../services/common/ui-elements.service';
import { TranslateService } from '@ngx-translate/core';
import { FirebaseUploaderService } from '../services/network/firebase-uploader.service';
import { MyEventsService } from '../services/events/my-events.service';
import { MyAddress } from 'src/models/address.models';
import { Helper } from 'src/models/helper.models';

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.scss']
})
export class MyAccountComponent implements OnInit, OnDestroy {
  currSec = "profile"; //"profile" or "address"
  addressPick: boolean = false;
  private subscriptions = new Array<Subscription>();
  isLoading = true;
  addresses = new Array<MyAddress>();

  constructor(public apiService: ApiService, private uiElementService: UiElementsService, private modalService: NgbModal, private _location: Location,
    private translate: TranslateService, private fireUpService: FirebaseUploaderService, private myEventsService: MyEventsService, private router: Router) {
    if (this.router.getCurrentNavigation() && this.router.getCurrentNavigation()!.extras.state) {
      this.addressPick = this.router.getCurrentNavigation()!.extras.state!['address_pick'];
      if (this.addressPick) {
        this.currSec = "address";
      }
    }
  }

  ngOnInit() {
    this.fetchAddresses();
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
  }

  onImageChange(e: any) {
    if (e.target.files && e.target.files.length && e.target.accept == "image/*") {
      const [file] = e.target.files;
      this.uploadImage(file);
    }
  }

  onSaveClick(updateRequestIn?: any) {
    let uur = updateRequestIn != null ? updateRequestIn : { name: this.apiService.getUserMe()?.name };
    this.translate.get(["saving", "saved"]).subscribe((values: any) => {
      this.uiElementService.presentLoading(values["saving"]);
      this.subscriptions.push(this.apiService.updateUser(uur).subscribe({
        next: (res) => {
          this.uiElementService.dismissLoading();
          Helper.setLoggedInUser(res);
          this.myEventsService.setUserMeData(res);
        }, error: (err) => {
          console.log("updateUser", err);
          this.uiElementService.dismissLoading();
        }
      }));
    });
  }

  private uploadImage(file: any) {
    this.translate.get(["uploading", "uploading_fail"]).subscribe((values: any) => {
      this.uiElementService.presentLoading(values["uploading"]);
      this.fireUpService.uploadFile(file).then(res => {
        this.uiElementService.dismissLoading();
        this.onSaveClick({ image_url: String(res) });
      }, err => {
        console.log("resolveUriAndUpload", err);
        this.uiElementService.dismissLoading();
        this.uiElementService.showErrorToastr(values["uploading_fail"]);
      });
    });
  }

  private fetchAddresses() {
    this.subscriptions.push(this.apiService.getAddresses().subscribe({
      next: (res) => {
        this.addresses = res;
        this.isLoading = false;
      }, error: (err) => {
        console.log("getAddresses", err);
        this.isLoading = false;
      }
    }));
  }

  onAddressEdit(address?: MyAddress | null | undefined) {
    const modalRef: NgbModalRef = this.modalService.open(SelectLocationComponent, { size: 'xl', });
    modalRef.componentInstance.address = address;
    modalRef.result.then((result) => {
      if (result) {
        this.translate.get(["saving", "something_wrong"]).subscribe(values => {
          this.uiElementService.presentLoading(values["saving"]);
          this.subscriptions.push(result.id ? this.apiService.addressUpdate(result).subscribe({
            next: (res) => {
              this.uiElementService.dismissLoading();
              this.onAddressSaved(res);
            }, error: (err) => {
              this.uiElementService.dismissLoading();
              console.log("addressUpdate", err);
              this.uiElementService.showErrorToastr(values["something_wrong"]);
            }
          }) : this.apiService.addressAdd(result).subscribe({
            next: (res) => {
              this.uiElementService.dismissLoading();
              this.onAddressSaved(res);
            }, error: (err) => {
              this.uiElementService.dismissLoading();
              console.log("addressAdd", err);
              this.uiElementService.showErrorToastr(values["something_wrong"]);
            }
          }));
        });
      }
    });
  }

  private onAddressSaved(address: MyAddress) {
    this.translate.get("saved").subscribe(value => this.uiElementService.showSuccessToastr(value));
    let eIndex = -1;
    for (let i = 0; i < this.addresses.length; i++) {
      if (this.addresses[i].id == address.id) {
        eIndex = i;
        break;
      }
    }
    if (eIndex != -1) {
      this.addresses.splice(eIndex, 1);
    }
    this.addresses.unshift(address);
  }

  onAddressClick(address: MyAddress) {
    if (this.addressPick) {
      this.myEventsService.setAddressData(address);
      Helper.setAddressSelected(address);
      this._location.back();
    }
  }

}
