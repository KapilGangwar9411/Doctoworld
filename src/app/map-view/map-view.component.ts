import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Constants } from 'src/models/constants.models';
import { Doctor } from 'src/models/doctor.models';
import { Helper } from 'src/models/helper.models';
import { Hospital } from 'src/models/hospital.models';
import { GoogleMapsService } from '../services/network/google-maps.service';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.scss']
})
export class MapViewComponent {
  @ViewChild("pleaseConnect", { static: true }) pleaseConnect?: ElementRef;
  @ViewChild("map", { static: true }) mapElement?: ElementRef;
  // currency_icon!: string;
  private initialized = false;


  @Input() doctors = new Array<Doctor>();
  @Input() hospitals = new Array<Hospital>();

  constructor(private router: Router, private maps: GoogleMapsService) {

  }

  ngOnInit() {
    // this.currency_icon = Helper.getSetting("currency_icon");
    if (!this.initialized) {
      let mapLoaded = this.maps.init(this.mapElement?.nativeElement, this.pleaseConnect?.nativeElement, null).then(() => {
        this.initialized = true;
        this.plotMarkers();
      }).catch(err => { console.log("maps.init", err); this.close() });
      mapLoaded.catch(err => { console.log("mapLoaded", err); this.close() });
    }

    console.log("hospitals", this.hospitals);
  }

  private close() {
    // this.navCtrl.pop();
  }

  private plotMarkers() {
    let posBonds = new google.maps.LatLngBounds();
    this.doctors.forEach((doc, index) => {
      // console.log("index", index)
      let posDoc = new google.maps.LatLng(Number(doc.hospitalClosest.latitude), Number(doc.hospitalClosest.longitude));
      const image = {
        url: doc.user.image_url,
        scaledSize: new google.maps.Size(40, 40),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(0, 32),
      };
      let markerDoc = new google.maps.Marker({
        position: posDoc, map: this.maps.map,
        icon: image
      });
      posBonds.extend(posDoc);
      google.maps.event.addListener(markerDoc, 'click', () => {
        // this.slider.slideTo(index, 200);
        this.navDocProfile(doc);
      });
    });
    this.hospitals.forEach((hos, index) => {
      // console.log("index", index)
      let posDoc = new google.maps.LatLng(Number(hos.latitude), Number(hos.longitude));
      // let markerDoc = createHTMLMapMarker({
      //   latlng: posDoc,
      //   map: this.maps.map,
      //   html: '<div id="doctor_map"><img src="' + hos.image + '"></div>'
      // });
      const image = {
        url: hos.image,
        scaledSize: new google.maps.Size(40, 40),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(0, 32),
      };
      let markerDoc = new google.maps.Marker({
        position: posDoc, map: this.maps.map,
        icon: image
      });
      posBonds.extend(posDoc);
      google.maps.event.addListener((markerDoc), 'click', () => {
        // this.slider.slideTo(index,200);
        this.navHospitalInfo(hos);
      });
    });
    setTimeout(() => this.maps.map.fitBounds(posBonds), 1000);
  }

  navDocProfile(doc: Doctor) {
    window.localStorage.setItem(Constants.TEMP_DOCTOR, JSON.stringify(doc));
    this.router.navigateByUrl('doctor-info');
  }

  navHospitalInfo(hos: any) {
    window.localStorage.setItem(Constants.TEMP_HOSPITAL, JSON.stringify(hos));
    this.router.navigate(['./hospital-info']);
  }
}
