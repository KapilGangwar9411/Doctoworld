import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as firebase from 'firebase';
import { MyAddress } from 'src/models/address.models';
import { Helper } from 'src/models/helper.models';
import { OrderDeliveryProfile } from 'src/models/order.models';
import { User } from 'src/models/user.models';
import { UiElementsService } from '../services/common/ui-elements.service';
import { GoogleMapsService } from '../services/network/google-maps.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Chat } from 'src/models/chat.models';
import { Constants } from 'src/models/constants.models';
import { ChatComponent } from '../chat/chat.component';



@Component({
  selector: 'app-order-tracking',
  templateUrl: './order-tracking.component.html',
  styleUrls: ['./order-tracking.component.scss']
})
export class OrderTrackingComponent {

  @ViewChild("pleaseConnect", { static: true }) pleaseConnect?: ElementRef;
  @ViewChild("map", { static: true }) mapElement?: ElementRef;
  delivery!: OrderDeliveryProfile;
  private address!: MyAddress;
  private userMe!: User;
  private vendor!: { name: string; image: string; location: { latitude: string; longitude: string } };
  private initialized = false;
  private markerDeliveryGuy?: any;
  private posDeliveryGuy?: any;

  private numDeltas = 100;
  private delay = 10; //milliseconds
  private i = 0;
  private deltaLat!: any;
  private deltaLng!: any;
  private lastToPos = [0, 0];
  @Input() public order: any;

  constructor(private activeModal: NgbActiveModal, private maps: GoogleMapsService, private translate: TranslateService, private uiElementService: UiElementsService,
    private modalService: NgbModal) { }

  ngOnInit() {
    this.userMe = Helper.getLoggedInUser();
    this.delivery = this.order.delivery;
    this.address = this.order.address;
    this.vendor = this.order.vendor;
    if (!this.initialized) {
      let mapLoaded = this.maps.init(this.mapElement?.nativeElement, this.pleaseConnect?.nativeElement, this.address).then(() => {
        this.initialized = true;
        this.plotMarkers();
        this.registerUpdates();
      }).catch(err => { console.log("maps.init", err); this.close() });
      mapLoaded.catch(err => { console.log("mapLoaded", err); this.close() });
    }
  }

  private plotMarkers() {
    let posMe = new google.maps.LatLng(Number(this.address.latitude), Number(this.address.longitude));
    let markerMe = new google.maps.Marker({
      position: posMe, map: this.maps.map
      //, icon: 'assets/images/marker_map_me.png'
    });
    markerMe.addListener('click', (event) => this.uiElementService.showSuccessToastr(MyAddress.getAddressToShow(this.address)));

    let posVendor = new google.maps.LatLng(Number(this.vendor.location.latitude), Number(this.vendor.location.longitude));
    const image = {
      url: this.vendor.image,
      scaledSize: new google.maps.Size(40, 40),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(0, 32),
    };
    let markerVendor = new google.maps.Marker({
      position: posVendor, map: this.maps.map,
      icon: image
    });
    markerVendor.addListener('click', (event: any) => this.uiElementService.showSuccessToastr(this.vendor.name));

    let directionsService = new google.maps.DirectionsService();
    let directionsDisplay = new google.maps.DirectionsRenderer({
      map: this.maps.map,
      polylineOptions: {
        strokeColor: '#279411',
        strokeOpacity: 1.0,
        strokeWeight: 5
      },
      markerOptions: {
        opacity: 0,
        clickable: false,
        position: posVendor
      }
    });
    let dirReq: any = {
      origin: posVendor,
      destination: posMe,
      travelMode: google.maps.TravelMode.DRIVING
    };
    directionsService.route(dirReq, function (result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(result);
      }
    });

    if (this.delivery.delivery.latitude && this.delivery.delivery.longitude) {
      this.posDeliveryGuy = new google.maps.LatLng(Number(this.delivery.delivery.latitude), Number(this.delivery.delivery.longitude));
      const image = {
        url: this.delivery.delivery.user.image_url,
        scaledSize: new google.maps.Size(40, 40),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(0, 32),
      };
      this.markerDeliveryGuy = new google.maps.Marker({
        position: this.posDeliveryGuy, map: this.maps.map,
        icon: image
      });
      this.markerDeliveryGuy.addListener('click', (event: any) => this.uiElementService.showSuccessToastr(this.delivery.delivery.user.name));
    }
  }

  private onNewLocation(newPos: google.maps.LatLng) {
    if (!this.posDeliveryGuy || !newPos.equals(this.posDeliveryGuy)) {

      if (this.posDeliveryGuy != null) {
        this.i = 0;
        this.lastToPos[0] = this.posDeliveryGuy.lat();
        this.lastToPos[1] = this.posDeliveryGuy.lng();
        this.deltaLat = (newPos.lat() - this.lastToPos[0]) / this.numDeltas;
        this.deltaLng = (newPos.lng() - this.lastToPos[1]) / this.numDeltas;
      }

      if (this.markerDeliveryGuy == null) {
        const image = {
          url: this.delivery.delivery.user.image_url,
          scaledSize: new google.maps.Size(40, 40),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(0, 32),
        };
        this.markerDeliveryGuy = new google.maps.Marker({
          position: this.posDeliveryGuy, map: this.maps.map,
          icon: image
        });
      } else {
        //this.markerDeliveryGuy.setPosition(this.posDeliveryGuy);
        this.moveMarker();
      }
      this.maps.map.panTo(this.posDeliveryGuy);

    }
  }

  private moveMarker() {
    this.lastToPos[0] = this.lastToPos[0] + this.deltaLat;
    this.lastToPos[1] = this.lastToPos[1] + this.deltaLng;
    let newToPos = new google.maps.LatLng(Number(this.lastToPos[0]), Number(this.lastToPos[1]));
    this.markerDeliveryGuy.setPosition(newToPos);
    this.posDeliveryGuy = newToPos;
    if (this.i != this.numDeltas) {
      this.i++;
      setTimeout(() => {
        this.moveMarker();
      }, this.delay);
    }
    //  else {
    //   this.requestDirection(this.lastTo);
    // }
  }

  private registerUpdates() {
    const component = this;
    firebase.database().ref("deliveries").child(String(this.delivery.delivery.id)).child("location").on('child_changed', function (data) {
      var fireLocation = data.val() as { latitude: string, longitude: string };
      console.log(fireLocation);
      if (fireLocation.latitude != null && fireLocation.longitude != null) component.onNewLocation(new google.maps.LatLng(Number(fireLocation.latitude), Number(fireLocation.longitude)));
    });
  }

  public close() {
    this.activeModal.close();
  }

  navChat() {
    let chat = new Chat();
    chat.chatId = this.delivery.delivery.user.id + Constants.ROLE_DELIVERY;
    chat.chatImage = this.delivery.delivery.user.image_url;
    chat.chatName = this.delivery.delivery.user.name;
    chat.chatStatus = this.translate.instant("delivery_partner");
    chat.myId = this.userMe.id + Constants.ROLE_USER;
    // let navigationExtras: NavigationExtras = { state: { chat: chat, delivery_user: this.delivery.delivery.user } };
    // this.navCtrl.navigateForward(['./chat'], navigationExtras);
    const modalRef = this.modalService.open(ChatComponent, { windowClass: 'fullWidth' });
    modalRef.componentInstance.chatDetails = { chat: chat, delivery_user: this.delivery.delivery.user };
  }

}

