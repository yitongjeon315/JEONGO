import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    const voices = [
      { lang: 'ko-KR', name: 'Korean Default', default: true, localService: true, voiceURI: 'ko' },
      { lang: 'zh-TW', name: 'Taiwan Mandarin', default: false, localService: true, voiceURI: 'zh-tw' },
      { lang: 'zh-CN', name: 'Microsoft Xiaoxiao', default: false, localService: true, voiceURI: 'zh-cn' },
    ] as SpeechSynthesisVoice[];
    class FakeUtterance {
      voice: SpeechSynthesisVoice | null = null;
      lang = '';
      rate = 1;
      pitch = 1;
      volume = 1;
      constructor(public text: string) {}
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: FakeUtterance });
    Object.defineProperty(window.speechSynthesis, 'getVoices', { configurable: true, value: () => voices });
    Object.defineProperty(window.speechSynthesis, 'cancel', { configurable: true, value: () => undefined });
    Object.defineProperty(window.speechSynthesis, 'resume', { configurable: true, value: () => undefined });
    Object.defineProperty(window.speechSynthesis, 'speak', { configurable: true, value: () => undefined });
  });
});

test('absolute beginner can finish the bridge and return to JEONGO', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await expect(page.getByTestId('pinyin-start-page')).toContainText('중국어 소리 첫걸음');
  await page.getByRole('button', { name: /소리부터 시작하기/ }).click();
  for (const button of await page.getByTestId('tone-audio').all()) await button.click();
  await expect(page.getByText(/재생 음원: 표준 중국어 mā·má·mǎ·mà 검증 녹음/)).toBeVisible();
  await page.getByRole('button', { name: /병음 조립소 열기/ }).click();
  const pinyinParts = [['m', 'a'], ['n', 'i'], ['h', 'ao'], ['sh', 'i']];
  for (let round = 0; round < pinyinParts.length; round += 1) {
    await page.locator(`[data-testid="initial-choice"][data-value="${pinyinParts[round][0]}"]`).click();
    await page.locator(`[data-testid="final-choice"][data-value="${pinyinParts[round][1]}"]`).click();
    await page.getByTestId('assemble-pinyin').click();
    await expect(page.getByText(/^정답!/)).toBeVisible();
    if (round < pinyinParts.length - 1) await page.getByRole('button', { name: /다음 조립/ }).click();
  }
  await page.getByRole('button', { name: /단어 보물섬으로/ }).click();
  for (const button of await page.getByTestId('word-audio').all()) await button.click();
  await page.getByRole('button', { name: /확인 문제 풀기/ }).click();
  for (let question = 0; question < 4; question += 1) {
    await page.locator('[data-correct="true"]').click();
    await page.getByTestId('pinyin-quiz-submit').click();
  }
  await expect(page.getByTestId('pinyin-complete')).toContainText('이제 병음이 낯설지 않아요');
  await expect(page.getByRole('link', { name: /JEONGO 학습 준비 시작/ })).toHaveAttribute('href', 'http://localhost:3001/onboarding');
  const bridge = await page.evaluate(() => JSON.parse(localStorage.getItem('jeongo_pinyin_bridge_v1') ?? 'null'));
  expect(bridge).toMatchObject({ completed: true, score: 4, step: 5 });
});
