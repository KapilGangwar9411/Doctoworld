import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RateDoctorComponent } from './rate-doctor.component';

describe('RateDoctorComponent', () => {
  let component: RateDoctorComponent;
  let fixture: ComponentFixture<RateDoctorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RateDoctorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RateDoctorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
