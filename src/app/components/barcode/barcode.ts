import { AfterViewInit, Component, ElementRef, input, ViewChild } from '@angular/core';
import JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-barcode',
  standalone: true,
  template: `
    <svg #barcode [attr.aria-label]="'Barcode ' + value()" role="img"></svg>
  `,
})
export class BarcodeComponent implements AfterViewInit {
  value = input.required<string>();
  /** Height of the bars in px. */
  height = input(60);
  /** Width of the thinnest bar in px. */
  barWidth = input(2);

  @ViewChild('barcode')
  barcodeElement!: ElementRef<SVGElement>;

  ngAfterViewInit() {
    const options = {
      displayValue: true,
      fontSize: Math.max(10, Math.round(this.height() / 4)),
      height: this.height(),
      width: this.barWidth(),
      margin: 4,
    };

    try {
      JsBarcode(this.barcodeElement.nativeElement, this.value(), { ...options, format: 'EAN13' });
    } catch {
      // Not a valid EAN-13 (wrong length or check digit): draw it as a general barcode
      JsBarcode(this.barcodeElement.nativeElement, this.value(), { ...options, format: 'CODE128' });
    }
  }
}
