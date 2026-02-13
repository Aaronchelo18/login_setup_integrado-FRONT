import { TestBed } from '@angular/core/testing';
import { AuthInterceptor } from './auth.interceptor';
import { Router } from '@angular/router';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let routerSpy = { navigate: jasmine.createSpy('navigate') };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthInterceptor,
        { provide: Router, useValue: routerSpy }
      ]
    });
    interceptor = TestBed.inject(AuthInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});