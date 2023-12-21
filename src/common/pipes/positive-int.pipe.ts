import { HttpException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PositiveIntPipe implements PipeTransform {
  transform(value: any) {
    if (!this.isInt(value)) {
      throw new HttpException(
        'Validation failed (integer number is expected)',
        400,
      );
    }
    value = parseInt(value, 10);

    if (!this.isPositive(value)) {
      throw new HttpException(
        'Validation failed (positive number is expected)',
        400,
      );
    }
    return value;
  }

  protected isInt(value): boolean {
    return /^-?\d+$/.test(value) && isFinite(value as any);
  }

  protected isPositive(value): boolean {
    return value > 0;
  }
}
