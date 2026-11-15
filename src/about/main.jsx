import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
/* The page's own fonts are the ones on Mimi's portfolio. Sangui's fonts are for the chart and the font samples. All ship with the site. */
import '@fontsource/bricolage-grotesque/400.css';
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/atkinson-hyperlegible-mono/400.css';
import '@fontsource/playwrite-sk/400.css';
import '../tokens.css';
import '../crowd/crowd.css';
import './about.css';
import About from './About.jsx';

createRoot(document.getElementById('root')).render(<StrictMode><About /></StrictMode>);
