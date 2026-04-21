import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoresPage } from './stores-page';

describe('StoresPage', () => {
  let component: StoresPage;
  let fixture: ComponentFixture<StoresPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoresPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoresPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
