import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateProductPage } from './create-product-page';

describe('CreateProductPage', () => {
  let component: CreateProductPage;
  let fixture: ComponentFixture<CreateProductPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateProductPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateProductPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
