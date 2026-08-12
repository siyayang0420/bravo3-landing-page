import heroImg from '../assets/blog/hero.webp';
import ellipsisImg from '../assets/blog/ellipsis-entrance.webp';
import vol2Img from '../assets/blog/ai-sessions-vol-2.webp';
import p2 from '../assets/blog/p2.webp';
import p3 from '../assets/blog/p3.webp';
import p4 from '../assets/blog/p4.webp';
import p5 from '../assets/blog/p5.webp';

/*
 * Single source of truth for the blog. The index card, the post page and the
 * JSON-LD in each HTML entry all read from here, so a new post means one entry
 * plus one HTML file rather than edits scattered across three places.
 *
 * `date` is ISO for <time datetime> and schema.org; `dateLabel` is what renders.
 * `category` drives the index filter — use a value from CATEGORIES below.
 * `draft: true` marks a post whose copy is still placeholder: it renders, but is
 * kept out of the sitemap and carries <meta robots="noindex">, so thin or
 * duplicate pages can't be indexed before the real copy lands.
 */
export const CATEGORIES = ['AI Event', 'Restaurant'];

export const POSTS = [
  {
    slug: 'bravo-ai-sessions-vol-3',
    category: 'AI Event',
    title: 'That’s a wrap on Bravo AI Sessions Vol. 3',
    crumb: 'Bravo AI Sessions Vol. 3',
    date: '2026-08-08',
    dateLabel: 'August 8, 2026',
    excerpt:
      'An inspiring evening exploring how AI is moving beyond chat and into real-world commerce — from discovery and booking to ordering, paying, and earning.',
    hero: heroImg,
    heroAlt:
      'The Bravo team and guests gathered for a group photo at Bravo AI Sessions Vol. 3',
    /*
     * `aspect` is the frame Figma gives each photo at the 980px column width
     * (node 5870:16257). p2/p3/p4 match their sources' native ratios, so they
     * fill without cropping; p5 is a taller source shown in a shorter frame, so
     * `focus` pins its crop to the bottom, as the design does.
     */
    gallery: [
      { src: p2, alt: 'Guests talking around cafe tables during the session', aspect: '980 / 735' },
      { src: p3, alt: 'The Wren Cafe room filled with attendees seated at tables', aspect: '980 / 1307' },
      { src: p4, alt: 'A speaker demonstrating Bravo AI to attendees at the counter', aspect: '980 / 1307' },
      { src: p5, alt: 'Attendees trying the app together after the talk', aspect: '980 / 1070', focus: '50% 100%' },
    ],
  },

  /* ---- Card copy, dates and photography are the design's (node 5870:16228).
     The design only specifies the index cards, so the article bodies are still
     unwritten — which is why both keep `draft`. Write `body`, then drop `draft`,
     flip the matching HTML entry to `index, follow` and add it to sitemap.xml. */
  {
    slug: 'ellipsis-opens-at-nine',
    category: 'Restaurant',
    draft: true,
    title: 'Ellipsis Opens at Nine and Never Switches Over',
    crumb: 'Ellipsis',
    date: '2026-08-12',
    dateLabel: 'August 12, 2026',
    excerpt:
      'Two bars, one pantry, 47 seats, and fourteen hours a day in which the clock doesn’t decide what you’re allowed to order.',
    hero: ellipsisImg,
    heroAlt:
      'Guests carrying Bravo tote bags walking into the lit triangular entrance of Ellipsis at night',
    body: ['Placeholder copy. This restaurant story has not been written yet.'],
    gallery: [],
  },
  {
    slug: 'bravo-ai-sessions-vol-2',
    category: 'AI Event',
    draft: true,
    title: 'Bravo AI Sessions Vol. 2',
    crumb: 'Bravo AI Sessions Vol. 2',
    date: '2026-07-10',
    dateLabel: 'July 10, 2026',
    /* The design's excerpt opens "Bravo Tech Session Vol. 2" — stale wording the
       site-wide Tech→AI rename already retired, and which contradicts the
       design's own title two lines above it. Kept as "AI" for consistency. */
    excerpt:
      'Bravo AI Session Vol. 2 spent an evening at Pinche Taco Shop imagining an agent that finds the restaurant, gets the reservation and picks the company. The evening it was discussed at had been put together the older way.',
    hero: vol2Img,
    heroAlt:
      'Two guests at Pinche Taco Shop holding a Bravo card offering a free taco during Bravo AI Sessions Vol. 2',
    body: ['Placeholder copy. The recap for this session has not been written yet.'],
    gallery: [],
  },
];

export const getPost = (slug) => POSTS.find((p) => p.slug === slug);
export const postUrl = (slug) => `/blog/${slug}/`;
