import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
/* The fonts ship with the site, so no visitor's address goes to a font service */
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/atkinson-hyperlegible-mono/400.css';
import '@fontsource/playwrite-sk/400.css';
import './app.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
