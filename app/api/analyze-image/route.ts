import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "여기에_API_키_입력") {
    return NextResponse.json(
      { error: "API 키가 설정되지 않았습니다. .env.local을 확인해주세요." },
      { status: 500 }
    );
  }

  let body: { image: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { image } = body;
  if (!image) {
    return NextResponse.json({ error: "이미지 데이터가 없습니다." }, { status: 400 });
  }

  const prompt = `이 냉장고(또는 식품) 사진에서 보이는 식재료를 모두 찾아줘.
반드시 아래 JSON 형식으로만 응답해. 다른 텍스트는 절대 포함하지 마.
{"ingredients": ["재료1", "재료2", "재료3"]}`;

  const openRouterPayload = {
    model: "google/gemma-3-27b-it",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: image } },
        ],
      },
    ],
    max_tokens: 512,
  };

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
      },
      body: JSON.stringify(openRouterPayload),
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message ?? "OpenRouter API 오류";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const rawText: string = data.choices?.[0]?.message?.content ?? "";

    // JSON 블록 추출 (마크다운 코드블록 대응)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "모델 응답에서 JSON을 파싱할 수 없습니다.", raw: rawText },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const ingredients: string[] = Array.isArray(parsed.ingredients)
      ? parsed.ingredients.map((i: unknown) => String(i).trim()).filter(Boolean)
      : [];

    return NextResponse.json({ ingredients });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
