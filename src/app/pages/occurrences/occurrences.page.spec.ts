import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OccurrencesPage } from './occurrences.page';

describe('OccurrencesPage', () => {
  let component: OccurrencesPage;
  let fixture: ComponentFixture<OccurrencesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OccurrencesPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OccurrencesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
