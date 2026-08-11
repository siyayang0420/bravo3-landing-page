import Button from './Button.jsx';
import avatar from '../assets/taste/avatar.png';
import iconShare from '../assets/taste/share.svg';
import iconStore from '../assets/taste/store.svg';
import iconUtensils from '../assets/taste/utensils.svg';
import iconPosts from '../assets/taste/posts.svg';
import bravoMark from '../assets/taste/bravo-mark.svg';
import bravoAi from '../assets/taste/bravo-ai.svg';
import ring1 from '../assets/taste/ring-1.svg';
import ring2 from '../assets/taste/ring-2.svg';
import ring3 from '../assets/taste/ring-3.svg';
import radar from '../assets/taste/radar.svg';
import { APP_STORE_URL, EXTERNAL_LINK } from '../lib/links.js';
import './Taste.css';

/* Stat row of the "Top 32% Diner" card. */
const STATS = [
  { value: '5', icon: iconStore, label: 'restaurants' },
  { value: '5', icon: iconUtensils, label: 'cuisines' },
  { value: '5', icon: iconPosts, label: 'Posts' },
];

/*
 * Radar chart, laid out against Figma's 326 x 290 plot box (node 5831:8340).
 * Everything is a % of that box so the whole thing scales as one piece.
 *
 * The rings are concentric at (166.3, 144.4) but the data polygon's own centre
 * is (160.9, 145.8) — that offset is the shape of the data, so the plot is
 * placed at its literal coordinates rather than centred on the rings.
 * [left%, top%, width%, height%]
 */
/* Each ring's artwork is inset inside its Figma box (e.g. the 227px outer ring
   holds a 196.6 x 217.7 SVG), so these are the resolved artwork rects — letting
   height fall to `auto` leaves the rings non-concentric.
   [left%, top%, width%, height%] */
const RING_POS = [
  [20.85, 12.29, 60.30, 75.08], // outer
  [28.99, 22.73, 44.10, 54.03],
  [36.96, 33.07, 28.16, 33.35], // inner
];
const PLOT_POS = [35.39, 34.09, 27.69, 31.78];

/* [left%, top%, width%] + cross-axis alignment */
const AXES = [
  { name: 'Connoisseur', value: '42', pos: [40.30, 0, 22.70], align: 'center' },
  { name: 'Regular', value: '30', pos: [86.43, 22.67, 13.50], align: 'flex-start' },
  { name: 'Regular', value: '35', pos: [86.43, 67.33, 13.50], align: 'flex-start' },
  { name: 'Connector', value: '42', pos: [40.30, 90.09, 22.70], align: 'center' },
  { name: 'Loyalist', value: '58', pos: [1.53, 68.53, 15.34], align: 'flex-end' },
  { name: 'Explorer', value: '55', pos: [0, 23.70, 15.34], align: 'flex-end' },
];

export default function Taste() {
  return (
    <section className="taste" id="taste">
      <div className="taste__inner">
        {/* art column — mirrors .ask, which puts its stage on the right */}
        <div className="taste__stage" aria-hidden="true">
          <div className="taste__rank">
            <div className="taste__rank-top">
              <div className="taste__rank-who">
                <span className="taste__rank-av"><img src={avatar} alt="" /></span>
                <div className="taste__rank-name">
                  <span className="taste__rank-since">Past 30 Days</span>
                  <span className="taste__rank-title">Top 32% Diner</span>
                </div>
              </div>
              <img className="taste__rank-share" src={iconShare} alt="" />
            </div>

            <div className="taste__stats">
              {STATS.map(({ value, icon, label }) => (
                <div className="taste__stat" key={label}>
                  <span className="taste__stat-value">{value}</span>
                  <span className="taste__stat-label">
                    <img src={icon} alt="" />
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="taste__rank-foot">
              <span>Ranked in the top 5% among your friends</span>
              <img className="taste__rank-mark" src={bravoMark} alt="" />
            </div>
          </div>

          <div className="taste__dna">
            <div className="taste__dna-head">
              <div className="taste__dna-by">
                <img className="taste__dna-logo" src={bravoAi} alt="" />
                <span className="taste__dna-says">says:</span>
              </div>
              <p className="taste__dna-text">
                Bobby is a Explorer. Loves discovering new restaurants, especially
                Japanese and cafés. Usually dines on weekends and prefers mid-range
                restaurants.
              </p>
            </div>

            <div className="taste__chart">
              {[ring1, ring2, ring3].map((src, i) => (
                <img
                  className="taste__ring"
                  key={i}
                  src={src}
                  alt=""
                  style={{
                    left: `${RING_POS[i][0]}%`, top: `${RING_POS[i][1]}%`,
                    width: `${RING_POS[i][2]}%`, height: `${RING_POS[i][3]}%`,
                  }}
                />
              ))}
              <img
                className="taste__plot"
                src={radar}
                alt=""
                style={{
                  left: `${PLOT_POS[0]}%`, top: `${PLOT_POS[1]}%`,
                  width: `${PLOT_POS[2]}%`, height: `${PLOT_POS[3]}%`,
                }}
              />
              {AXES.map(({ name, value, pos: [l, t, w], align }, i) => (
                <span
                  className="taste__axis"
                  key={i}
                  style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, '--align': align }}
                >
                  <span className="taste__axis-name">{name}</span>
                  <span className="taste__axis-value">{value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="taste__copy">
          <h2 className="display taste__title">Taste Is Your<br />New Identity</h2>
          <p className="taste__lede">
            Beyond points and payments, Bravo learns what makes your dining style
            unique, and helps you discover what’s next.
          </p>
          <Button size="reg" className="taste__cta" href={APP_STORE_URL} {...EXTERNAL_LINK}>
            Start building identity
          </Button>
        </div>
      </div>
    </section>
  );
}
