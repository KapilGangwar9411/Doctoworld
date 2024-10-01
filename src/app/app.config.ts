import { InjectionToken } from "@angular/core";
import { Constants } from "src/models/constants.models";

export let APP_CONFIG = new InjectionToken<AppConfig>("app.config");

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    webApplicationId: string;
}

export interface AppConfig {
    appName: string;
    apiBase: string;
    googleApiKey: string;
    availableLanguages: Array<{ code: string; name: string; }>;
    firebaseConfig: FirebaseConfig;
    defaultLocation: { location: { title: string, latitude: string, longitude: string }, use: boolean };
    defaultThemeMode: string;
    timeMode: string;
    demoMode: boolean;
    demoLoginCredentials: { country: string, phoneNumber: string; otp: string; };
}

export const BaseAppConfig: AppConfig = {
    appName: "DoctoWorld",
    apiBase: "https://doctoworld.vtlabs.dev/",
    googleApiKey: "AIzaSyBNkC40LLMIkOY-myYT2Vmq12Z0lYBU-tw",
    defaultLocation: { use: true, location: { title: "New York", latitude: "40.69", longitude: "-73.97" } },
    availableLanguages: [{
        code: 'en',
        name: 'English'
    }, {
        code: 'ar',
        name: 'عربى'
    }, {
        code: 'fr',
        name: 'Français'
    }, {
        code: 'es',
        name: 'Española'
    }, {
        code: 'id',
        name: 'Bahasa Indonesia'
    }, {
        code: 'pt',
        name: 'Português'
    }, {
        code: 'tr',
        name: 'Türk'
    }, {
        code: 'it',
        name: 'Italiana'
    }, {
        code: 'sw',
        name: 'Kiswahili'
    }, {
        code: 'de',
        name: 'Deutsch'
    }, {
        code: 'ro',
        name: 'Română'
    }],
    defaultThemeMode: Constants.THEME_MODE_LIGHT, 
    demoMode: true,
    timeMode: "12", //12 or 24
    demoLoginCredentials: { country: "91", phoneNumber: "9898989898", otp: "123456" },
    firebaseConfig: {
        webApplicationId: "902339412765-cqj57nlp64eap21b7cbpfq254ask34e6.apps.googleusercontent.com",
        apiKey: "AIzaSyBDTWYGj9GABZkMTEDWMOCAQhZL20MsrNE",
        authDomain: "doctoworld-8b8e2.firebaseapp.com",
        databaseURL: "https://doctoworld-8b8e2.firebaseio.com",
        projectId: "doctoworld-8b8e2",
        storageBucket: "doctoworld-8b8e2.appspot.com",
        messagingSenderId: "902339412765"
    }
};