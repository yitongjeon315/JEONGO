import { readFile, writeFile } from 'node:fs/promises';

const official = JSON.parse(await readFile('C:/JEONGO/.tmp/hsk-official-rows.json', 'utf8'));
const raw = JSON.parse(await readFile('C:/JEONGO/src/data/hsk_1to6.json', 'utf8'));
const complete = JSON.parse(await readFile('C:/JEONGO/.tmp/complete-hsk.min.json', 'utf8'));
const cachePath = 'C:/JEONGO/.tmp/hsk-ko-translation-cache.json';
const cache = JSON.parse(await readFile(cachePath, 'utf8').catch(() => '{}'));
const curated = [];
for (let level = 1; level <= 6; level += 1) {
  const items = JSON.parse(await readFile(`C:/JEONGO/.tmp/hsk-curated/${level}.json`, 'utf8'));
  items.forEach((item) => curated.push({ ...item, sourceLevel: level }));
}

const normalize = (value) => value.replace(/（[^）]*）/g, '').replaceAll('……', '').replaceAll('…', '').trim();
const indexBy = (items, key) => {
  const result = new Map();
  items.forEach((item) => {
    const value = key(item);
    result.set(value, [...(result.get(value) ?? []), item]);
  });
  return result;
};
const curatedByWord = indexBy(curated, (item) => normalize(item.hanzi));
const rawByWord = indexBy(raw, (item) => normalize(item.hanzi));
const completeByWord = indexBy(complete, (item) => normalize(item.s));

const SPECIAL_SENSES = {
  '喂（叹词）': ['wèi', 'hello (when answering the phone)'],
  '长（形容词）': ['cháng', 'long; length'],
  '得（助词）': ['de', 'structural particle used after a verb or adjective'],
  '等（动词）': ['děng', 'to wait; to await'],
  '过（助词）': ['guo', 'aspect particle indicating past experience'],
  '还（副词）': ['hái', 'still; also; in addition'],
  '只（量词）': ['zhī', 'measure word for animals or one of a pair'],
  '花（名词）': ['huā', 'flower; blossom'],
  '花（动词）': ['huā', 'to spend; to expend'],
  '还（动词）': ['huán', 'to return; to pay back'],
  '长（动词）': ['zhǎng', 'to grow; to develop'],
  '种（量词）': ['zhǒng', 'kind; type; sort'],
  '得（助动词）': ['děi', 'must; to have to'],
  '等（助词）': ['děng', 'and so on; etc.'],
  '喂（动词）': ['wèi', 'to feed'],
};

const prepared = official.map((row) => {
  const displayWord = row.word.replace(/（[^）]*）/g, '').trim();
  if (SPECIAL_SENSES[row.word]) {
    const [pinyin, english] = SPECIAL_SENSES[row.word];
    return { ...row, displayWord, pinyin, english };
  }
  const key = normalize(row.word);
  const curatedCandidates = curatedByWord.get(key) ?? [];
  const curatedItem = curatedCandidates.find((item) => item.sourceLevel === row.level) ?? curatedCandidates[0];
  if (curatedItem) {
    const english = curatedItem.translations.filter((value) => !value.startsWith('CL:')).slice(0, 3).join('; ');
    return { ...row, displayWord, pinyin: curatedItem.pinyin, english };
  }
  const rawCandidates = rawByWord.get(key) ?? [];
  const rawItem = rawCandidates.find((item) => item.hsk === `HSK ${row.level}`) ?? rawCandidates[0];
  if (rawItem) return { ...row, displayWord, pinyin: rawItem.pinyin, english: rawItem.meaning };
  const completeItem = (completeByWord.get(key) ?? [])[0];
  if (completeItem) {
    const form = completeItem.f[0];
    return {
      ...row,
      displayWord,
      pinyin: form?.i?.y ?? '',
      english: (form?.m ?? []).slice(0, 3).join('; '),
    };
  }
  return { ...row, displayWord, pinyin: '', english: '' };
});

async function translateEnglishBatch(batch) {
  const input = batch.map((item) => item.english).join('\n');
  const query = new URLSearchParams({ client: 'gtx', sl: 'en', tl: 'ko', dt: 't', q: input });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${query}`);
  if (!response.ok) throw new Error(`TRANSLATION_${response.status}`);
  const payload = await response.json();
  const translated = payload[0].map((segment) => segment[0]).join('').trimEnd().split('\n');
  if (translated.length !== batch.length) throw new Error(`TRANSLATION_COUNT_${translated.length}_${batch.length}`);
  return translated;
}

const englishPending = prepared.filter((item) => item.english && !cache[item.english]);
for (let offset = 0; offset < englishPending.length; offset += 30) {
  const batch = englishPending.slice(offset, offset + 30);
  const translated = await translateEnglishBatch(batch);
  batch.forEach((item, index) => { cache[item.english] = translated[index].trim(); });
  if (offset % 300 === 0) console.log(`english ${Math.min(offset + batch.length, englishPending.length)}/${englishPending.length}`);
  await new Promise((resolve) => setTimeout(resolve, 80));
}

async function translateChinese(item) {
  const query = new URLSearchParams({ client: 'gtx', sl: 'zh-CN', tl: 'ko', dt: 't', q: item.displayWord });
  query.append('dt', 'rm');
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${query}`);
  if (!response.ok) throw new Error(`CHINESE_TRANSLATION_${response.status}`);
  const payload = await response.json();
  const segments = payload[0];
  const meaning = segments.filter((segment) => segment[0]).map((segment) => segment[0]).join('').trim();
  const romanization = [...segments].reverse().find((segment) => typeof segment[3] === 'string')?.[3] ?? '';
  return { meaning, pinyin: romanization.toLowerCase() };
}

const directPending = prepared.filter((item) => !item.english || !/[가-힣]/.test(cache[item.english] ?? ''));
for (let offset = 0; offset < directPending.length; offset += 6) {
  const batch = directPending.slice(offset, offset + 6);
  const results = await Promise.all(batch.map((item) => translateChinese(item)));
  batch.forEach((item, index) => { cache[`zh:${item.word}`] = results[index]; });
  if (offset % 60 === 0) console.log(`chinese ${Math.min(offset + batch.length, directPending.length)}/${directPending.length}`);
  await new Promise((resolve) => setTimeout(resolve, 80));
}

await writeFile(cachePath, JSON.stringify(cache, null, 2));
const output = prepared.map((item, index) => {
  const direct = cache[`zh:${item.word}`];
  const translatedEnglish = item.english ? cache[item.english] : '';
  return {
    id: index + 1,
    hanzi: item.displayWord,
    pinyin: item.pinyin || direct?.pinyin || '',
    meaning: /[가-힣]/.test(translatedEnglish ?? '') ? translatedEnglish : direct?.meaning,
    meaningEn: item.english || '',
    hsk: `HSK ${item.level}`,
    partOfSpeech: '미분류',
    exampleHanzi: '',
    examplePinyin: '',
    exampleMeaning: '',
    isLearned: false,
  };
});
await writeFile('C:/JEONGO/src/data/hsk_official_ko.json', `${JSON.stringify(output, null, 2)}\n`);
console.log(`wrote ${output.length} official words`);
