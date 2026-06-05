"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import SavedRecipeCard, { SavedRecipe } from "@/components/SavedRecipeCard";
import Toast from "@/components/Toast";

export default function MypagePage() {
  const { data: session, status } = useSession();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("전체");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/recipes");
    if (res.ok) {
      const data = await res.json();
      setRecipes(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchRecipes();
  }, [status, fetchRecipes]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      setToast({ msg: "레시피가 삭제됐습니다.", type: "success" });
    } else {
      setToast({ msg: "삭제에 실패했습니다.", type: "error" });
    }
  }

  async function handleUpdate(id: string, memo: string, tags: string[]) {
    const res = await fetch(`/api/recipes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memo, tags }),
    });
    if (res.ok) {
      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, memo, tags } : r))
      );
      setToast({ msg: "저장됐습니다.", type: "success" });
    } else {
      setToast({ msg: "저장에 실패했습니다.", type: "error" });
    }
  }

  // 태그 목록 수집
  const allTags = ["전체", ...Array.from(new Set(recipes.flatMap((r) => r.tags)))];

  const filtered = recipes.filter((r) => {
    const matchSearch = r.recipe.name.toLowerCase().includes(search.toLowerCase());
    const matchTag = activeTag === "전체" || r.tags.includes(activeTag);
    return matchSearch && matchTag;
  });

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {session?.user?.name ?? session?.user?.email} 님의 레시피 북
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/profile"
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              프로필
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/" })}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              로그아웃
            </button>
          </div>
        </div>

        {/* 단계 표시 */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/" className="px-3 py-1 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors">
            1 재료 인식
          </Link>
          <span className="text-gray-300">›</span>
          <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-400">2 레시피 생성</span>
          <span className="text-gray-300">›</span>
          <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-semibold">3 저장</span>
        </div>

        {/* 검색 */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="레시피 검색..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        {/* 태그 필터 */}
        {allTags.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {allTags.map((tag) => (
              <button key={tag} onClick={() => setActiveTag(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeTag === tag
                    ? "bg-emerald-500 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-400"
                }`}>
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* 레시피 목록 */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-600 font-medium">
              {recipes.length === 0 ? "아직 저장된 레시피가 없어요" : "검색 결과가 없어요"}
            </p>
            <Link href="/" className="mt-4 inline-block text-sm text-emerald-600 hover:underline">
              냉장고 사진으로 레시피 찾기 →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400 text-right">{filtered.length}개 레시피</p>
            {filtered.map((item) => (
              <SavedRecipeCard key={item.id} item={item} onDelete={handleDelete} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  );
}
