import collections
import json
import re
import openpyxl

def norm(value):
    return re.sub(r'（[^）]*）', '', value).replace('……', '').replace('…', '').strip()

raw = json.load(open(r'C:\JEONGO\src\data\hsk_1to6.json', encoding='utf-8'))
by_exact = collections.defaultdict(list)
by_norm = collections.defaultdict(list)
for item in raw:
    by_exact[item['hanzi']].append(item)
    by_norm[norm(item['hanzi'])].append(item)

sheet = openpyxl.load_workbook(r'C:\JEONGO\.tmp\HSK-2015.xlsx', read_only=True, data_only=True).active
missing = []
wrong_level = []
for level, word in sheet.iter_rows(min_row=2, values_only=True):
    if not level or not word:
        continue
    level = int(level)
    word = str(word).strip()
    candidates = by_exact[word] or by_norm[norm(word)]
    if not candidates:
        missing.append((level, word))
    elif not any(item['hsk'] == f'HSK {level}' for item in candidates):
        wrong_level.append((level, word, [(item['pinyin'], item['hsk']) for item in candidates]))

print('missing', len(missing), missing)
print('wrong_level', len(wrong_level), wrong_level[:100])
