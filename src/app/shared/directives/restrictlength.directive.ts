import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[lengthMax]'
})
export class RestrictlengthDirective {

  @Input() lengthMax!: number;
  @Input() lengthMin?: number;

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    if (value.length > this.lengthMax) {
      input.value = value.substring(0, this.lengthMax);
      input.dispatchEvent(new Event('input'));
    }
  }

  @HostListener('blur', ['$event']) onBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    if (this.lengthMin && value.length < this.lengthMin) {
      input.value = value.padEnd(this.lengthMin, ' ');
      input.dispatchEvent(new Event('input'));
    }
  }

}
