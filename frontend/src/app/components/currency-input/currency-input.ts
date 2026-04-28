import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-currency-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './currency-input.html',
  styleUrl: './currency-input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyInputComponent),
      multi: true,
    },
  ],
})
export class CurrencyInputComponent implements ControlValueAccessor {
  @Input() placeholder = '0,00';
  @Input() disabled = false;

  displayValue = '0,00';

  private onChange: (value: number) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: number | null): void {
    const numericValue = Number(value);
    if (value === null || value === undefined || Number.isNaN(numericValue)) {
      this.displayValue = '0,00';
      return;
    }
    this.displayValue = this.formatToBrazilianDecimal(numericValue);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const sanitized = this.sanitizeCurrencyString(target.value);
    this.displayValue = sanitized;
    target.value = sanitized;
    this.onChange(this.parseBrazilianDecimalToNumber(sanitized));
  }

  onBlur(): void {
    this.onTouched();
    this.displayValue = this.formatToBrazilianDecimal(
      this.parseBrazilianDecimalToNumber(this.displayValue),
    );
  }

  onKeyDown(event: KeyboardEvent): void {
    const allowedControlKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Home',
      'End',
    ];

    if (allowedControlKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }

    if (/^\d$/.test(event.key) || event.key === ',' || event.key === '.') {
      return;
    }

    event.preventDefault();
  }

  private sanitizeCurrencyString(rawValue: string): string {
    if (!rawValue) {
      return '';
    }

    const onlyNumericAndSeparators = rawValue.replace(/[^\d.,]/g, '').replace(/\./g, ',');
    const [integerRaw, ...decimalParts] = onlyNumericAndSeparators.split(',');

    const integerSanitized = integerRaw.replace(/^0+(?=\d)/, '') || '0';
    const decimalRaw = decimalParts.join('').replace(/[^\d]/g, '').slice(0, 2);
    const hasSeparator = onlyNumericAndSeparators.includes(',');

    if (!hasSeparator) {
      return integerSanitized;
    }

    if (!decimalRaw) {
      return `${integerSanitized},`;
    }

    return `${integerSanitized},${decimalRaw}`;
  }

  private parseBrazilianDecimalToNumber(rawValue: string): number {
    if (!rawValue) {
      return 0;
    }

    const normalized = rawValue.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    if (Number.isNaN(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  }

  private formatToBrazilianDecimal(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
