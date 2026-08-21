export type StageId = 'tone-lab' | 'tone-catch' | 'pinyin-forge' | 'word-sprint' | 'rhythm-run';

export interface StageDefinition {
  id: StageId;
  number: string;
  icon: string;
  title: string;
  description: string;
  mission: string;
  color: string;
}

export interface ToneLesson {
  id: string;
  toneIndex: number;
  pinyin: string;
  hanzi: string;
  label: string;
  gesture: string;
  hint: string;
  meaning: string;
}

export interface ChoiceRound {
  id: string;
  prompt: string;
  answer: string;
  options: string[];
  audioText?: string;
  audioClip?: string;
  toneIndex?: number;
  reveal?: string;
}

export interface PinyinRound {
  id: string;
  hanzi: string;
  korean: string;
  audioText: string;
  pinyin: string;
  toneRecordingIndex?: number;
  audioClip?: string;
  initial: string;
  final: string;
  tone: string;
  initialOptions: string[];
  finalOptions: string[];
  hint: string;
}

export const stages: StageDefinition[] = [
  { id: 'tone-lab', number: '01', icon: '🎧', title: '성조 DJ 부스', description: '네 성조를 듣고 몸으로 따라 해요', mission: '8번 듣기 · 4번 따라 말하기', color: 'cyan' },
  { id: 'tone-catch', number: '02', icon: '🫧', title: '성조 버블팝', description: '들리는 성조 버블을 빠르게 터뜨려요', mission: '12라운드 + 틀린 소리 재등장', color: 'violet' },
  { id: 'pinyin-forge', number: '03', icon: '🧩', title: '병음 조립 공장', description: '성모와 운모 블록을 붙여 소리를 만들어요', mission: '핵심 병음 10개 조립', color: 'lime' },
  { id: 'word-sprint', number: '04', icon: '🚀', title: '첫 단어 스프린트', description: '그림·뜻·소리를 병음과 연결해요', mission: '생활 단어 12개 수집', color: 'orange' },
  { id: 'rhythm-run', number: '05', icon: '🎵', title: '성조 리듬런', description: '두 음절의 리듬과 성조 변화를 익혀요', mission: '짧은 표현 8개 듣기', color: 'rose' },
];

export const toneLessons: ToneLesson[] = [
  { id: 'tone-1', toneIndex: 0, pinyin: 'mā', hanzi: '妈', label: '1성', gesture: '—', hint: '높고 평평하게', meaning: '엄마' },
  { id: 'tone-2', toneIndex: 1, pinyin: 'má', hanzi: '麻', label: '2성', gesture: '↗', hint: '질문하듯 위로', meaning: '삼베' },
  { id: 'tone-3', toneIndex: 2, pinyin: 'mǎ', hanzi: '马', label: '3성', gesture: '↘↗', hint: '낮췄다가 살짝 위로', meaning: '말' },
  { id: 'tone-4', toneIndex: 3, pinyin: 'mà', hanzi: '骂', label: '4성', gesture: '↘', hint: '짧고 힘차게 아래로', meaning: '꾸짖다' },
];

export const toneCatchRounds: ChoiceRound[] = [
  { id: 'tc-1', prompt: '높고 평평한 소리를 잡아요', answer: '1성 —', options: ['1성 —', '2성 ↗', '3성 ↘↗', '4성 ↘'], toneIndex: 0, reveal: 'mā · 높이를 그대로 유지해요' },
  { id: 'tc-2', prompt: '위로 올라가는 소리를 잡아요', answer: '2성 ↗', options: ['3성 ↘↗', '2성 ↗', '4성 ↘', '1성 —'], toneIndex: 1, reveal: 'má · “네?” 하고 되묻는 느낌이에요' },
  { id: 'tc-3', prompt: '낮아졌다 올라오는 소리를 잡아요', answer: '3성 ↘↗', options: ['4성 ↘', '1성 —', '3성 ↘↗', '2성 ↗'], toneIndex: 2, reveal: 'mǎ · 낮은 지점을 꼭 지나가요' },
  { id: 'tc-4', prompt: '짧고 강하게 떨어지는 소리를 잡아요', answer: '4성 ↘', options: ['2성 ↗', '3성 ↘↗', '1성 —', '4성 ↘'], toneIndex: 3, reveal: 'mà · 명령하듯 짧게 내려요' },
  { id: 'tc-5', prompt: '다시 들어도 3성을 찾을 수 있나요?', answer: '3성 ↘↗', options: ['3성 ↘↗', '1성 —', '4성 ↘', '2성 ↗'], toneIndex: 2, reveal: 'mǎ · 낮고 길게 들리는 것이 핵심이에요' },
  { id: 'tc-6', prompt: '이번에는 소리만 믿고 골라요', answer: '4성 ↘', options: ['1성 —', '4성 ↘', '2성 ↗', '3성 ↘↗'], toneIndex: 3, reveal: 'mà · 가장 빠르게 떨어져요' },
  { id: 'tc-7', prompt: '같은 높이를 지키는 성조는?', answer: '1성 —', options: ['2성 ↗', '4성 ↘', '1성 —', '3성 ↘↗'], toneIndex: 0, reveal: 'mā · 노래의 긴 한 음처럼 유지해요' },
  { id: 'tc-8', prompt: '끝이 위를 향하는 성조는?', answer: '2성 ↗', options: ['4성 ↘', '3성 ↘↗', '2성 ↗', '1성 —'], toneIndex: 1, reveal: 'má · 시작보다 끝이 높아요' },
  { id: 'tc-9', prompt: '짧은 낙하 소리를 골라요', answer: '4성 ↘', options: ['4성 ↘', '2성 ↗', '3성 ↘↗', '1성 —'], toneIndex: 3, reveal: 'mà · 힘 있게 끊어 주세요' },
  { id: 'tc-10', prompt: '골짜기를 그리는 성조는?', answer: '3성 ↘↗', options: ['2성 ↗', '1성 —', '4성 ↘', '3성 ↘↗'], toneIndex: 2, reveal: 'mǎ · 먼저 낮추는 것이 더 중요해요' },
  { id: 'tc-11', prompt: '평평한 선을 떠올리며 골라요', answer: '1성 —', options: ['3성 ↘↗', '1성 —', '2성 ↗', '4성 ↘'], toneIndex: 0, reveal: 'mā · 흔들리지 않으면 성공이에요' },
  { id: 'tc-12', prompt: '질문하는 느낌의 성조는?', answer: '2성 ↗', options: ['1성 —', '3성 ↘↗', '4성 ↘', '2성 ↗'], toneIndex: 1, reveal: 'má · 자연스럽게 위로 올려요' },
];

export const pinyinRounds: PinyinRound[] = [
  { id: 'pf-1', hanzi: '妈', korean: '엄마', audioText: '妈', pinyin: 'mā', toneRecordingIndex: 0, initial: 'm', final: 'a', tone: '1성', initialOptions: ['m', 'n', 'b'], finalOptions: ['ao', 'a', 'i'], hint: '입술을 닫았다 열며 m + 크게 a' },
  { id: 'pf-2', hanzi: '爸', korean: '아빠', audioText: '爸', audioClip: 'pf-2', pinyin: 'bà', initial: 'b', final: 'a', tone: '4성', initialOptions: ['p', 'b', 'm'], finalOptions: ['a', 'o', 'ai'], hint: '입술을 붙였다 가볍게 b + a' },
  { id: 'pf-3', hanzi: '你', korean: '너', audioText: '你', audioClip: 'pf-3', pinyin: 'nǐ', initial: 'n', final: 'i', tone: '3성', initialOptions: ['l', 'm', 'n'], finalOptions: ['u', 'i', 'a'], hint: '혀끝 n + 입꼬리를 당겨 i' },
  { id: 'pf-4', hanzi: '好', korean: '좋다', audioText: '好', audioClip: 'pf-4', pinyin: 'hǎo', initial: 'h', final: 'ao', tone: '3성', initialOptions: ['h', 'f', 'x'], finalOptions: ['ou', 'ai', 'ao'], hint: '목에서 h + a에서 o로 움직이는 ao' },
  { id: 'pf-5', hanzi: '我', korean: '나', audioText: '我', audioClip: 'pf-5', pinyin: 'wǒ', initial: 'w', final: 'o', tone: '3성', initialOptions: ['y', 'r', 'w'], finalOptions: ['e', 'o', 'u'], hint: '입술을 둥글게 w + o' },
  { id: 'pf-6', hanzi: '是', korean: '~이다', audioText: '是', audioClip: 'pf-6', pinyin: 'shì', initial: 'sh', final: 'i', tone: '4성', initialOptions: ['s', 'x', 'sh'], finalOptions: ['i', 'u', 'e'], hint: '혀끝을 살짝 말아 sh + 짧은 i' },
  { id: 'pf-7', hanzi: '中', korean: '가운데·중국', audioText: '中', audioClip: 'pf-7', pinyin: 'zhōng', initial: 'zh', final: 'ong', tone: '1성', initialOptions: ['j', 'zh', 'z'], finalOptions: ['ang', 'ong', 'eng'], hint: '혀를 말아 zh + 코로 울리는 ong' },
  { id: 'pf-8', hanzi: '学', korean: '배우다', audioText: '学', audioClip: 'pf-8', pinyin: 'xué', initial: 'x', final: 'ue', tone: '2성', initialOptions: ['q', 'x', 'sh'], finalOptions: ['ie', 'ue', 'uo'], hint: '입꼬리를 당긴 부드러운 x + üe' },
  { id: 'pf-9', hanzi: '请', korean: '청하다·부탁', audioText: '请', audioClip: 'pf-9', pinyin: 'qǐng', initial: 'q', final: 'ing', tone: '3성', initialOptions: ['q', 'ch', 'j'], finalOptions: ['in', 'ing', 'ong'], hint: '공기가 나는 q + 코로 끝나는 ing' },
  { id: 'pf-10', hanzi: '家', korean: '집', audioText: '家', audioClip: 'pf-10', pinyin: 'jiā', initial: 'j', final: 'ia', tone: '1성', initialOptions: ['zh', 'q', 'j'], finalOptions: ['iao', 'ia', 'ie'], hint: '혀를 앞쪽에 둔 j + 빠르게 ia' },
];

export const wordRounds: ChoiceRound[] = [
  { id: 'ws-1', prompt: '你 · “너, 당신”의 병음은?', answer: 'nǐ', options: ['nǐ', 'ní', 'lǐ'], audioText: '你', audioClip: 'ws-1', reveal: 'n + i + 3성 = nǐ' },
  { id: 'ws-2', prompt: '好 · “좋다”의 병음은?', answer: 'hǎo', options: ['hào', 'hǎo', 'háo'], audioText: '好', audioClip: 'ws-2', reveal: 'h + ao + 3성 = hǎo' },
  { id: 'ws-3', prompt: '我 · “나”의 병음은?', answer: 'wǒ', options: ['wō', 'wó', 'wǒ'], audioText: '我', audioClip: 'ws-3', reveal: 'w + o + 3성 = wǒ' },
  { id: 'ws-4', prompt: '是 · “~이다”의 병음은?', answer: 'shì', options: ['shì', 'sì', 'xì'], audioText: '是', audioClip: 'ws-4', reveal: 'sh + i + 4성 = shì' },
  { id: 'ws-5', prompt: '不 · “아니다”의 병음은?', answer: 'bù', options: ['pù', 'bú', 'bù'], audioText: '不', audioClip: 'ws-5', reveal: 'b + u + 4성 = bù' },
  { id: 'ws-6', prompt: '人 · “사람”의 병음은?', answer: 'rén', options: ['rén', 'rěn', 'rèng'], audioText: '人', audioClip: 'ws-6', reveal: 'r + en + 2성 = rén' },
  { id: 'ws-7', prompt: '水 · “물”의 병음은?', answer: 'shuǐ', options: ['suǐ', 'shuì', 'shuǐ'], audioText: '水', audioClip: 'ws-7', reveal: 'sh + ui + 3성 = shuǐ' },
  { id: 'ws-8', prompt: '茶 · “차”의 병음은?', answer: 'chá', options: ['chā', 'chá', 'zhá'], audioText: '茶', audioClip: 'ws-8', reveal: 'ch + a + 2성 = chá' },
  { id: 'ws-9', prompt: '妈妈 · “엄마”의 병음은?', answer: 'māma', options: ['māma', 'mǎma', 'màmā'], audioText: '妈妈', audioClip: 'ws-9', reveal: '두 번째 ma는 가볍게 읽어요' },
  { id: 'ws-10', prompt: '朋友 · “친구”의 병음은?', answer: 'péngyou', options: ['pèngyǒu', 'péngyou', 'pěngyóu'], audioText: '朋友', audioClip: 'ws-10', reveal: 'péng + 가벼운 you' },
  { id: 'ws-11', prompt: '中国 · “중국”의 병음은?', answer: 'Zhōngguó', options: ['Zhòngguǒ', 'Zōngguó', 'Zhōngguó'], audioText: '中国', audioClip: 'ws-11', reveal: 'Zhōng 1성 + guó 2성' },
  { id: 'ws-12', prompt: '学习 · “공부하다”의 병음은?', answer: 'xuéxí', options: ['xuéxí', 'xuěxǐ', 'shuéxí'], audioText: '学习', audioClip: 'ws-12', reveal: 'xué 2성 + xí 2성' },
];

export const rhythmRounds: ChoiceRound[] = [
  { id: 'rr-1', prompt: '인사말 “안녕하세요”를 찾아요', answer: '你好 · ní hǎo', options: ['你好 · ní hǎo', '你是 · nǐ shì', '我好 · wǒ hǎo'], audioText: '你好', audioClip: 'rr-1', reveal: '3성+3성은 앞의 3성이 2성처럼 올라가요' },
  { id: 'rr-2', prompt: '“나는 ~입니다”를 찾아요', answer: '我是 · wǒ shì', options: ['你是 · nǐ shì', '我是 · wǒ shì', '不是 · bú shì'], audioText: '我是', audioClip: 'rr-2', reveal: 'wǒ는 낮게, shì는 짧게 내려요' },
  { id: 'rr-3', prompt: '“아닙니다”를 찾아요', answer: '不是 · bú shì', options: ['不是 · bú shì', '好吃 · hǎochī', '谢谢 · xièxie'], audioText: '不是', audioClip: 'rr-3', reveal: '不 뒤에 4성이 오면 bú(2성)로 바뀌어요' },
  { id: 'rr-4', prompt: '“감사합니다”를 찾아요', answer: '谢谢 · xièxie', options: ['再见 · zàijiàn', '你好 · ní hǎo', '谢谢 · xièxie'], audioText: '谢谢', audioClip: 'rr-4', reveal: '첫 음절은 4성, 둘째는 가볍게 읽어요' },
  { id: 'rr-5', prompt: '“안녕히 가세요”를 찾아요', answer: '再见 · zàijiàn', options: ['再见 · zàijiàn', '中国 · Zhōngguó', '朋友 · péngyou'], audioText: '再见', audioClip: 'rr-5', reveal: '4성이 연속되어도 각각 또렷하게 내려요' },
  { id: 'rr-6', prompt: '“중국인”을 찾아요', answer: '中国人 · Zhōngguó rén', options: ['中国话 · Zhōngguóhuà', '中国人 · Zhōngguó rén', '一个人 · yí ge rén'], audioText: '中国人', audioClip: 'rr-6', reveal: '1성 → 2성 → 2성의 계단 리듬이에요' },
  { id: 'rr-7', prompt: '“한 사람”을 찾아요', answer: '一个人 · yí ge rén', options: ['一个人 · yí ge rén', '这个人 · zhège rén', '两个人 · liǎng ge rén'], audioText: '一个人', audioClip: 'rr-7', reveal: '一 뒤에 4성이 오면 yí(2성)로 읽어요' },
  { id: 'rr-8', prompt: '“아주 좋아요”를 찾아요', answer: '很好 · hěn hǎo', options: ['不好 · bù hǎo', '好人 · hǎo rén', '很好 · hěn hǎo'], audioText: '很好', audioClip: 'rr-8', reveal: '연속 3성에서는 실제 말의 높이가 자연스럽게 변해요' },
];
