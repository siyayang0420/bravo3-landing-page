import noodle from '../assets/ask2/lanzhou-beef-noodle.webp';
import cocoAvatar from '../assets/ask2/coco-avatar.webp';
import storefront from '../assets/ask2/imran-storefront.webp';
import map from '../assets/ask2/vancouver-map.webp';
import bookmark from '../assets/app/bookmark.svg';

/*
 * Second state of the Ask stage (Figma 5913:16878) — the answer the question
 * turns into. Authored against Figma's 572 x 633 box with every size in cqw, so
 * the whole panel scales as one piece.
 *
 * The avatar at the top right is NOT drawn here: it is the shared element that
 * flies in from state 1, so this leaves an empty slot for it to land in.
 */
export default function AskStage2() {
  return (
    <>
      <div className="a2__ask">
        <span className="a2__bubble">where to try halal noodle in town ?</span>
        <span className="a2__av-slot" />
      </div>

      <div className="a2__answer">
        <div className="a2__result">
          <img className="a2__dish" src={noodle} alt="" loading="lazy" decoding="async" />

          <div className="a2__meta">
            <div className="a2__head">
              <p className="a2__name">Lanzhou Beef Noodle</p>
              <p className="a2__liked">
                Your friend
                <img className="a2__liked-av" src={cocoAvatar} alt="" loading="lazy" decoding="async" />
                Coco and 32+ liked
              </p>
            </div>

            <div className="a2__venue">
              <div className="a2__venue-left">
                <span className="a2__venue-thumb">
                  <img src={storefront} alt="" loading="lazy" decoding="async" />
                  <span className="a2__venue-pct">3%</span>
                </span>
                <span className="a2__venue-text">
                  <span className="a2__venue-name">IMRAN Halal Beef Noodle</span>
                  <span className="a2__venue-sub">Cafe • Vancouver • 15.13km</span>
                </span>
              </div>
              <span className="a2__venue-save"><img src={bookmark} alt="" /></span>
            </div>
          </div>
        </div>

        {/* Figma crops this tall map to a 572 x 336 window ~60% down its height */}
        <img className="a2__map" src={map} alt="" loading="lazy" decoding="async" />
      </div>
    </>
  );
}
