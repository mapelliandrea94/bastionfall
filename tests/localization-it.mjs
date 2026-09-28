import assert from 'node:assert/strict';
import {
  SUPPORTED_LANGUAGES,
  gameText,
  getLocalizationFixtures,
  normalizeLanguage,
  t
} from '../src/i18n/localization.js';

const fixtures = getLocalizationFixtures();
assert.equal(fixtures.italianPlay, true);
assert.equal(fixtures.italianSettings, true);
assert.equal(fixtures.englishFallback, true);
assert.equal(fixtures.unsupportedFallsBack, true);
assert.equal(fixtures.supportedCount, 2);

assert.equal(normalizeLanguage('it-IT'), SUPPORTED_LANGUAGES.IT_IT);
assert.equal(normalizeLanguage('en-US'), SUPPORTED_LANGUAGES.EN_US);
assert.equal(normalizeLanguage('fr-FR'), SUPPORTED_LANGUAGES.EN_US);

assert.equal(t('wave', {}, 'it-IT'), 'ONDATA');
assert.equal(t('gold', {}, 'it-IT'), 'ORO');
assert.equal(t('settings', {}, 'it-IT'), 'IMPOSTAZIONI');
assert.equal(gameText('Flawless Defense', 'it-IT'), 'Difesa Perfetta');
assert.equal(gameText('FORTIFIED', 'it-IT'), 'FORTIFICATI');
assert.equal(gameText('TREASURE SURGE', 'it-IT'), 'ONDATA DEL TESORO');
assert.equal(gameText('Flawless Defense', 'en-US'), 'Flawless Defense');

console.log('ITALIAN_LOCALIZATION_PASS');
