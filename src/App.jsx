import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Marquee from './components/Marquee.jsx';
import Ask from './components/Ask.jsx';
import Taste from './components/Taste.jsx';
import Pay from './components/Pay.jsx';
import Footer from './components/Footer.jsx';
import AvatarMorph from './components/AvatarMorph.jsx';

export default function App() {
  return (
    <main className="page">
      {/* Nav + hero are pinned together as one 100vh unit while the in-phone
          animation plays; the extra scene height below is that scroll budget. */}
      <div className="hero-scene">
        <div className="hero-sticky">
          <Nav />
          <Hero />
        </div>
      </div>
      <Marquee />
      <Ask />
      <Taste />
      <Pay />
      <Footer />
      {/* Emma's avatar grows from the phone answer into the Ask stage */}
      <AvatarMorph />
    </main>
  );
}
