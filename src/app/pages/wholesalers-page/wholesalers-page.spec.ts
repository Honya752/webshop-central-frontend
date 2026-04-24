import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WholesalersPage } from './wholesalers-page';

describe('WholesalersPage', () => {
  let component: WholesalersPage;
  let fixture: ComponentFixture<WholesalersPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WholesalersPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WholesalersPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
