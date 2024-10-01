import { TestBed } from '@angular/core/testing';

import { ECommerceService } from './ecommerce.service';

describe('ECommerceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ECommerceService = TestBed.get(ECommerceService);
    expect(service).toBeTruthy();
  });
});
