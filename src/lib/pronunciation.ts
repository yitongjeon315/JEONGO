export interface PronunciationWordScore {
  word: string;
  status: 'ok' | 'bad';
  reason?: string;
}

export interface PronunciationCorrection {
  type: 'missing' | 'extra' | 'replace';
  expected?: string;
  actual?: string;
}

export interface PronunciationEvaluation {
  score: number;
  normalizedTarget: string;
  normalizedTranscript: string;
  matchedCharacters: number;
  targetCharacters: number;
  transcriptCharacters: number;
  corrections: PronunciationCorrection[];
  wordScores: PronunciationWordScore[];
}

export function normalizeSpeechText(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

function alignCharacters(target: string, transcript: string) {
  const expected = Array.from(target);
  const actual = Array.from(transcript);
  const distances = Array.from({ length: expected.length + 1 }, () =>
    new Array(actual.length + 1).fill(0) as number[],
  );

  for (let row = 0; row <= expected.length; row += 1) distances[row][0] = row;
  for (let column = 0; column <= actual.length; column += 1) distances[0][column] = column;

  for (let row = 1; row <= expected.length; row += 1) {
    for (let column = 1; column <= actual.length; column += 1) {
      const substitutionCost = expected[row - 1] === actual[column - 1] ? 0 : 1;
      distances[row][column] = Math.min(
        distances[row - 1][column] + 1,
        distances[row][column - 1] + 1,
        distances[row - 1][column - 1] + substitutionCost,
      );
    }
  }

  const corrections: PronunciationCorrection[] = [];
  let matchedCharacters = 0;
  let row = expected.length;
  let column = actual.length;

  while (row > 0 || column > 0) {
    if (row > 0 && column > 0 && expected[row - 1] === actual[column - 1]) {
      matchedCharacters += 1;
      row -= 1;
      column -= 1;
    } else if (row > 0 && column > 0 && distances[row][column] === distances[row - 1][column - 1] + 1) {
      corrections.push({ type: 'replace', expected: expected[row - 1], actual: actual[column - 1] });
      row -= 1;
      column -= 1;
    } else if (row > 0 && distances[row][column] === distances[row - 1][column] + 1) {
      corrections.push({ type: 'missing', expected: expected[row - 1] });
      row -= 1;
    } else {
      corrections.push({ type: 'extra', actual: actual[column - 1] });
      column -= 1;
    }
  }

  return {
    corrections: corrections.reverse(),
    matchedCharacters,
    editDistance: distances[expected.length][actual.length],
    targetCharacters: expected.length,
    transcriptCharacters: actual.length,
  };
}

export function evaluatePronunciation(target: string, transcript: string, keywords: string[]): PronunciationEvaluation {
  const normalizedTarget = normalizeSpeechText(target);
  const normalizedTranscript = normalizeSpeechText(transcript);
  const alignment = alignCharacters(normalizedTarget, normalizedTranscript);
  const comparisonLength = Math.max(alignment.targetCharacters, alignment.transcriptCharacters, 1);
  const similarity = Math.max(0, 1 - alignment.editDistance / comparisonLength);

  return {
    score: Math.round(similarity * 100),
    normalizedTarget,
    normalizedTranscript,
    matchedCharacters: alignment.matchedCharacters,
    targetCharacters: alignment.targetCharacters,
    transcriptCharacters: alignment.transcriptCharacters,
    corrections: alignment.corrections,
    wordScores: keywords.map((word) => {
      const matched = normalizedTranscript.includes(normalizeSpeechText(word));
      return matched
        ? { word, status: 'ok' as const }
        : { word, status: 'bad' as const, reason: `입력 결과에서 “${word}”을 정확히 확인하지 못했습니다.` };
    }),
  };
}
