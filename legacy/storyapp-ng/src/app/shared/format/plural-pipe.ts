import { Pipe, type PipeTransform } from '@angular/core';

const englishPlural = new Intl.PluralRules('en-US');

/** `{{ count | plural: 'writer' : 'writers' }}` → "1 writer", "3 writers". */
@Pipe({ name: 'plural' })
export class PluralPipe implements PipeTransform {
  transform(count: number, one: string, other: string): string {
    return `${count} ${englishPlural.select(count) === 'one' ? one : other}`;
  }
}
