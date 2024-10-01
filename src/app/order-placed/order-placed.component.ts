import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-order-placed',
  templateUrl: './order-placed.component.html',
  styleUrls: ['./order-placed.component.scss']
})
export class OrderPlacedComponent {
  constructor(private router: Router) { }

  my_orders() {
    this.router.navigateByUrl('my-orders');
  }

  home() {
    this.router.navigateByUrl('home');
  }
}
