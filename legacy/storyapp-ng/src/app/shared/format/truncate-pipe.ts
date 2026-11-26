import { Pipe, type PipeTransform } from '@angular/core';

/** `{{ text | truncate: 50 }}` cuts after 50 characters and adds "...". */
@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(text: string, maxLength: number): string {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }
}
