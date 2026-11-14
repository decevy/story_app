import { HttpContextToken } from '@angular/common/http';

/** Marks a request the auth interceptor must pass through untouched (used by the refresh call). */
export const SKIP_AUTH_REFRESH = new HttpContextToken<boolean>(() => false);
