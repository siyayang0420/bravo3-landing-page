import { useEffect, useRef, useState } from 'react';
import blurBg from '../assets/challenge/blur-bg.svg';
import blob from '../assets/challenge/blob.svg';
import cellular from '../assets/challenge/cellular.svg';
import wifi from '../assets/challenge/wifi.svg';
import battery from '../assets/challenge/battery.svg';
import back from '../assets/challenge/back.svg';
import coinBg from '../assets/challenge/coin-bg.svg';
import coinIn from '../assets/challenge/coin-in.svg';
import chevron from '../assets/challenge/chevron.svg';
import emma from '../assets/challenge/emma.png';
import crown from '../assets/challenge/crown.png';
import coco from '../assets/challenge/coco.png';
import yvon from '../assets/challenge/yvon.png';
import you from '../assets/challenge/you.png';
import m1 from '../assets/challenge/m1.png';
import m2 from '../assets/challenge/m2.png';
import m3 from '../assets/challenge/m3.png';
import m4 from '../assets/challenge/m4.png';
import './ChallengeScreen.css';

const DESIGN_W = 402;

/*
 * Leaderboard players. Each is absolutely placed at its Figma coordinate — the
 * scatter is deliberate, not a grid — and the avatar size encodes the ranking.
 * [left, top, avatarW, avatarH, pctFontSize]
 */
const PLAYERS = [
  { name: 'Emma', pct: '15.10%', src: emma, crowned: true, pos: [79.36, 313.31, 71.27, 95.03, 23.76] },
  { name: 'Coco', pct: '13.08%', src: coco, pos: [252, 108, 66.21, 88.28, 22.07] },
  { name: 'Yvon', pct: '10.02%', src: yvon, pos: [258, 325, 60.19, 80.25, 20.06] },
  { name: 'You', pct: '8.58%', src: you, pos: [65, 165, 57.78, 77.04, 19.26] },
];

const MERCHANTS = [m1, m2, m3, m4];

export default function ChallengeScreen() {
  const host = useRef(null);
  const [scale, setScale] = useState(1);
  const [frameH, setFrameH] = useState(874);

  /* Same trick as the other in-phone screens: author at Figma's 402px width and
     scale to the glass, so all type stays real text instead of a flat image. */
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const s = e.contentRect.width / DESIGN_W;
      setScale(s);
      setFrameH(e.contentRect.height / s);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="chal" ref={host}>
      <div className="chal__frame" style={{ transform: `scale(${scale})`, height: `${frameH}px` }}>
        {/* warm gradient wash + the rotated blob behind the players */}
        <img className="chal__wash" src={blurBg} alt="" />
        <img className="chal__blob" src={blob} alt="" />

        <div className="chal__top">
          <div className="chal__status">
            <span className="chal__time">9:41</span>
            <span className="chal__island" />
            <span className="chal__levels">
              <img src={cellular} alt="" style={{ width: 19.2, height: 12.226 }} />
              <img src={wifi} alt="" style={{ width: 17.142, height: 12.328 }} />
              <img src={battery} alt="" style={{ width: 27.328, height: 13 }} />
            </span>
          </div>
          <div className="chal__bar">
            <span className="chal__back"><img src={back} alt="" /></span>
            <span className="chal__title">Challenge</span>
            <span className="chal__invited">Invited: 3/3</span>
          </div>
        </div>

        {PLAYERS.map(({ name, pct, src, crowned, pos: [l, t, w, h, fs] }) => (
          <div className="chal__player" key={name} style={{ left: `${l}px`, top: `${t}px`, width: `${w}px` }}>
            <div className="chal__avatar" style={{ width: `${w}px`, height: `${h}px` }}>
              <img src={src} alt="" />
              {crowned && <img className="chal__crown" src={crown} alt="" />}
            </div>
            <span className="chal__name">{name}</span>
            <span className="chal__pct" style={{ fontSize: `${fs}px` }}>{pct}</span>
          </div>
        ))}

        <div className="chal__sheet">
          <div className="chal__sheet-top">
            <div className="chal__coin">
              <img className="chal__coin-bg" src={coinBg} alt="" />
              <img className="chal__coin-in" src={coinIn} alt="" />
            </div>
            <div className="chal__blurb">
              <p className="chal__blurb-title">Summer Dining Challenge</p>
              <p className="chal__blurb-text">
                Spend $1,000 together. Everyone earns an extra $5. Stackable with
                merchant bonuses. Invite up to 3 friends.
              </p>
            </div>

            <div className="chal__prog">
              <div className="chal__prog-row">
                <span className="chal__prog-amount">$512.56/$1000</span>
                <span className="chal__prog-left">67 days left</span>
              </div>
              <div className="chal__prog-track"><div className="chal__prog-fill" /></div>
            </div>
          </div>

          <div className="chal__merchants">
            <span className="chal__merchant-stack">
              {MERCHANTS.map((src, i) => <img key={i} src={src} alt="" />)}
            </span>
            <span className="chal__merchants-label">View 24 eligible merchants</span>
            <img className="chal__merchants-chevron" src={chevron} alt="" />
          </div>
        </div>
      </div>
    </div>
  );
}
