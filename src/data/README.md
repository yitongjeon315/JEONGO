# HSK vocabulary data

`hsk_official_ko.json` follows the official HSK 2.0 vocabulary levels from the
Chinese Tests Service Website's **HSK Vocabulary List (2015)**:

- Source: https://admin.chinesetest.cn/userfiles/file/HSK/HSK-2015.xlsx
- Level counts: 150 / 150 / 300 / 600 / 1,300 / 2,500 (5,000 total)

Pinyin and English dictionary definitions were cross-checked against the MIT
licensed `complete-hsk-vocabulary` and `hsk-vocabulary` projects. Korean
meanings were machine-translated from the selected English definitions, with
curated Korean entries in `hsk_vocabulary.json` taking precedence at runtime.
Machine translations should continue to receive editorial review before being
used as authoritative dictionary definitions.

- https://github.com/drkameleon/complete-hsk-vocabulary
- https://github.com/clem109/hsk-vocabulary
