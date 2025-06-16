import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[numberonly]'
})
export class NumberonlyDirective {

  private decimalCounter = 0;
  private navigationKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "Home",
    "End",
    "ArrowLeft",
    "ArrowRight",
    "Clear",
    "Copy",
    "Paste"
  ];
  @Input() decimal ? = false;
  @Input() digit ? = 2;
  @Input() negative ? = false;

  inputElement: HTMLElement;

  constructor(public el: ElementRef) {
    this.inputElement = el.nativeElement;
  }

  @HostListener("keydown", ["$event"]) onKeyDown(e: KeyboardEvent) {

    if (
      this.navigationKeys.indexOf(e.key) > -1 ||
      (e.key === "a" && e.ctrlKey === true) ||
      (e.key === "c" && e.ctrlKey === true) ||
      (e.key === "v" && e.ctrlKey === true) ||
      (e.key === "x" && e.ctrlKey === true) ||
      (e.key === "a" && e.metaKey === true) ||
      (e.key === "c" && e.metaKey === true) ||
      (e.key === "v" && e.metaKey === true) ||
      (e.key === "x" && e.metaKey === true) ||
      (this.decimal && e.key === "." && this.decimalCounter < 1)
    ) {
     return;
    }
    
    if (e.key === " " || (this.negative ? false : isNaN(Number(e.key)))  || (this.digit ? this.decimalCounter >= this.digit : false)) {
      e.preventDefault();
    }

  }

  @HostListener("keyup", ["$event"]) onKeyUp(e: KeyboardEvent) {
    if(this.el.nativeElement.value == '') this.decimalCounter = 0;
    if (!this.decimal) {
      return;
    } else {
      this.decimalCounter = this.el.nativeElement.value.split(".")[1].length;      
    }
  }

  @HostListener("paste", ["$event"]) onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedInput: string = event.clipboardData?.getData("text/plain") || '';

    if (!this.decimal) {
      document.execCommand(
        "insertText",
        false,
        pastedInput.replace(/[^0-9]/g, "")
      );
    } else if (this.isValidDecimal(pastedInput)) {
      document.execCommand(
        "insertText",
        false,
        pastedInput.replace(/[^0-9.]/g, "")
      );
    }
  }

  @HostListener("drop", ["$event"]) onDrop(event: DragEvent) {
    event.preventDefault();
    const textData = event.dataTransfer?.getData("text") || '';
    this.inputElement.focus();

    if (!this.decimal) {
      document.execCommand(
        "insertText",
        false,
        textData.replace(/[^0-9]/g, "")
      );
    } else if (this.isValidDecimal(textData)) {
      document.execCommand(
        "insertText",
        false,
        textData.replace(/[^0-9.]/g, "")
      );
    }
  }

  isValidDecimal(string: string): boolean {
    return string.split(".")[1].length <= (this.digit || 0);
  }

}
