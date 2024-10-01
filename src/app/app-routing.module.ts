import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component'; 
import { MyOrdersComponent } from './my-orders/my-orders.component';
import { SignInComponent } from './sign-in/sign-in.component'; 
import { CheckoutComponent } from './checkout/checkout.component';
import { OrderPlacedComponent } from './order-placed/order-placed.component';
import { MyAccountComponent } from './my-account/my-account.component';
import { SupportComponent } from './support/support.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { ChangeLanguageComponent } from './change-language/change-language.component';
import { MyOffersComponent } from './my-offers/my-offers.component';
import { VendorInfoComponent } from './vendor-info/vendor-info.component';
import { SubCategoryComponent } from './sub-category/sub-category.component';
import { MyAppointmentComponent } from './my-appointment/my-appointment.component';
import { HospitalsComponent } from './hospitals/hospitals.component';
import { DoctorsComponent } from './doctors/doctors.component';
import { MedicineInfoComponent } from './medicine-info/medicine-info.component';
import { DoctorsListComponent } from './doctors-list/doctors-list.component';
import { DoctorInfoComponent } from './doctor-info/doctor-info.component';
import { HospitalInfoComponent } from './hospital-info/hospital-info.component';
import { AppointmentBookedComponent } from './appointment-booked/appointment-booked.component';
import { HospitalListComponent } from './hospital-list/hospital-list.component';
import { AuthGuard } from './services/authguard/auth.guard';
import { SearchProductComponent } from './search-product/search-product.component';
import { ReadComponent } from './read/read.component';
import { AppointmentBookComponent } from './appointment-book/appointment-book.component';
import { WalletComponent } from './wallet/wallet.component';
        

const routes: Routes = [
  { path: "", redirectTo: "sign-in", pathMatch: "full" }, 
  { path: "home", component: HomeComponent}, 
  { path: "my-orders", component: MyOrdersComponent },
  { path: "sign-in", component: SignInComponent }, 
  { path: "checkout", component: CheckoutComponent },
  { path: "order-placed", component: OrderPlacedComponent },
  { path: "my-account", component: MyAccountComponent },
  { path: "support", component: SupportComponent },
  { path: "privacy-policy", component: PrivacyPolicyComponent },
  { path: "change-language", component: ChangeLanguageComponent },
  { path: "my-offers", component: MyOffersComponent },
  { path: "vendor-info", component: VendorInfoComponent },
  { path: "sub-category", component: SubCategoryComponent , canActivate: [AuthGuard]},
  { path: "my-appointment", component: MyAppointmentComponent },
  { path: "hospitals", component: HospitalsComponent },
  { path: "hospitals", component: HospitalsComponent },
  { path: "doctors", component: DoctorsComponent },
  { path: "medicine-info", component: MedicineInfoComponent },
  { path: "doctors-list", component: DoctorsListComponent },
  { path: "doctor-info", component: DoctorInfoComponent },
  { path: "hospital-info", component: HospitalInfoComponent },
  { path: "appointment-booked", component: AppointmentBookedComponent },
  { path: "appointment-book", component: AppointmentBookComponent},
  { path: "hospital-list", component: HospitalListComponent },
  { path: "search-product", component: SearchProductComponent },
  { path: "read", component: ReadComponent },
  { path: "wallet", component: WalletComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled', useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
