import { NextRequest } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface RecipeOptions {
  mealType: string;
  time: string;
  difficulty: string;
  dietary: string[];
}

function buildPrompt(ingredients: string[], options: RecipeOptions): string {
  const parts: string[] = [];
  if (options.mealType) parts.push(`식사 유형: ${options.mealType}`);
  if (options.time) parts.push(`조리 시간: ${options.time}`);
  if (options.difficulty) parts.push(`난이도: ${options.difficulty}`);
  if (options.dietary.length > 0) parts.push(`식이 제한: ${options.dietary.join(", ")}`);

  const conditions = parts.length > 0 ? `\n조건: ${parts.join(" / ")}` : "";

  return `재료: ${ingredients.join(", ")}${conditions}
위 재료로 만들 수 있는 레시피 3개를 추천해줘.
반드시 아래 JSON 형식으로만 응답해. 코드블록이나 다른 텍스트 없이 순수 JSON만 반환해.
{"recipes":[{"name":"","time":"","difficulty":"","description":"","ingredients":[],"steps":[]}]}`;
}

async function callDeepSeek(
  ingredients: string[],
  options: RecipeOptions,
  apiKey: string,
  stream: boolean
): Promise<Response> {
  return fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat-v3-0324",
      messages: [
        {
          role: "system",
          content:
            "당신은 전문 요리사입니다. 반드시 순수 JSON만 반환하세요. 마크다운, 코드블록, 추가 설명을 절대 포함하지 마세요.",
        },
        { role: "user", content: buildPrompt(ingredients, options) },
      ],
      stream,
      max_tokens: 2500,
    }),
    signal: AbortSignal.timeout(60000),
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "여기에_API_키_입력") {
    return Response.json(
      { error: "API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  let body: { ingredients: string[]; options: RecipeOptions };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { ingredients, options } = body;
  if (!ingredients?.length) {
    return Response.json({ error: "재료 목록이 비어있습니다." }, { status: 400 });
  }

  // OpenRouter SSE 스트림을 클라이언트로 직접 포워딩
  const upstream = await callDeepSeek(ingredients, options, apiKey, true);

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({}));
    return Response.json(
      { error: err?.error?.message ?? "레시피 생성 API 오류" },
      { status: upstream.status }
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
