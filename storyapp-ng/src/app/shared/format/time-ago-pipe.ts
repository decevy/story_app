import { Pipe, type PipeTransform } from '@angular/core';
import { formatDistance } from 'date-fns';

/**
 * `{{ createdAt | timeAgo: clock.now() }}` → "5 minutes ago". Passing the current time keeps the
 * pipe pure while the text still updates as the clock ticks.
 */
@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(isoDate: string, now: number): string {
    return formatDistance(new Date(isoDate), now, { addSuffix: true });
  }
}
