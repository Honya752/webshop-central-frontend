import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWholesalerPage } from './create-wholesaler-page';

describe('CreateWholesalerPage', () => {
  let component: CreateWholesalerPage;
  let fixture: ComponentFixture<CreateWholesalerPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateWholesalerPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateWholesalerPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
