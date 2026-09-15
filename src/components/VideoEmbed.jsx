import { useState } from 'react';

/*
 * A YouTube episode, played in place.
 *
 * Deliberately a facade rather than a bare <iframe>: until the reader presses
 * play, the page holds only the poster image and YouTube has shipped nothing —
 * no script, no cookie, no request. Readers who scroll past are never touched
 * by it, and a post's load cost stays what it was before it had a video.
 *
 * The frame is a real <button>, not a div with an onClick, so it is reachable
 * by keyboard and announces itself. The poster carries the label as alt text;
 * the visually-hidden span gives the button its own name, so a screen reader
 * hears "Play video: ..." rather than only the picture's description.
 */
export default function VideoEmbed({ videoId, poster, label, width, height }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="post__video">
        <iframe
          className="post__video-frame"
          /* nocookie, and rel=0 so the end screen stays on this channel */
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="post__video">
      <button type="button" className="post__video-play" onClick={() => setPlaying(true)}>
        <img
          className="post__video-poster"
          src={poster}
          alt={label}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
        />
        <span className="post__video-icon" aria-hidden="true" />
        <span className="post__video-label">Play video: {label}</span>
      </button>
    </div>
  );
}
