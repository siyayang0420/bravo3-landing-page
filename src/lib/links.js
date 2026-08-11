/* Every CTA on the page points here. Kept in one place so the destination
   changes once, not in five components. */
export const APP_STORE_URL = 'https://apps.apple.com/ca/app/bravo-rewards/id6477488926';
export const PLAY_STORE_URL = 'https://play.google.com/store/search?q=bravo%20rewards&c=apps&hl=en_CA';

/* Spread onto an <a> so external CTAs open in a new tab without handing the
   destination a live `window.opener`. */
export const EXTERNAL_LINK = { target: '_blank', rel: 'noopener noreferrer' };
