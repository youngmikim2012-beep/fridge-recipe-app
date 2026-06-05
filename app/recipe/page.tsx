"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import RecipeOptions, { OptionsState } from "@/components/RecipeOptions";
import RecipeCard, { Recipe } from "@/components/RecipeCard";
import AuthModal from "@/components/AuthModal";
import Toast from "@/components/Toast";

type Stage = "options" | "loading" | "result" | "error";

const DEFAULT_OPTIONS: OptionsState = {
  mealType: "",
  time: "",
  difficulty: "",
  dietary: [],
};

function parseIngredients(raw: string): string[] {
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return [];
  }
}

// SSE 스트림을 읽어 델타 텍스트를 누적 반환
async function readStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (accumulated: string) => void
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const delta: string = parsed.choices?.[0]?.delta?.content ?? "";
        accumulated += delta;
        onChunk(accumulated);
      } catch {
        // 불완전한 JSON 청크는 무시
      }
    }
  }
  return accumulated;
}

function extractRecipes(raw: string): Recipe[] | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed.recipes)) return parsed.recipes;
  } catch {
    // 파싱 실패
  }
  return null;
}

function RecipePage() {
  const searchParams = useSearchParams();
  const ingredients = parseIngredients(searchParams.get("ingredients") ?? "[]");
  const { data: session } = useSession();

  const [stage, setStage] = useState<Stage>("options");
  const [options, setOptions] = useState<OptionsState>(DEFAULT_OPTIONS);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState("");
  const [streamText, setStreamText] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [pendingSave, setPendingSave] = useState<{ recipe: Recipe; index: number } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  if (ingredients.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-4">재료 정보가 없습니다.</p>
          <Link href="/" className="text-emerald-600 font-medium hover:underline">
            ← Step 1로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  async function generate(attempt = 0) {
    setStage("loading");
    setStreamText("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, options }),
      });

      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.error ?? "레시피 생성 실패");
        setStage("error");
        return;
      }

      const accumulated = await readStream(res.body!, (text) => {
        setStreamText(text);
      });

      const parsed = extractRecipes(accumulated);
      if (!parsed) {
        if (attempt < 2) {
          setRetryCount(attempt + 1);
          generate(attempt + 1);
          return;
        }
        setErrorMsg("레시피 JSON 파싱에 실패했습니다. 다시 시도해주세요.");
        setStage("error");
        return;
      }

      setRecipes(parsed);
      setSavedIds(new Set());
      setStage("result");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "네트워크 오류");
      setStage("error");
    }
  }

  async function handleSave(recipe: Recipe, index: number) {
    if (!session) {
      setPendingSave({ recipe, index });
      setShowAuthModal(true);
      return;
    }
    await doSave(recipe, index);
  }

  async function doSave(recipe: Recipe, index: number) {
    setSavingIds((prev) => new Set(prev).add(index));
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe }),
    });
    setSavingIds((prev) => { const n = new Set(prev); n.delete(index); return n; });
    if (res.ok) {
      setSavedIds((prev) => new Set(prev).add(index));
      setToast({ msg: "레시피가 저장됐습니다!", type: "success" });
    } else {
      const data = await res.json();
      setToast({ msg: data.error ?? "저장에 실패했습니다.", type: "error" });
    }
  }

  function onAuthSuccess() {
    setShowAuthModal(false);
    if (pendingSave) {
      doSave(pendingSave.recipe, pendingSave.index);
      setPendingSave(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">레시피 추천</h1>
          <p className="text-gray-500 mt-2">보유 재료로 만들 수 있는 레시피를 AI가 생성해드려요</p>

          {/* 단계 표시 */}
          <div className="flex items-center justify-center gap-2 mt-6 text-sm">
            <Link href="/" className="px-3 py-1 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors">
              1 재료 인식
            </Link>
            <span className="text-gray-300">›</span>
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-semibold">2 레시피 생성</span>
            <span className="text-gray-300">›</span>
            <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-400">3 저장</span>
          </div>
        </div>

        {/* 재료 요약 바 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">보유 재료</span>
          {ingredients.map((ing, i) => (
            <span key={i} className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
              {ing}
            </span>
          ))}
        </div>

        {/* 옵션 선택 단계 */}
        {stage === "options" && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h2 className="font-semibold text-gray-800 mb-1">레시피 조건 설정</h2>
            <p className="text-sm text-gray-400 mb-6">선택하지 않으면 다양한 조건으로 추천해드려요</p>
            <RecipeOptions value={options} onChange={setOptions} />
            <button
              onClick={() => generate(0)}
              className="mt-8 w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base transition-colors"
            >
              레시피 생성하기
            </button>
          </div>
        )}

        {/* 로딩 / 스트리밍 단계 */}
        {stage === "loading" && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-gray-700 font-semibold">레시피를 생성하는 중...</p>
                <p className="text-sm text-gray-400 mt-1">
                  DeepSeek AI가 {ingredients.length}가지 재료로 레시피를 만들고 있어요
                  {retryCount > 0 && ` (재시도 ${retryCount}/2)`}
                </p>
              </div>

              {/* 스트리밍 진행 미리보기 */}
              {streamText.length > 10 && (
                <div className="w-full bg-gray-50 rounded-xl p-4 max-h-32 overflow-hidden relative">
                  <p className="text-xs text-gray-400 font-mono leading-relaxed line-clamp-4">
                    {streamText.slice(0, 300)}
                    <span className="inline-block w-1.5 h-3.5 bg-emerald-500 ml-0.5 animate-pulse align-middle" />
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent" />
                </div>
              )}

              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(95, (streamText.length / 1500) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 결과 — 레시피 카드 */}
        {stage === "result" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-800 text-lg">추천 레시피 {recipes.length}개</h2>
              <button
                onClick={() => { setStage("options"); setStreamText(""); }}
                className="text-sm text-emerald-600 hover:underline"
              >
                조건 변경
              </button>
            </div>

            {recipes.map((recipe, i) => (
              <RecipeCard
                key={i}
                recipe={recipe}
                ownedIngredients={ingredients}
                onSave={(r) => handleSave(r, i)}
                saved={savedIds.has(i)}
                saving={savingIds.has(i)}
              />
            ))}

            {savedIds.size > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-700 text-center">
                {savedIds.size}개 레시피가 저장됐습니다.
                <Link href="/mypage" className="ml-2 font-semibold underline hover:text-emerald-900">
                  마이페이지에서 보기 →
                </Link>
              </div>
            )}

            <Link href="/" className="text-center text-sm text-gray-400 hover:text-gray-600 mt-2">
              ← 새 사진으로 시작하기
            </Link>
          </div>
        )}

        {/* 오류 */}
        {stage === "error" && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">생성 실패</p>
                <p className="text-sm text-red-500 mt-1">{errorMsg}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStage("options")}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
                >
                  조건 변경
                </button>
                <button
                  onClick={() => generate(0)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAuthModal && (
        <AuthModal
          onSuccess={onAuthSuccess}
          onClose={() => { setShowAuthModal(false); setPendingSave(null); }}
        />
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  );
}

export default function RecipePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    }>
      <RecipePage />
    </Suspense>
  );
}
