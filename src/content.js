/*
 * Sangui: the page's words, in the visitor's language. English is in content.en.js, German in content.de.js;
 * lang.js says which one is asked for. Everything else imports from here and never needs to know.
 */
import * as en from './content.en.js';
import * as de from './content.de.js';
import { LANG } from './lang.js';

const words = LANG === 'de' ? de : en;

export const {
  SHOW_GAPS,
  TITLE,
  STEPS,
  TUBES,
  LABELS,
  RESULTS,
  CHART,
  CONTROLS,
  LINKS,
  PRIVACY,
  PICTURE,
  LANGUAGE,
  PLAIN,
} = words;
