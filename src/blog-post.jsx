import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import BlogPost from './components/BlogPost.jsx';
import { getPost } from './lib/posts.js';
import './styles/global.css';

/* One entry per post: the HTML file names its slug, so the head tags in that
   file and the component below always describe the same article. */
const slug = document.getElementById('root').dataset.post;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BlogPost post={getPost(slug)} />
  </StrictMode>,
);
