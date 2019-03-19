import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BurneredPage } from './burnered.page';

describe('BurneredPage', () => {
  let component: BurneredPage;
  let fixture: ComponentFixture<BurneredPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BurneredPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BurneredPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
