import collections
import json
import re
import openpyxl

def norm(value):
    return re.sub(r'（[^）]*）', '', value).replace('……', '').replace('…', '').strip()

sheet = openpyxl.load_workbook(r'C:\JEONGO\.tmp\HSK-2015.xlsx', read_only=True, data_only=True).active
official = collections.defaultdict(list)
for level, word in sheet.iter_rows(min_row=2, values_only=True):
    if level and word:
        official[int(level)].append(str(word).strip())

for level in range(1, 7):
    curated = json.load(open(fr'C:\JEONGO\.tmp\hsk-curated\{level}.json', encoding='utf-8'))
    official_set = {norm(word) for word in official[level]}
    curated_set = {norm(item['hanzi']) for item in curated}
    print(f'L{level} official={len(official[level])} curated={len(curated)}')
    print('missing', [(word, norm(word)) for word in official[level] if norm(word) not in curated_set])
    print('extra', [item['hanzi'] for item in curated if norm(item['hanzi']) not in official_set])
