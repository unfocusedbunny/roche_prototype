/*
 * Which language the page is in: English, or German when the address ends in ?lang=de.
 * The choice lives in the address only. Nothing is stored in the browser, as the privacy note says.
 * The project page ("How Sangui was made") is English only, so there the answer is always English.
 */
const here = typeof location === 'undefined' ? null : location;
const asked = here ? new URLSearchParams(here.search).get('lang') : null;
const onProjectPage = here ? here.pathname.includes('how-it-was-made') : false;

export const LANG = asked === 'de' && !onProjectPage ? 'de' : 'en';

/* The address of this page in another language */
export const langHref = (code) => (code === 'en' ? './' : './?lang=' + code);

/* A number as the language writes it: 15.6 in English, 15,6 in German */
export const num = (n) => (LANG === 'de' ? String(n).replace('.', ',') : String(n));

if (typeof document !== 'undefined') {
  document.documentElement.lang = LANG;
}
