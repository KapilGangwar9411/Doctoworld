/// <reference types="@types/googlemaps" />
import { Injectable, Inject } from '@angular/core';
import { APP_CONFIG, AppConfig } from 'src/app/app.config';
import { MyAddress } from 'src/models/address.models';
import { ScriptLoaderService, ScriptStore } from '../script-loader.service';

@Injectable({
  providedIn: null
})
export class GoogleMapsService {
  private mapElement: any;
  private pleaseConnect: any;
  map: any;
  private mapInitialised: boolean = false;
  private mapLoaded: any;
  private mapLoadedObserver: any;
  private currentMarker: any;
  private myCenter?: MyAddress | null | undefined;

  constructor(@Inject(APP_CONFIG) private config: AppConfig, private scriptLoader: ScriptLoaderService) { }

  init(mapElement: any, pleaseConnect: any, myCenter: MyAddress | null | undefined): Promise<any> {
    this.mapElement = mapElement;
    this.pleaseConnect = pleaseConnect;
    this.myCenter = myCenter;
    return this.loadGoogleMaps();
  }

  loadGoogleMaps(): Promise<any> {
    return new Promise((resolve) => {
      // this.initMap().then(res => {
      //   this.enableMap();
      //   resolve(true);
      // }, err => console.log("loadGoogleMaps: ", err));
      this.scriptLoader.load(new ScriptStore("googlemaps", '//maps.googleapis.com/maps/api/js?key=' + this.config.googleApiKey + '&callback=mapInit&libraries=places')).then(res => {
        console.log("scriptLoader Loaded");
        this.enableMap();
        this.initMap().then(() => resolve(true));
      });

      // if (typeof google == "undefined" || typeof google.maps == "undefined") {
      //   // console.log("Google maps JavaScript needs to be loaded.");
      //   this.disableMap();
      //   // if (this.connectivityService.isOnline()) {
      //   window['mapInit'] = () => {
      //     this.initMap().then(() => {
      //       resolve(true);
      //     });
      //     this.enableMap();
      //   }
      //   let script = document.createElement("script");
      //   script.id = "googleMaps";
      //   if (this.config.googleApiKey) {
      //     script.src = 'http://maps.google.com/maps/api/js?key=' + this.config.googleApiKey + '&callback=mapInit&libraries=places';
      //   } else {
      //     script.src = 'http://maps.google.com/maps/api/js?callback=mapInit';
      //   }
      //   document.body.appendChild(script);
      //   // }
      // } else {
      //   // if (this.connectivityService.isOnline()) {
      //   this.initMap();
      //   this.enableMap();
      //   // }
      //   // else {
      //   //   this.disableMap();
      //   // }
      //   resolve(true);
      // }
      // this.addConnectivityListeners();
    });
  }

  initMap(): Promise<any> {
    this.mapInitialised = true;
    return new Promise((resolve) => {
      let styles: Array<google.maps.MapTypeStyle> = [
        {
          elementType: "geometry",
          stylers: [{ color: "#f5f5f5" }],
        },
        {
          elementType: "labels.icon",
          stylers: [{ visibility: "off" }],
        },
        {
          elementType: "labels.text.fill",
          stylers: [{ color: "#616161" }],
        },
        {
          elementType: "labels.text.stroke",
          stylers: [{ color: "#f5f5f5" }],
        },
        {
          featureType: "administrative.land_parcel",
          elementType: "labels.text.fill",
          stylers: [{ color: "#bdbdbd" }],
        },
        {
          featureType: "poi",
          elementType: "geometry",
          stylers: [{ color: "#eeeeee" }],
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [{ color: "#757575" }],
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [{ color: "#e5e5e5" }],
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.fill",
          stylers: [{ color: "#9e9e9e" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#ffffff" }],
        },
        {
          featureType: "road.arterial",
          elementType: "labels.text.fill",
          stylers: [{ color: "#757575" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#dadada" }],
        },
        {
          featureType: "road.highway",
          elementType: "labels.text.fill",
          stylers: [{ color: "#616161" }],
        },
        {
          featureType: "road.local",
          elementType: "labels.text.fill",
          stylers: [{ color: "#9e9e9e" }],
        },
        {
          featureType: "transit.line",
          elementType: "geometry",
          stylers: [{ color: "#e5e5e5" }],
        },
        {
          featureType: "transit.station",
          elementType: "geometry",
          stylers: [{ color: "#eeeeee" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#c9c9c9" }],
        },
        {
          featureType: "water",
          elementType: "labels.text.fill",
          stylers: [{ color: "#9e9e9e" }],
        }
      ];
      let center = this.getMapLatLngCenter();
      let mapOptions = {
        center: center,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: styles,
        disableDefaultUI: true
        //,minZoom: 3, maxZoom: 15
      }
      this.map = new google.maps.Map(this.mapElement, mapOptions);
      resolve(true);
    });
  }

  getMapLatLngCenter() {
    let lat = 40.69;
    let lng = -73.97;
    if (this.myCenter && this.myCenter.latitude && this.myCenter.longitude) {
      lat = Number(this.myCenter.latitude);
      lng = Number(this.myCenter.longitude);
    } else if (this.config.defaultLocation && this.config.defaultLocation.use && this.config.defaultLocation.location && this.config.defaultLocation.location.latitude && this.config.defaultLocation.location.longitude) {
      lat = Number(this.config.defaultLocation.location.latitude);
      lng = Number(this.config.defaultLocation.location.longitude);
    }
    return new google.maps.LatLng(lat, lng);
  }

  disableMap(): void {
    if (this.pleaseConnect) {
      if (this.pleaseConnect != null) this.pleaseConnect.style.display = "block";
    }
  }

  enableMap(): void {
    if (this.pleaseConnect) {
      if (this.pleaseConnect != null) this.pleaseConnect.style.display = "none";
    }
  }

  // addConnectivityListeners(): void {
  //   this.connectivityService.watchOnline().subscribe(() => {
  //     setTimeout(() => {
  //       if (typeof google == "undefined" || typeof google.maps == "undefined") {
  //         this.loadGoogleMaps();
  //       }
  //       else {
  //         if (!this.mapInitialised) {
  //           this.initMap();
  //         }
  //         this.enableMap();
  //       }
  //     }, 2000);
  //   });
  //   this.connectivityService.watchOffline().subscribe(() => {
  //     this.disableMap();
  //   });

  // }

}