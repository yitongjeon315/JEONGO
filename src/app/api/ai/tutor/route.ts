import { fallbackTutorReply, normalizeTutorHistory, parseTutorReply } from '@/lib/ai-tutor';
import { isSameOriginRequest, jsonError } from '@/lib/server/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OpenAIResponse {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}

function extractOutputText(response: OpenAIResponse) {
  if (response.output_text) return response.output_text;
  return response.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === 'output_text' && item.text)?.text;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError('허용되지 않은 요청입니다.', 403);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError('요청 형식이 올바르지 않습니다.', 400);
  }

  const scenario = typeof body.scenario === 'string' ? body.scenario.trim().slice(0, 100) : '';
  const tutorName = typeof body.tutorName === 'string' ? body.tutorName.trim().slice(0, 40) : 'AI 튜터';
  const personality = typeof body.personality === 'string' ? body.personality.trim().slice(0, 100) : '친절함';
  const userText = typeof body.userText === 'string' ? body.userText.trim().slice(0, 500) : '';
  const history = normalizeTutorHistory(body.history);
  if (!scenario || !userText) return jsonError('시나리오와 학습자 문장이 필요합니다.', 400);

  const fallback = fallbackTutorReply(scenario, userText);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ reply: fallback });

  try {
    const input = history.map((message) => `${message.sender === 'ai' ? '튜터' : '학습자'}: ${message.text}`).join('\n');
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-5.6-luna',
        instructions: `당신은 중국어 회화 교사 ${tutorName}입니다. 성격은 ${personality}이고 현재 상황은 ${scenario}입니다. 학습자의 수준에 맞는 자연스러운 보통화로 최대 2문장만 답하고 짧은 한국어 번역을 제공하세요. 반드시 {"text":"중국어","translation":"한국어"} JSON만 출력하세요.`,
        input: `${input}\n학습자: ${userText}`,
        max_output_tokens: 220,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`OPENAI_${response.status}`);
    const payload = (await response.json()) as OpenAIResponse;
    const rawText = extractOutputText(payload);
    if (!rawText) throw new Error('OPENAI_EMPTY');
    const parsed = parseTutorReply(JSON.parse(rawText.replace(/^```json\s*|\s*```$/g, '')));
    if (!parsed) throw new Error('OPENAI_INVALID');
    return Response.json({ reply: { ...parsed, source: 'openai' as const } });
  } catch (error) {
    console.error('AI tutor response failed', error);
    return Response.json({ reply: fallback, degraded: true });
  }
}
