import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadOurAppComponent } from './download-our-app.component';

describe('DownloadOurAppComponent', () => {
  let component: DownloadOurAppComponent;
  let fixture: ComponentFixture<DownloadOurAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DownloadOurAppComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DownloadOurAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
