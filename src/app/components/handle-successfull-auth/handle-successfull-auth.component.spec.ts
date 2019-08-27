import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleSuccessfullAuthComponent } from './handle-successfull-auth.component';

describe('HandleSuccessfullAuthComponent', () => {
  let component: HandleSuccessfullAuthComponent;
  let fixture: ComponentFixture<HandleSuccessfullAuthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HandleSuccessfullAuthComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HandleSuccessfullAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
