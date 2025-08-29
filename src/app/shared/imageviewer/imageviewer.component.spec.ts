import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageviewerComponent } from './imageviewer.component';

describe('ImageviewerComponent', () => {
  let component: ImageviewerComponent;
  let fixture: ComponentFixture<ImageviewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageviewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageviewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
