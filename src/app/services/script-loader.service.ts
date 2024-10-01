import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScriptLoaderService {
  private scripts: any = {};

  constructor() { }

  load(script: ScriptStore) {
    var promises: any[] = [];
    promises.push(this.loadScript(script));
    return Promise.all(promises);
  }

  loadScript(scriptStore: ScriptStore) {
    return new Promise((resolve, reject) => {
      if (!this.scripts[scriptStore.name]) this.scripts[scriptStore.name] = scriptStore;
      //resolve if already loaded
      if (this.scripts[scriptStore.name].loaded) {
        resolve({ script: scriptStore.name, loaded: true, status: 'Already Loaded' });
      }
      else {
        const myComp = this;
        if (scriptStore.name == "googlemaps") {
          (<any>window)['mapInit'] = () => {
            myComp.scripts["googlemaps"].loaded = true;
            resolve({ script: "googlemaps", loaded: true, status: 'Loaded' });
          };
        }
        //load script
        let script: any = document.createElement('script');
        script.type = 'text/javascript';
        script.src = this.scripts[scriptStore.name].src;
        //script.crossorigin = "anonymous";
        if (script.readyState) {  //IE
          script.onreadystatechange = () => {
            if (script.readyState === "loaded" || script.readyState === "complete") {
              script.onreadystatechange = null;
              if (scriptStore.name = "googlemaps") {
                console.log("should be handled by window['mapInit']");
              } else {
                this.scripts[scriptStore.name].loaded = true;
                resolve({ script: scriptStore.name, loaded: true, status: 'Loaded' });
              }
            }
          };
        } else {  //Others
          script.onload = () => {
            if (scriptStore.name = "googlemaps") {
              console.log("should be handled by window['mapInit']");
            } else {
              this.scripts[scriptStore.name].loaded = true;
              resolve({ script: scriptStore.name, loaded: true, status: 'Loaded' });
            }
          };
        }
        script.onerror = (error: any) => resolve({ script: scriptStore.name, loaded: false, status: 'Loaded' });
        document.getElementsByTagName('head')[0].appendChild(script);
      }
    });
  }

}

export class ScriptStore {
  name: string;
  src: string;
  constructor(name: string, src: string) {
    this.name = name;
    this.src = src;
  }
}
