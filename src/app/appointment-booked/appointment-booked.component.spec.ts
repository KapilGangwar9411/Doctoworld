import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentBookedComponent } from './appointment-booked.component';

describe('AppointmentBookedComponent', () => {
  let component: AppointmentBookedComponent;
  let fixture: ComponentFixture<AppointmentBookedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppointmentBookedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentBookedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
