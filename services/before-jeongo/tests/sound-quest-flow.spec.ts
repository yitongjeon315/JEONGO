import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    const voices = [{ lang: 'zh-CN', name: 'Microsoft Xiaoxiao', default: true, localService: true, voiceURI: 'zh-cn' }] as SpeechSynthesisVoice[];
    class FakeUtterance { voice: SpeechSynthesisVoice | null = null; lang = ''; rate = 1; pitch = 1; volume = 1; constructor(public text: string) {} }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: FakeUtterance });
    Object.defineProperty(window.speechSynthesis, 'getVoices', { configurable: true, value: () => voices });
    Object.defineProperty(window.speechSynthesis, 'cancel', { configurable: true, value: () => undefined });
    Object.defineProperty(window.speechSynthesis, 'resume', { configurable: true, value: () => undefined });
    Object.defineProperty(window.speechSynthesis, 'speak', { configurable: true, value: () => undefined });
  });
});

async function clearChoiceStage(page: Page, rounds: number, needsAudio: boolean) {
  for (let round = 0; round < rounds; round += 1) {
    if (needsAudio) await page.getByRole('button', { name: /성조 듣기|표현 듣기/ }).click();
    await page.locator('.bubble-options [data-correct="true"]').click();
    if (round < rounds - 1) await expect(page.locator('.game-heading>strong')).not.toHaveText(`${round + 1}/${rounds}`);
  }
  await expect(page.getByTestId('stage-clear')).toBeVisible();
}

test('beginner learns through five games and starts JEONGO at HSK 1 without a placement test', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('./');
  await expect(page.getByTestId('sound-quest-map')).toContainText('시험은 없어요');
  await page.getByRole('button', { name: /첫 게임 시작/ }).click();

  for (const card of await page.locator('.tone-lab-card').all()) {
    await card.getByRole('button', { name: /1번째 듣기/ }).click();
    await card.getByRole('button', { name: /2번째 듣기/ }).click();
    await card.getByRole('button', { name: /손으로 그리고 따라 말하기/ }).click();
  }
  await page.getByRole('button', { name: /성조 버블팝 열기/ }).click();
  await page.getByRole('button', { name: /다음 게임/ }).click();

  await clearChoiceStage(page, 12, true);
  await page.getByRole('button', { name: /다음 게임/ }).click();

  for (let round = 0; round < 10; round += 1) {
    await page.locator('[data-part="initial"][data-correct="true"]').click();
    await page.locator('[data-part="final"][data-correct="true"]').click();
    await page.getByRole('button', { name: /조립하기/ }).click();
    if (round < 9) await expect(page.locator('.game-heading>strong')).not.toHaveText(`${round + 1}/10`);
  }
  await expect(page.getByTestId('stage-clear')).toBeVisible();
  await page.getByRole('button', { name: /다음 게임/ }).click();

  await clearChoiceStage(page, 12, false);
  await page.getByRole('button', { name: /다음 게임/ }).click();
  await clearChoiceStage(page, 8, true);
  await page.getByRole('button', { name: /모험 완료/ }).click();

  await expect(page.getByTestId('sound-quest-complete')).toContainText('배치고사 없이 HSK 1부터');
  await expect(page.getByRole('link', { name: /JEONGO HSK 1 모험 시작/ })).toHaveAttribute('href', '/learn');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('jeongo_sound_quest_v2') ?? 'null'));
  expect(saved).toMatchObject({ unlocked: 5, completed: ['tone-lab', 'tone-catch', 'pinyin-forge', 'word-sprint', 'rhythm-run'] });
});

test('a missed sound is added back to the game deck', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('jeongo_sound_quest_v2', JSON.stringify({ xp: 0, unlocked: 2, stars: {}, completed: ['tone-lab'] }));
  });
  await page.goto('./');
  await page.getByRole('button', { name: /성조 버블팝/ }).click();
  await page.getByRole('button', { name: /성조 듣기/ }).click();
  await page.locator('.bubble-options [data-correct="false"]').first().click();
  await expect(page.getByText('한 번 더 들어보면 잡을 수 있어요!')).toBeVisible();
  await expect(page.getByText('한 번 더 들어보면 잡을 수 있어요!')).toBeHidden();
  await page.getByRole('button', { name: /성조 듣기/ }).click();
  await page.locator('.bubble-options [data-correct="true"]').click();
  await expect(page.locator('.game-heading>strong')).toHaveText('2/13');
});
