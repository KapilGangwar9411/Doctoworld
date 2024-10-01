import { Component, ElementRef, Inject, NgZone, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig, APP_CONFIG } from '../app.config';
import { UiElementsService } from '../services/common/ui-elements.service';
import { MyEventsService } from '../services/events/my-events.service';
import { GoogleMapsService } from '../services/network/google-maps.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MyAddress } from 'src/models/address.models';
import { Helper } from 'src/models/helper.models';

@Component({
  selector: 'app-select-location',
  templateUrl: './select-location.component.html',
  styleUrls: ['./select-location.component.scss']
})
export class SelectLocationComponent implements OnInit {
  @ViewChild("pleaseConnect", { static: true }) pleaseConnect?: ElementRef;
  @ViewChild("map", { static: true }) mapElement?: ElementRef;
  private initialized = false;
  private autocompleteService: any;
  private placesService: any;
  private marker?: google.maps.Marker;
  query = "";
  places = new Array<any>;
  address = new MyAddress();
  pick: boolean = false;

  constructor(private translate: TranslateService, private router: Router, private myEventsService: MyEventsService,
    private uiElementService: UiElementsService, private activeModal: NgbActiveModal,
    @Inject(APP_CONFIG) public config: AppConfig, private ngZone: NgZone, private maps: GoogleMapsService) { }

  ngOnInit() {
    if (!this.address) {
      this.address = Helper.getAddressSelected() ?? new MyAddress();
    }
    this.loadGoogleMap();
  }

  loadGoogleMap() {
    if (!this.initialized) {
      let mapLoaded = this.maps.init(this.mapElement?.nativeElement, this.pleaseConnect?.nativeElement, this.address).then(() => {
        this.autocompleteService = new google.maps.places.AutocompleteService();
        this.placesService = new google.maps.places.PlacesService(this.maps.map);
        this.maps.map.addListener('click', (event: any) => {
          if (event && event.latLng) {
            let pos = new google.maps.LatLng(event.latLng.lat(), event.latLng.lng());
            this.geocode(pos);
          }
        });
        this.initialized = true;
        if (this.address && this.address.latitude && this.address.longitude) {
          let pos = new google.maps.LatLng(Number(this.address.latitude), Number(this.address.longitude));
          this.plotMarker(pos);
        } else {
          this.detect();
        }
      }).catch(err => this.close());
      mapLoaded.catch(err => this.close());
    }
  }

  searchPlace() {
    if (this.autocompleteService && this.query.length > 0) {
      let config = { input: this.query }
      this.autocompleteService.getPlacePredictions(config, (predictions: any, status: any) => {
        if (status == google.maps.places.PlacesServiceStatus.OK && predictions) {
          this.places = [];
          predictions.forEach((prediction: any) => this.places.push(prediction));
        }
      });
    } else {
      this.places = [];
    }
  }

  selectPlace(place: any) {
    this.query = place.description;
    this.places = [];
    // if (this.location) {
    //   myLocation.id = this.location.id;
    //   myLocation.title = this.location.title;
    // }
    this.address!.title = "";
    this.address!.formatted_address = place.name;
    this.placesService.getDetails({ placeId: place.place_id }, (details: any) => {
      this.ngZone.run(() => {
        let form_address = '';
        details.address_components.map((element: any) => {
          if (element.types[0] != "administrative_area_level_2" && element.types[0] != "country" && element.types[0] != "postal_code" && element.types[0] != "administrative_area_level_1") {
            form_address = form_address ? form_address + ", " + element.long_name : element.long_name
          }
        })
        this.address!.formatted_address = form_address && form_address.length ? form_address : this.query;
        // myLocation.formatted_address = (details.formatted_address && details.formatted_address.length) ? details.formatted_address : details.name;
        this.address!.latitude = String(details.geometry.location.lat());
        this.address!.longitude = String(details.geometry.location.lng());
        let lc = { lat: details.geometry.location.lat(), lng: details.geometry.location.lng() };
        this.maps.map.setCenter(lc);
        //this.location = myLocation;
        let pos = new google.maps.LatLng(Number(lc.lat), Number(lc.lng));
        this.plotMarker(pos);
        // if (!this.apiService.getUserMe()) {
        //   Helper.setAddressSelected(this.address!);
        //   this.myEventsService.setLocationData(this.address!);
        // }
      });
    });
  }

  close() {
    // let newLocation: MyAddress = Helper.getLocationDefault();
    // if (newLocation) {
    //   this.profile.address = newLocation.formatted_address;
    //   this.profile.latitude = newLocation.latitude;
    //   this.profile.longitude = newLocation.longitude;
    // }
    // Helper.setLocationDefault(null);
  }

  selectAddress(address: MyAddress) {
    Helper.setAddressSelected(address);
    this.close();
  }

  detect() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        let pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        this.geocode(pos);
      });
    }
  }

  geocode(pos: google.maps.LatLng) {
    let geocoder = new google.maps.Geocoder();
    let request = { location: pos };
    geocoder.geocode(request, (results, status) => {
      if (status == google.maps.GeocoderStatus.OK && results.length > 0) {
        // if (this.location) {
        //   myLocation.id = this.location.id;
        //   myLocation.title = this.location.title;
        // }
        let form_address = '';
        results[0].address_components.map(element => {
          if (element.types[0] != "administrative_area_level_2" && element.types[0] != "country" && element.types[0] != "postal_code" && element.types[0] != "administrative_area_level_1") {
            form_address = form_address ? form_address + ", " + element.long_name : element.long_name;
          }
        });
        this.address!.title = "";
        this.address!.formatted_address = form_address;
        // myLocation.formatted_address = results[0].formatted_address;
        this.address!.latitude = String(pos.lat());
        this.address!.longitude = String(pos.lng());
        //this.location = myLocation;

        this.plotMarker(pos);
        this.uiElementService.showSuccessToastr(this.address!.formatted_address);
        // if (!this.apiService.getUserMe()) {
        //   Helper.setAddressSelected(this.address!);
        //   this.myEventsService.setLocationData(this.address!);
        // }
      }
    });
  }

  plotMarker(pos: google.maps.LatLng) {
    if (!this.marker) {
      this.marker = new google.maps.Marker({
        position: pos, map: this.maps.map
        //, icon: 'assets/images/marker_map_me.png'
      });
      this.marker.setClickable(true);
      this.marker.addListener('click', (event) => this.uiElementService.showSuccessToastr(this.address?.formatted_address ?? ""));
    }
    else {
      this.marker.setPosition(pos);
    }
    this.maps.map.panTo(pos);
  }

  onSave() {
    if (this.pick) {
      Helper.setAddressSelected(this.address!);
      this.myEventsService.setAddressData(this.address!);
    } else {
      if (!this.address?.latitude || !this.address.longitude) {
        this.translate.get("select_location_on_map").subscribe(value => this.uiElementService.showErrorToastr(value));
      } else if (!this.address?.title || !this.address.title.length) {
        this.translate.get("err_field_address_title").subscribe(value => this.uiElementService.showErrorToastr(value));
      } else if (!this.address.formatted_address || !this.address.formatted_address.length) {
        this.translate.get("err_field_address").subscribe(value => this.uiElementService.showErrorToastr(value));
      } else {
        this.activeModal.close(this.address);
      }
    }
  }

}
