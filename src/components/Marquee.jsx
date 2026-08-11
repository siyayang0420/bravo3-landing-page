import './Marquee.css';

/* Trailing nbsp, not a plain space — a plain trailing space is trimmed at the end
   of each span's line box, and the two groups would butt together at the seam. */
const PHRASE = 'ASK · DISCOVER · GATHER · SHARE · PAY · REMEMBER · ';

/* The track is two identical groups, so the animation can translate exactly -50%
   and land copy-on-copy. One group has to be wider than the widest viewport we
   care about (5 × ~640px ≈ 3200px), or the loop shows a blank at the end. */
const GROUP = PHRASE.repeat(5);

export default function Marquee() {
  return (
    <div className="marquee">
      {/* decorative — the words repeat 10× and add nothing for a screen reader */}
      <div className="marquee__track display" aria-hidden="true">
        <span>{GROUP}</span>
        <span>{GROUP}</span>
      </div>
    </div>
  );
}
