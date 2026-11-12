import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
/* Same fonts as the prototype, shipped with the site. Mono 700 is for the tools line on red, where small text needs the weight. */
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/atkinson-hyperlegible-mono/400.css';
import '@fontsource/atkinson-hyperlegible-mono/700.css';
import '@fontsource/playwrite-sk/400.css';
import '../tokens.css';
import './about.css';
import About from './About.jsx';

createRoot(document.getElementById('root')).render(<StrictMode><About /></StrictMode>);
