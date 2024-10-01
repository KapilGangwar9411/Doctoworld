import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sub-category',
  templateUrl: './sub-category.component.html',
  styleUrls: ['./sub-category.component.scss']
})
export class SubCategoryComponent {

  constructor(private router: Router) { }

  vendorInfo() {
    this.router.navigateByUrl('vendor-info');
  }
}
