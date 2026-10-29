// Phonetic transcriptions (British English, IPA) for words used in Oral English questions.
// Shown next to each word after a student answers, so they can see and hear why.
export const IPA = {
  seat: 'siːt', sit: 'sɪt', feet: 'fiːt', set: 'set', sat: 'sæt',
  cup: 'kʌp', cop: 'kɒp', love: 'lʌv', cap: 'kæp', cope: 'kəʊp',
  photograph: 'ˈfəʊtəɡrɑːf', photographer: 'fəˈtɒɡrəfə', photographic: 'ˌfəʊtəˈɡræfɪk',
  present: 'prɪˈzent', 'present (noun)': 'ˈpreznt', 'present (verb)': 'prɪˈzent',
  thin: 'θɪn', this: 'ðɪs', think: 'θɪŋk', then: 'ðen', those: 'ðəʊz',
  bulb: 'bʌlb', climb: 'klaɪm', rib: 'rɪb', absent: 'ˈæbsənt',
  chemist: 'ˈkemɪst', church: 'tʃɜːtʃ', cake: 'keɪk', machine: 'məˈʃiːn', cheese: 'tʃiːz',
  blood: 'blʌd', food: 'fuːd', flood: 'flʌd', good: 'ɡʊd', mood: 'muːd',
  ship: 'ʃɪp', chip: 'tʃɪp', kit: 'kɪt', jam: 'dʒæm',
  education: 'ˌedʒuˈkeɪʃn', interpret: 'ɪnˈtɜːprɪt',
  bit: 'bɪt', boy: 'bɔɪ', bed: 'bed', bat: 'bæt',
};

// What each tricky sound is, for the little "sounds" key.
export const SOUND_NOTES = {
  'iː': 'long "ee" as in see', 'ɪ': 'short "i" as in sit', 'ʌ': 'short "u" as in cup', 'æ': '"a" as in cat', 'ɒ': 'short "o" as in hot',
  'əʊ': '"oh" as in go', 'ɔɪ': '"oy" as in boy', 'aɪ': '"eye" as in my', 'eɪ': '"ay" as in day', 'uː': 'long "oo" as in food', 'ʊ': 'short "oo" as in good', 'ɜː': '"er" as in bird',
  'θ': 'voiceless "th" as in thin', 'ð': 'voiced "th" as in this', 'ʃ': '"sh" as in ship', 'tʃ': '"ch" as in chip', 'dʒ': '"j" as in jam', 'ˈ': 'the next syllable is stressed',
};

// Turn an option or quoted word into a dictionary key ("PHOtograph" → "photograph").
export const ipaKey = (w) => String(w).trim().toLowerCase().replace(/[.,!?'"]/g, '');
export const ipaFor = (w) => IPA[ipaKey(w)] || null;

// Words quoted in the question ('seat', "cup") plus any single word in the question that has a transcription.
export function questionWords(q) {
  const quoted = [...q.question.matchAll(/['"‘“]([A-Za-z ]+?)['"’”]/g)].map((m) => m[1]);
  const named = q.question.match(/stress pattern for '([a-z]+)'/i)?.[1];
  const words = new Set([...quoted, ...(named ? [named] : [])].filter((w) => ipaFor(w)));
  if (/present/.test(q.question)) { words.delete('present'); words.add('present (verb)'); words.add('present (noun)'); }
  return [...words];
}
export function soundsIn(ipaList) {
  const all = ipaList.join(' ');
  return Object.entries(SOUND_NOTES).filter(([s]) => all.includes(s)).slice(0, 5);
}
