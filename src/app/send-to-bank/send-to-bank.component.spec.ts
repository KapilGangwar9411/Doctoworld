import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendToBankComponent } from './send-to-bank.component';

describe('SendToBankComponent', () => {
  let component: SendToBankComponent;
  let fixture: ComponentFixture<SendToBankComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SendToBankComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SendToBankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
