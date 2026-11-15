import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
/* The page's headings use Open Sans, as on Mimi's portfolio; its text uses the device's system font. Sangui's fonts are for the chart and the 3D cell. All ship with the site. */
import '@fontsource/open-sans/700.css';
import '@fontsource/open-sans/800.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/atkinson-hyperlegible-mono/400.css';
import '@fontsource/playwrite-sk/400.css';
import '../tokens.css';
import '../crowd/crowd.css';
import './about.css';
import About from './About.jsx';

createRoot(document.getElementById('root')).render(<StrictMode><About /></StrictMode>);
