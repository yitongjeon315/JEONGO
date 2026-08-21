import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem('e2e-storage-cleared')) {
      window.localStorage.clear();
      window.sessionStorage.setItem('e2e-storage-cleared', 'true');
    }
  });
});

test('guest can learn, earn rewards, persist after reload, and update analytics', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: '게스트로 계속하기' }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.getByTestId('toggle-growth-simulation').click();
  await page.getByRole('button', { name: '힘 (STR / 어휘력) 증가' }).click();
  await expect(page.getByTestId('growth-simulation-panel')).toContainText('28 → 29');
  await page.getByTestId('apply-growth-simulation').click();
  await page.getByRole('link', { name: /던전/ }).click();
  await page.getByTestId('start-dungeon').click();

  await expect(page.getByTestId('vocab-option')).toHaveCount(3);
  const firstOptions = await page.getByTestId('vocab-option').allTextContents();
  expect(firstOptions).toHaveLength(3);
  expect(firstOptions.every((option) => /[가-힣]/.test(option))).toBe(true);

  for (let turn = 0; turn < 4; turn += 1) {
    await page.locator('[data-testid="vocab-option"][data-correct="true"]').click();
    if (turn === 2) await expect(page.getByText(/크리티컬!/)).toBeVisible();
    await page.getByTestId('next-turn').click();
  }

  await expect(page.getByTestId('dungeon-cleared')).toBeVisible();
  await expect(page.getByTestId('dungeon-cleared').getByText('1회', { exact: true })).toBeVisible();
  await page.goto('/home');
  await page.getByRole('button', { name: '일일 모험 미션' }).click();
  await expect(page.getByTestId('daily-quest-questions')).toContainText('4/10');
  await expect(page.getByTestId('daily-quest-dungeon')).toContainText('1/1');
  await page.getByTestId('claim-dungeon-reward').click();
  await expect(page.getByTitle('보상 수령 완료')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '일일 모험 미션' }).click();
  await expect(page.getByTestId('daily-quest-dungeon').getByTitle('보상 수령 완료')).toBeVisible();
  await page.goto('/analytics');
  await expect(page.getByTestId('analytics-page')).toContainText('학습 세션');
  await expect(page.getByTestId('analytics-page')).toContainText('1');
});

test('CMS rejects users without a server-issued admin role', async ({ page }) => {
  await page.goto('/admin/content');
  await expect(page.getByText('관리자 역할이 부여된 계정이 필요합니다.')).toBeVisible();
});

test('AI tutor compares an actual recognized sentence deterministically', async ({ page }) => {
  await page.goto('/ai-tutor');
  await page.getByRole('button', { name: '대화방 접속 및 롤플레이 시작' }).click();
  await page.getByLabel('발음 연습 문장 직접 입력').fill('我们两个人想要一个麻辣火锅');
  await page.getByRole('button', { name: '텍스트로 비교하기 · 보상 없음' }).click();

  await expect(page.getByText('100 점')).toBeVisible();
  await expect(page.getByTestId('recognized-speech')).toHaveText('我们两个人想要一个麻辣火锅');
  await expect(page.getByText('텍스트 대체 연습에는 XP와 골드가 지급되지 않습니다.')).toBeVisible();
});

test('AI tutor sends browser microphone recognition into the evaluator', async ({ page }) => {
  await page.addInitScript(() => {
    class FakeSpeechRecognition {
      lang = '';
      continuous = false;
      interimResults = false;
      onresult: ((event: { resultIndex: number; results: Array<{ 0: { transcript: string }; isFinal: boolean; length: number }> }) => void) | null = null;
      onerror: ((event: { error: string }) => void) | null = null;
      onend: (() => void) | null = null;
      start() {}
      abort() {}
      stop() {
        this.onresult?.({
          resultIndex: 0,
          results: [{ 0: { transcript: '我们两个人想要一个麻辣火锅' }, isFinal: true, length: 1 }],
        });
        this.onend?.();
      }
    }
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: FakeSpeechRecognition });
    Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, value: FakeSpeechRecognition });
  });

  await page.goto('/ai-tutor');
  await page.getByRole('button', { name: '대화방 접속 및 롤플레이 시작' }).click();
  await page.getByRole('button', { name: '중국어 말하기 시작' }).click();
  await page.getByRole('button', { name: /말하기 완료/ }).click();

  await expect(page.getByText('100 점')).toBeVisible();
  await expect(page.getByTestId('recognized-speech')).toHaveText('我们两个人想要一个麻辣火锅');
  await expect(page.getByText('실제 음성 인식 결과')).toBeVisible();
});

test('vocabulary language, pinyin layout, and study filters work together', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/vocab-book');
  await expect(page.getByRole('link', { name: '한국어 TOPIK 학습 서비스 열기' })).toHaveCount(0);
  const hsk6Button = page.getByRole('button', { name: 'HSK 6', exact: true });
  await expect(hsk6Button).toBeVisible();
  const hsk6Box = await hsk6Button.boundingBox();
  expect((hsk6Box?.x ?? 0) + (hsk6Box?.width ?? 0)).toBeLessThanOrEqual(375);
  await hsk6Button.click();
  await expect(page.getByTestId('filtered-vocab-count')).toHaveText('총 2500개의 단어');
  await page.getByRole('button', { name: '전체', exact: true }).click();
  await page.getByPlaceholder('한자, 병음, 한국어·영어 뜻 검색...').fill('我');

  const card = page.getByTestId('vocab-card').first();
  await expect(card.getByTestId('vocab-meaning')).toHaveText('나');
  const pinyinBox = await card.getByTestId('vocab-pinyin').boundingBox();
  const hanziBox = await card.getByTestId('vocab-hanzi').boundingBox();
  expect(pinyinBox?.y).toBeLessThan(hanziBox?.y ?? 0);

  const englishButton = page.getByTestId('meaning-language-en');
  await englishButton.click();
  await expect(englishButton).toHaveAttribute('aria-pressed', 'true');
  await expect(card.getByTestId('vocab-meaning')).toContainText(/I|me/);

  await page.getByPlaceholder('한자, 병음, 한국어·영어 뜻 검색...').fill('阿姨');
  await expect(page.getByTestId('vocab-card')).toHaveCount(1);
  const unlearnedCard = page.getByTestId('vocab-card');
  await unlearnedCard.getByTitle('학습 목록에 추가').click();
  await expect(unlearnedCard.getByTitle('학습 목록에서 제외')).toBeVisible();
  await expect(page.getByTestId('study-filter-learned')).toContainText('(1)');
  await page.getByPlaceholder('한자, 병음, 한국어·영어 뜻 검색...').fill('');
  await page.getByTestId('study-filter-learned').click();
  await expect(page.getByTestId('filtered-vocab-count')).toHaveText('총 1개의 단어');
  await expect(page.getByTestId('vocab-card')).toHaveCount(1);
  await page.getByTestId('study-filter-unlearned').click();
  await expect(page.getByTestId('filtered-vocab-count')).toHaveText('총 4999개의 단어');
  await expect(page.getByTestId('vocab-card')).toHaveCount(4);
  await page.getByTestId('study-filter-all').click();
  await expect(page.getByTestId('filtered-vocab-count')).toHaveText('총 5000개의 단어');
  await expect(page.getByTestId('vocab-card')).toHaveCount(4);
  await expect(page.getByRole('button', { name: '다음 페이지' })).toBeVisible();
  const pageLayout = await page.getByTestId('vocab-book-page').evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(pageLayout.scrollHeight).toBeLessThanOrEqual(pageLayout.clientHeight);

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByTestId('vocab-card')).toHaveCount(10);
  const desktopLayout = await page.getByTestId('vocab-book-page').evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(desktopLayout.scrollHeight).toBeLessThanOrEqual(desktopLayout.clientHeight);
});

test('HSK 5 vocabulary dungeon starts with Korean answer choices', async ({ page }) => {
  await page.goto('/learn');
  await page.getByRole('button', { name: /5급 중고급/ }).click();
  await page.getByTestId('start-dungeon').click();
  await expect(page.getByText('HSK 5', { exact: true })).toBeVisible();
  const options = await page.getByTestId('vocab-option').allTextContents();
  expect(options).toHaveLength(3);
  expect(options.every((option) => /[가-힣]/.test(option))).toBe(true);
});

test('TOPIK start link opens the bundled learning service', async ({ page }) => {
  await page.goto('/home');
  await page.getByRole('link', { name: '한국어 TOPIK 학습 서비스 열기' }).click();
  await expect(page).toHaveURL(/\/topic\/index\.html$/);
  await expect(page.getByRole('heading', { name: 'TOPIK II 3~6급 실전 아카데미' })).toBeVisible();
});

test('JEONGO exposes the independent BEFORE JEONGO app', async ({ page }) => {
  await page.goto('/home');
  await expect(page.getByRole('link', { name: 'BEFORE JEONGO 병음 입문 앱 열기' })).toHaveAttribute('href', 'http://localhost:3002');
});

test('new learner can complete onboarding and persist a placement result', async ({ page }) => {
  await page.goto('/onboarding');
  await page.getByRole('button', { name: '여행' }).click();
  await page.getByRole('button', { name: '30분' }).click();
  await page.getByRole('button', { name: '회화 마법사' }).click();
  await page.getByRole('button', { name: '설정 저장하고 정밀 진단 시작' }).click();
  await expect(page).toHaveURL(/\/placement$/);
  for (let question = 0; question < 30; question += 1) {
    await page.locator('[data-testid="placement-option"][data-correct="true"]').click();
    await page.getByTestId('placement-submit').click();
  }
  await page.getByRole('link', { name: '추천 단계로 시작' }).click();
  await expect(page).toHaveURL(/\/home$/);
  const placement = await page.evaluate(() => JSON.parse(localStorage.getItem('jeongo_placement') ?? 'null'));
  expect(placement).toMatchObject({ learningGoal: '여행', dailyMinutes: 30, characterClass: '회화 마법사', score: 100, totalQuestions: 30 });
});

test('adaptive placement advances through 30 base questions and saves detailed accuracy', async ({ page }) => {
  await page.goto('/placement');

  for (let question = 0; question < 30; question += 1) {
    await page.locator('[data-testid="placement-option"][data-correct="true"]').click();
    await page.getByTestId('placement-submit').click();
  }

  await expect(page.getByTestId('placement-result')).toContainText('권장 HSK 6');
  await expect(page.getByTestId('placement-result')).toContainText('총 30문항');
  const placement = await page.evaluate(() => JSON.parse(localStorage.getItem('jeongo_placement') ?? 'null'));
  expect(placement).toMatchObject({ level: 6, score: 100, totalQuestions: 30 });
  expect(placement.domainScores).toHaveLength(4);
  expect(placement.levelScores).toHaveLength(6);
});
