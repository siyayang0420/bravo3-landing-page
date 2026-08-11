import screenTasteDna from '../assets/screen-taste-dna.png';
import screenChallenge from '../assets/screen-challenge.png';
import './NightLeaves.css';

export default function NightLeaves() {
  return (
    <section className="section section--dark nights">
      <div>
        <h2 className="h2">Every night leaves something behind.</h2>
        <p className="body nights__body">
          Your posts, your places, your people — a dining identity that’s yours,
          built one Friday at a time.
        </p>
      </div>
      <div className="nights__stage">
        <img className="phone float" style={{ '--r': '-4deg', '--dur': '10s' }} src={screenTasteDna} alt="Taste DNA profile" />
        <img className="phone float-alt" style={{ '--r': '4deg', '--dur': '12s' }} src={screenChallenge} alt="Summer Dining Challenge with friends" />
      </div>
    </section>
  );
}
