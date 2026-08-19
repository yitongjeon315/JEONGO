import { readFile, writeFile } from 'node:fs/promises';

const sourceDir = 'C:/JEONGO/.tmp/hsk-curated';
const cachePath = 'C:/JEONGO/.tmp/hsk-ko-translation-cache.json';
const outputPath = 'C:/JEONGO/src/data/hsk_official_ko.json';

const cache = JSON.parse(await readFile(cachePath, 'utf8').catch(() => '{}'));
const sourceItems = [];
for (let level = 1; level <= 6; level += 1) {
  const items = JSON.parse(await readFile(`${sourceDir}/${level}.json`, 'utf8'));
  for (const item of items) {
    const definitions = item.translations
      .filter((value) => !value.startsWith('CL:'))
      .slice(0, 3);
    sourceItems.push({
      level,
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      english: definitions.join('; ') || item.translations[0] || item.hanzi,
    });
  }
}

async function translateBatch(batch) {
  const input = batch.map((item) => item.english).join('\n');
  const query = new URLSearchParams({ client: 'gtx', sl: 'en', tl: 'ko', dt: 't', q: input });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${query}`);
  if (!response.ok) throw new Error(`TRANSLATION_${response.status}`);
  const payload = await response.json();
  const translated = payload[0].map((segment) => segment[0]).join('').trimEnd().split('\n');
  if (translated.length !== batch.length) throw new Error(`TRANSLATION_COUNT_${translated.length}_${batch.length}`);
  return translated;
}

const pending = sourceItems.filter((item) => !cache[item.english]);
for (let offset = 0; offset < pending.length; offset += 30) {
  const batch = pending.slice(offset, offset + 30);
  let translated;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      translated = await translateBatch(batch);
      break;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  batch.forEach((item, index) => { cache[item.english] = translated[index].trim(); });
  if (offset % 300 === 0) {
    await writeFile(cachePath, JSON.stringify(cache, null, 2));
    process.stdout.write(`translated ${Math.min(offset + batch.length, pending.length)}/${pending.length}\n`);
  }
  await new Promise((resolve) => setTimeout(resolve, 80));
}

await writeFile(cachePath, JSON.stringify(cache, null, 2));
const output = sourceItems.map((item, index) => ({
  id: index + 1,
  hanzi: item.hanzi,
  pinyin: item.pinyin,
  meaning: cache[item.english],
  meaningEn: item.english,
  hsk: `HSK ${item.level}`,
  partOfSpeech: '미분류',
  exampleHanzi: '',
  examplePinyin: '',
  exampleMeaning: '',
  isLearned: false,
}));
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`wrote ${output.length} words to ${outputPath}`);
