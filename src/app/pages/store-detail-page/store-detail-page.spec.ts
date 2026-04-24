import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreDetailPage } from './store-detail-page';

describe('StoreDetailPage', () => {
  let component: StoreDetailPage;
  let fixture: ComponentFixture<StoreDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreDetailPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoreDetailPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
