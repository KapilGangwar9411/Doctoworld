import { TestBed } from '@angular/core/testing';

import { NotificationPushService } from './notification-push.service';

describe('NotificationPushService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NotificationPushService = TestBed.get(NotificationPushService);
    expect(service).toBeTruthy();
  });
});
