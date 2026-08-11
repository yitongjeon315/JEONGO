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
  await expect(page.getByText('MySQL에서 관리자 역할이 부여된 계정이 필요합니다.')).toBeVisible();
});

test('vocabulary language, pinyin layout, and study filters work together', async ({ page }) => {
  await page.goto('/vocab-book');
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
  await expect(page.getByTestId('study-filter-learned')).toContainText('(60)');
  await page.getByPlaceholder('한자, 병음, 한국어·영어 뜻 검색...').fill('');
  await page.getByTestId('study-filter-learned').click();
  await expect(page.getByTestId('filtered-vocab-count')).toHaveText('총 60개의 단어');
  await expect(page.getByTestId('vocab-card')).toHaveCount(12);
  await page.getByTestId('study-filter-unlearned').click();
  await expect(page.getByTestId('filtered-vocab-count')).toHaveText('총 7359개의 단어');
  await expect(page.getByTestId('vocab-card')).toHaveCount(12);
  await page.getByTestId('study-filter-all').click();
  await expect(page.getByTestId('filtered-vocab-count')).toHaveText('총 7419개의 단어');
  await expect(page.getByTestId('vocab-card')).toHaveCount(12);
});
