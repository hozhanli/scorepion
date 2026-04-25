#!/usr/bin/env node
/**
 * check-diacritics.mjs
 *
 * Scans src/lib/i18n/translations.ts for ASCII substitutes of native
 * diacritic characters across Spanish, French, Turkish, and Portuguese
 * language sections. Prevents regressions where a contributor types
 * "Espanol" instead of "Español" or "icin" instead of "için".
 *
 * Run manually:   npm run i18n:check
 * Runs in CI/pre-commit via the `i18n:check` script in package.json.
 *
 * Exits 0 when clean, 1 when violations are found. Violations print as
 * file:line with the offending word + the likely intended native form.
 *
 * How it works:
 *   1. Splits translations.ts into 5 per-language ranges using the
 *      `const <code>` section delimiters.
 *   2. For each non-English section, applies a dictionary of
 *      ASCII-stem → native-form mappings, matched as whole words.
 *   3. Reports every line that contains a flagged word.
 *
 * The dictionary is deliberately conservative — it only flags words
 * that are demonstrably Turkish/Spanish/French/Portuguese and that
 * REQUIRE a diacritic in their correct form. Words that are valid
 * as plain ASCII in the target language (e.g. "yasal" in Turkish,
 * "antes" in Spanish) are NOT flagged.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(__dirname, '..', 'src', 'lib', 'i18n', 'translations.ts');

// ── Section detection ────────────────────────────────────────────────────────
// Finds the line ranges for each language object by looking for `const xx`
// declarations and the closing `};` that ends each one.

const SECTION_MARKERS = [
  { code: 'en', marker: /^const en\s*=/ },
  { code: 'es', marker: /^const es:/ },
  { code: 'fr', marker: /^const fr:/ },
  { code: 'tr', marker: /^const tr:/ },
  { code: 'pt', marker: /^const pt:/ },
];

function findSections(lines) {
  const sections = [];
  for (let i = 0; i < lines.length; i++) {
    for (const { code, marker } of SECTION_MARKERS) {
      if (marker.test(lines[i])) {
        sections.push({ code, start: i + 1, end: -1 });
        break;
      }
    }
  }
  // Each section ends where the next begins. Last one ends at EOF.
  for (let i = 0; i < sections.length; i++) {
    sections[i].end = i + 1 < sections.length ? sections[i + 1].start - 1 : lines.length;
  }
  return sections;
}

// ── Diacritic dictionaries (ASCII-wrong → native-right) ──────────────────────

/**
 * Turkish — dotted-i/dotless-ı + ç/ğ/ö/ş/ü.
 * Words that are DEFINITELY Turkish and DEFINITELY require a diacritic.
 * Case-insensitive word-boundary match.
 */
const TR_WRONG_WORDS = new Map([
  ['icin', 'için'],          ['sifre', 'şifre'],          ['giris', 'giriş'],
  ['kayit', 'kayıt'],        ['cikis', 'çıkış'],          ['degil', 'değil'],
  ['buyuk', 'büyük'],        ['basla', 'başla'],          ['baslar', 'başlar'],
  ['basladi', 'başladı'],    ['basarili', 'başarılı'],    ['basariyla', 'başarıyla'],
  ['guncel', 'güncel'],      ['guncelleme', 'güncelleme'],['acik', 'açık'],
  ['aciklama', 'açıklama'],  ['ogren', 'öğren'],          ['ogretmen', 'öğretmen'],
  ['dogru', 'doğru'],        ['dogrulama', 'doğrulama'],  ['kucuk', 'küçük'],
  ['onemli', 'önemli'],      ['uzerine', 'üzerine'],      ['yukle', 'yükle'],
  ['yukleme', 'yükleme'],    ['asagi', 'aşağı'],          ['uste', 'üste'],
  ['ustun', 'üstün'],        ['gecmis', 'geçmiş'],        ['yuzde', 'yüzde'],
  ['hakli', 'haklı'],        ['sartlar', 'şartlar'],      ['sifreniz', 'şifreniz'],
  ['donus', 'dönüş'],        ['siralama', 'sıralama'],    ['sirasi', 'sırası'],
  ['aylik', 'aylık'],        ['haftalik', 'haftalık'],    ['gunluk', 'günlük'],
  ['hesaplandi', 'hesaplandı'], ['hesaplanmis', 'hesaplanmış'],
  ['ardisik', 'ardışık'],    ['kazanc', 'kazanç'],        ['kazandi', 'kazandı'],
  ['onbellek', 'önbellek'],  ['goruntule', 'görüntüle'],  ['ayrinti', 'ayrıntı'],
  ['ayrintilari', 'ayrıntıları'], ['hatirla', 'hatırla'], ['hatirlat', 'hatırlat'],
  ['gonder', 'gönder'],      ['gonderim', 'gönderim'],    ['paylasim', 'paylaşım'],
  ['paylas', 'paylaş'],      ['cevrimdisi', 'çevrimdışı'],['yonetim', 'yönetim'],
  ['yonet', 'yönet'],        ['sectim', 'seçtim'],        ['tum', 'tüm'],
  ['tumu', 'tümü'],          ['yukarida', 'yukarıda'],    ['hosgeldin', 'hoşgeldin'],
  ['uye', 'üye'],            ['uyelik', 'üyelik'],        ['cogunluk', 'çoğunluk'],
  ['hesabin', 'hesabın'],    ['adin', 'adın'],            ['sifren', 'şifren'],
  ['sifreyi', 'şifreyi'],    ['maci', 'maçı'],            ['mac', 'maç'],
]);

/**
 * Spanish — á/é/í/ó/ú/ñ.
 */
const ES_WRONG_WORDS = new Map([
  ['dia', 'día'],                  ['dias', 'días'],
  ['sera', 'será'],                ['seran', 'serán'],
  ['facil', 'fácil'],              ['dificil', 'difícil'],
  ['unico', 'único'],              ['ultimo', 'último'],
  ['ultima', 'última'],            ['automatica', 'automática'],
  ['automatico', 'automático'],    ['publico', 'público'],
  ['categoria', 'categoría'],      ['accion', 'acción'],
  ['sesion', 'sesión'],            ['configuracion', 'configuración'],
  ['informacion', 'información'],  ['direccion', 'dirección'],
  ['eliminacion', 'eliminación'],  ['actualizacion', 'actualización'],
  ['telefono', 'teléfono'],        ['numero', 'número'],
  ['ano', 'año'],                  ['anos', 'años'],
  ['espanol', 'español'],          ['aqui', 'aquí'],
  ['alli', 'allí'],                ['tambien', 'también'],
  ['rapido', 'rápido'],            ['exito', 'éxito'],
  ['recuperate', 'recupérate'],    ['perdio', 'perdió'],
  ['gano', 'ganó'],                ['prediccion', 'predicción'],
  ['predicciones', 'predicciones'], // ASCII-only OK — placeholder, no match
  ['proxima', 'próxima'],          ['proximo', 'próximo'],
  ['mañana', 'mañana'],            ['manana', 'mañana'],
  ['atras', 'atrás'],
]);
// Remove entries that map to themselves (safe ASCII-only)
for (const [k, v] of ES_WRONG_WORDS) if (k === v) ES_WRONG_WORDS.delete(k);

/**
 * French — à/â/é/è/ê/ô/û/ç.
 */
const FR_WRONG_WORDS = new Map([
  ['deja', 'déjà'],                ['prefere', 'préfère'],
  ['different', 'différent'],      ['differente', 'différente'],
  ['derniere', 'dernière'],        ['chere', 'chère'],
  ['apres', 'après'],              ['tres', 'très'],
  ['systeme', 'système'],          ['probleme', 'problème'],
  ['meme', 'même'],                ['fenetre', 'fenêtre'],
  ['foret', 'forêt'],              ['hote', 'hôte'],
  ['ete', 'été'],                  ['francais', 'français'],
  ['reussi', 'réussi'],            ['reussir', 'réussir'],
  ['selectionne', 'sélectionné'],  ['completement', 'complètement'],
  ['immediatement', 'immédiatement'], ['prevision', 'prévision'],
  ['previsions', 'prévisions'],
  // Note: NOT flagging `pronostique` — it's a legitimate 2nd-person-singular
  // imperative ("Predict!"). Different from the past participle `pronostiqué`.
  ['cree', 'créé'],                ['reinitialise', 'réinitialisé'],
]);

/**
 * Portuguese — ã/õ/á/é/í/ó/ú/ç.
 */
const PT_WRONG_WORDS = new Map([
  ['nao', 'não'],                  ['informacao', 'informação'],
  ['sessao', 'sessão'],            ['previsao', 'previsão'],
  ['acao', 'ação'],                ['acoes', 'ações'],
  ['sao', 'são'],                  ['mes', 'mês'],
  ['facil', 'fácil'],              ['dificil', 'difícil'],
  ['unico', 'único'],              ['ultimo', 'último'],
  ['voce', 'você'],                ['vao', 'vão'],
  ['ja', 'já'],                    ['la', 'lá'],
  ['portugues', 'português'],      ['tambem', 'também'],
  ['atual', 'atual'],              ['atualizacao', 'atualização'],
  ['praticar', 'praticar'],        ['patria', 'pátria'],
  ['agua', 'água'],                ['historia', 'história'],
  ['pratica', 'prática'],          ['publico', 'público'],
  ['automatico', 'automático'],    ['basico', 'básico'],
  ['musica', 'música'],            ['rapido', 'rápido'],
  ['ate', 'até'],                  ['tres', 'três'],
  ['proximo', 'próximo'],          ['proxima', 'próxima'],
  ['e', 'é'],                      // 'e' (and) vs 'é' (is) — disambiguated by context
]);
// Remove self-map and the ambiguous 'e' (too many false positives)
for (const [k, v] of PT_WRONG_WORDS) if (k === v) PT_WRONG_WORDS.delete(k);
PT_WRONG_WORDS.delete('e');  // too ambiguous to flag — let review catch it

const DICTIONARIES = {
  en: new Map(),
  es: ES_WRONG_WORDS,
  fr: FR_WRONG_WORDS,
  tr: TR_WRONG_WORDS,
  pt: PT_WRONG_WORDS,
};

// ── Scanner ──────────────────────────────────────────────────────────────────

/**
 * Language picker labels at the top of the file (in LANGUAGE_OPTIONS)
 * must use native spelling. These specific 4 strings are the ones
 * users see in the language-switcher dialog.
 */
const PICKER_LABELS = [
  { wrong: "'Espanol'",   right: "'Español'"   },
  { wrong: "'Francais'",  right: "'Français'"  },
  { wrong: "'Turkce'",    right: "'Türkçe'"    },
  { wrong: "'Portugues'", right: "'Português'" },
];

function scan() {
  const raw = readFileSync(FILE, 'utf8');
  const lines = raw.split('\n');
  const sections = findSections(lines);

  const violations = [];

  // 1. Scan LANGUAGE_OPTIONS (lines 1 through the start of the first section)
  //    for picker-label regressions. These are exact-literal matches —
  //    the labels are always in single quotes on lines ~3-9.
  const firstSectionStart = sections.length > 0 ? sections[0].start : lines.length;
  for (let lineIdx = 0; lineIdx < firstSectionStart - 1; lineIdx++) {
    const line = lines[lineIdx];
    for (const { wrong, right } of PICKER_LABELS) {
      if (line.includes(wrong)) {
        violations.push({
          file: FILE,
          line: lineIdx + 1,
          lang: 'picker',
          wrong: wrong.replace(/'/g, ''),
          right: right.replace(/'/g, ''),
        });
      }
    }
  }

  for (const { code, start, end } of sections) {
    const dict = DICTIONARIES[code];
    if (!dict || dict.size === 0) continue;  // English or unknown

    // Build one giant regex for this language. Use Unicode-aware lookarounds
    // instead of `\b` because JS word boundaries only consider ASCII word
    // characters — they'd match "tres" inside "Paramètres" (the `è` isn't
    // a word char to `\b`, so a boundary is reported). `(?<![\p{L}\p{M}])`
    // and `(?![\p{L}\p{M}])` require no Unicode letter or combining mark
    // on either side, which correctly treats accented letters as part of
    // the word.
    const keys = [...dict.keys()].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(
      `(?<![\\p{L}\\p{M}])(${keys.join('|')})(?![\\p{L}\\p{M}])`,
      'giu',
    );

    for (let lineIdx = start - 1; lineIdx < end; lineIdx++) {
      const line = lines[lineIdx];
      // Only scan string literal contents — the quoted value after a colon.
      // Extract quoted substrings to avoid flagging identifiers/keys.
      const stringMatches = [...line.matchAll(/'([^'\\]|\\.)*'/g)];
      if (stringMatches.length === 0) continue;

      for (const { 0: literal } of stringMatches) {
        // Reset regex state
        pattern.lastIndex = 0;
        let m;
        while ((m = pattern.exec(literal)) !== null) {
          const wrong = m[1].toLowerCase();
          const right = dict.get(wrong);
          if (!right) continue;
          violations.push({ file: FILE, line: lineIdx + 1, lang: code, wrong: m[1], right });
        }
      }
    }
  }

  return violations;
}

// ── Report + exit ────────────────────────────────────────────────────────────

const violations = scan();

if (violations.length === 0) {
  console.log('[i18n:check] ✓ No diacritic regressions found across ES/FR/TR/PT.');
  process.exit(0);
}

console.error(`[i18n:check] ✗ Found ${violations.length} diacritic violation(s):\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.lang}]  "${v.wrong}" → should be "${v.right}"`);
}
console.error(`
Fix by replacing the ASCII word with its native-diacritic form listed above.
To run this check manually:  npm run i18n:check`);
process.exit(1);
