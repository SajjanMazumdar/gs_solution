import { animate, style, transition, trigger, AnimationEvent } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { Image } from '../interface/interface_image';
import { MaterialModule } from '../../material.module';
import { MaterialExtensionsModule } from '../../material-extension.module';
import { SharedModule } from '../shared.module';
import { SvgIconComponent } from 'angular-svg-icon';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-imageviewer',
  imports: [MaterialModule, MaterialExtensionsModule, SharedModule, MatDialogModule, FormsModule, ReactiveFormsModule],
  templateUrl: './imageviewer.component.html',
  styleUrl: './imageviewer.component.scss',
  animations: [
    trigger('animation',[
      transition('void => visible', [
        style({transform: 'scale(0.5)'}),
        animate('150ms', style({transform: 'scale(1)'}))
      ]),
      transition('visible => void', [
        style({transform: 'scale(1)'}),
        animate('150ms', style({transform: 'scale(0.5)'}))
      ]),
    ]),
    trigger('animation2',[
      transition(':leave', [
        style({opacity: 1}),
        animate('300ms', style({opacity: 0.8}))
      ])
    ])
  ]
})
export class ImageviewerComponent {
  @Input() galleryData: Image[] = [];
  @Input() showCount = false;

  previewImage = false;
  showMask = false;
  currentLightboxImage: Image = this.galleryData[0];
  currentIndex = 0;
  controls = true;
  totalImageCount = 0;

  constructor() { }

  ngOnInit(): void {
    this.totalImageCount = this.galleryData.length;
  }

  onPreviewImage(index: number): void {
    this.showMask = true;
    this.previewImage = true;
    this.currentIndex = index;
    this.currentLightboxImage = this.galleryData[index];
  }

  onAnimationEnd(event: AnimationEvent){
    if(event.toState === 'void') {
      this.showMask = false;
    }
  }

  onClosePreview(){
    this.previewImage = false;
  }

  prev(): void {
    this.currentIndex = this.currentIndex -1;
    if(this.currentIndex < 0){
      this.currentIndex = this.galleryData.length -1;
    }
    this.currentLightboxImage = this.galleryData[this.currentIndex];
  }

  next(): void {
    this.currentIndex = this.currentIndex + 1;
    if(this.currentIndex > this.galleryData.length -1){
      this.currentIndex = 0;
    }
    this.currentLightboxImage = this.galleryData[this.currentIndex];
  }
}
