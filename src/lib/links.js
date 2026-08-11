/* Every CTA on the page points here. Kept in one place so the destination
   changes once, not in five components. */
export const APP_STORE_URL = 'https://apps.apple.com/ca/app/bravo-rewards/id6477488926';
export const PLAY_STORE_URL = 'https://play.google.com/store/search?q=bravo%20rewards&c=apps&hl=en_CA';

/* The eGift card product lives on a separate site. */
export const EGIFT_URL = 'https://www.bravoup.ca/';
export const EGIFT_BALANCE_URL = 'https://www.bravoup.ca/checkbalance';
export const EGIFT_RESTAURANTS_URL = 'https://www.bravoup.ca/restaurants';

/* Venue credited in the AI Sessions post. */
export const WREN_CAFE_URL = 'https://www.bravoup.ca/store/wren-cafe';

export const SOCIAL_URLS = {
  instagram: 'https://www.instagram.com/bravo_rewards_ca/',
  linkedin: 'https://www.linkedin.com/company/bravoup/posts/?feedView=all',
  facebook: 'https://www.facebook.com/bravorewardscanada/',
};

/* Spread onto an <a> so external CTAs open in a new tab without handing the
   destination a live `window.opener`. */
export const EXTERNAL_LINK = { target: '_blank', rel: 'noopener noreferrer' };

/*
 * The footer's "Download" link is annotated in Figma: iOS -> App Store,
 * Android -> Play Store, desktop -> App Store.
 *
 * Resolved at click time, not render time. The markup therefore always ships a
 * real App Store URL — which is what crawlers index and what a no-JS visitor
 * follows — and only Android users get rewritten to Play.
 */
export function storeUrlForDevice() {
  if (typeof navigator === 'undefined') return APP_STORE_URL;
  return /android/i.test(navigator.userAgent) ? PLAY_STORE_URL : APP_STORE_URL;
}
