import frame from '../assets/iphone/frame.svg';
import reflectTop from '../assets/iphone/reflect-top.svg';
import bezel from '../assets/iphone/bezel.svg';
import reflectBot from '../assets/iphone/reflect-bot.svg';
import btnRight from '../assets/iphone/btn-right.svg';
import btnLeft1 from '../assets/iphone/btn-left1.svg';
import btnLeft2 from '../assets/iphone/btn-left2.svg';
import btnMute from '../assets/iphone/btn-mute.svg';
import lineBot from '../assets/iphone/line-bot.svg';
import island from '../assets/iphone/island.svg';
import camOuter from '../assets/iphone/cam-outer.svg';
import camLens from '../assets/iphone/cam-lens.png';
import camRing from '../assets/iphone/cam-ring.svg';
import camIn1 from '../assets/iphone/cam-in1.svg';
import camIn2 from '../assets/iphone/cam-in2.svg';
import camGlint from '../assets/iphone/cam-glint.svg';
import './PhoneMockup.css';

/*
 * iPhone mockup (Figma node 5794:2375, reused at 5821:7328). Each layer keeps
 * its exact Figma placement, expressed as % of the 344 × 708.878 art box so the
 * whole thing scales with the container. z-order matches Figma back-to-front.
 * [left%, top%, width%, height%, blendMode?]
 *
 * The frame art paints its own white screen, so an empty mockup renders as a
 * blank phone. Pass `children` to put a screen inside it.
 */
const LAYERS = [
  { src: frame,      pos: [0.814, 0, 98.708, 100] },
  { src: reflectTop, pos: [4.544, 0.010, 94.685, 7.779], blend: 'screen' },
  { src: bezel,      pos: [2.105, 0.626, 96.126, 98.749] },
  { src: reflectBot, pos: [4.544, 92.212, 94.685, 7.779], blend: 'screen' },
  { src: btnRight,   pos: [99.520, 20.919, 0.478, 10.698] },
  { src: btnLeft1,   pos: [0, 20.919, 0.818, 7.193] },
  { src: btnLeft2,   pos: [0, 29.935, 0.818, 7.191] },
  { src: btnMute,    pos: [0, 12.406, 0.818, 3.905] },
  { src: lineBot,    pos: [44.413, 99.822, 11.519, 0.170] },
  { src: island,     pos: [37.494, 2.030, 25.016, 3.515] },
  { src: camOuter,   pos: [56.302, 3.018, 3.167, 1.537] },
  { src: camLens,    pos: [56.378, 3.062, 3.188, 1.547] },
  { src: camRing,    pos: [56.982, 3.348, 1.807, 0.877] },
  { src: camIn1,     pos: [57.093, 3.404, 1.584, 0.769] },
  { src: camIn2,     pos: [57.093, 3.404, 1.584, 0.769], blend: 'multiply' },
  { src: camGlint,   pos: [58.041, 3.851, 0.563, 0.273], blend: 'screen' },
];

export default function PhoneMockup({ className = '', children, ...props }) {
  return (
    <div className={`phone-mockup ${className}`.trim()} {...props}>
      {children}
      {LAYERS.map(({ src, pos: [l, t, w, h], blend }, i) => (
        <img
          key={i}
          className="phone-mockup__layer"
          src={src}
          alt=""
          style={{
            left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%`,
            mixBlendMode: blend,
          }}
        />
      ))}
    </div>
  );
}
