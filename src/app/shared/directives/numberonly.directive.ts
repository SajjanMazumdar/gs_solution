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
  @Input() decimal? = false;
  @Input() digit? = 2;
  @Input() negative? = false;
  @Input() length?: number;

  inputElement: HTMLElement;

  constructor(public el: ElementRef) {
    this.inputElement = el.nativeElement;
  }

  @HostListener("keydown", ["$event"]) onKeyDown(e: KeyboardEvent) {

    const value: string = this.el.nativeElement.value;
    const selectionStart = this.el.nativeElement.selectionStart;
    const selectionEnd = this.el.nativeElement.selectionEnd;

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

    if (this.length && !isNaN(Number(e.key)) && !e.ctrlKey && !e.metaKey) {
      let newValue = value.substring(0, selectionStart) + e.key + value.substring(selectionEnd);
      let digitsOnly = newValue.replace(/[^0-9]/g, "");
      if (digitsOnly.length > this.length) {
        e.preventDefault();
        return;
      }
    }

    if (e.key === " " || (this.negative ? false : isNaN(Number(e.key))) || (this.digit ? this.decimalCounter >= this.digit : false)) {
      e.preventDefault();
    }

  }

  @HostListener("keyup", ["$event"]) onKeyUp(e: KeyboardEvent) {
    if (this.el.nativeElement.value == '') this.decimalCounter = 0;
    if (!this.decimal) {
      return;
    } else {
      this.decimalCounter = this.el.nativeElement.value.split(".")[1].length;
    }
  }

  @HostListener("paste", ["$event"]) onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedInput: string = event.clipboardData?.getData("text/plain") || '';
    let filtered = pastedInput;

    // if (!this.decimal) {
    //   document.execCommand(
    //     "insertText",
    //     false,
    //     pastedInput.replace(/[^0-9]/g, "")
    //   );
    // } else if (this.isValidDecimal(pastedInput)) {
    //   document.execCommand(
    //     "insertText",
    //     false,
    //     pastedInput.replace(/[^0-9.]/g, "")
    //   );
    // }

    if (!this.decimal) {
      filtered = pastedInput.replace(/[^0-9]/g, "");
    } else if (this.isValidDecimal(pastedInput)) {
      filtered = pastedInput.replace(/[^0-9.]/g, "");
    }

    if (this.length) {
      const currentValue = this.el.nativeElement.value.replace(/[^0-9]/g, "");
      const allowed = this.length - currentValue.length;
      filtered = filtered.substring(0, allowed);
    }

    document.execCommand("insertText", false, filtered);
  }

  @HostListener("drop", ["$event"]) onDrop(event: DragEvent) {
    event.preventDefault();
    const textData = event.dataTransfer?.getData("text") || '';
    this.inputElement.focus();
    let filtered = textData;

    // if (!this.decimal) {
    //   document.execCommand(
    //     "insertText",
    //     false,
    //     textData.replace(/[^0-9]/g, "")
    //   );
    // } else if (this.isValidDecimal(textData)) {
    //   document.execCommand(
    //     "insertText",
    //     false,
    //     textData.replace(/[^0-9.]/g, "")
    //   );
    // }
    if (!this.decimal) {
      filtered = textData.replace(/[^0-9]/g, "");
    } else if (this.isValidDecimal(textData)) {
      filtered = textData.replace(/[^0-9.]/g, "");
    }

    if (this.length) {
      const currentValue = this.el.nativeElement.value.replace(/[^0-9]/g, "");
      const allowed = this.length - currentValue.length;
      filtered = filtered.substring(0, allowed);
    }

    document.execCommand("insertText", false, filtered);
  }

  isValidDecimal(string: string): boolean {
    return string.split(".")[1].length <= (this.digit || 0);
  }

}
