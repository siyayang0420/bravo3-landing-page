import heroImg from '../assets/blog/hero.webp';
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
 */
export const POSTS = [
  {
    slug: 'bravo-ai-sessions-vol-3',
    title: 'That’s a wrap on Bravo AI Sessions Vol. 3',
    date: '2026-08-08',
    dateLabel: 'August 8, 2026',
    excerpt:
      'An inspiring evening exploring how AI is moving beyond chat and into real-world commerce — from discovery and booking to ordering, paying, and earning.',
    hero: heroImg,
    heroAlt:
      'The Bravo team and guests gathered for a group photo at Bravo AI Sessions Vol. 3',
    /*
     * `aspect` is the frame Figma gives each photo, which is not always the
     * photo's own ratio — p3 and p5 are portrait sources shown in shorter
     * frames, so they crop. `focus` shifts that crop: p5's frame in the design
     * shows the lower ~78% of the image, whose midpoint sits at 61%.
     */
    gallery: [
      { src: p2, alt: 'Guests talking around cafe tables during the session', aspect: '800 / 599' },
      { src: p3, alt: 'The Wren Cafe room filled with attendees seated at tables', aspect: '800 / 599' },
      { src: p4, alt: 'A speaker demonstrating Bravo AI to attendees at the counter', aspect: '800 / 1067' },
      { src: p5, alt: 'Attendees trying the app together after the talk', aspect: '800 / 833', focus: '50% 61%' },
    ],
  },
];

export const getPost = (slug) => POSTS.find((p) => p.slug === slug);
export const postUrl = (slug) => `/blog/${slug}/`;
