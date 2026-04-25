import { AfterViewInit, Component, ElementRef, input, ViewChild } from '@angular/core';
import JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-barcode',
  standalone: true,
  template: `
    <svg #barcode></svg>
  `,
})
export class BarcodeComponent implements AfterViewInit {
  value = input.required<string>();

  @ViewChild('barcode')
  barcodeElement!: ElementRef<SVGElement>;

  ngAfterViewInit() {
    JsBarcode(this.barcodeElement.nativeElement, this.value(), {
      format: 'EAN13',
      displayValue: true,
      fontSize: 14,
      height: 60,
      margin: 8,
    });
  }
}
