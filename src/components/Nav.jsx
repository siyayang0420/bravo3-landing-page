import BravoMark from './BravoMark.jsx';
import Button from './Button.jsx';
import { APP_STORE_URL, EXTERNAL_LINK } from '../lib/links.js';
import './Nav.css';

export default function Nav() {
  return (
    <nav className="nav">
      <BravoMark className="nav__mark" />
      <div className="nav__status">
       
      </div>
      <Button size="mid" href={APP_STORE_URL} {...EXTERNAL_LINK}>Get the app</Button>
    </nav>
  );
}
