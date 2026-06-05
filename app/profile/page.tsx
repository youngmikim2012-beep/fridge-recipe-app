"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Toast from "@/components/Toast";

interface Dietary {
  vegetarian: boolean;
  vegan: boolean;
  gluten_free: boolean;
  allergies: string[];
}

const DEFAULT_DIETARY: Dietary = {
  vegetarian: false,
  vegan: false,
  gluten_free: false,
  allergies: [],
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [nickname, setNickname] = useState("");
  const [dietary, setDietary] = useState<Dietary>(DEFAULT_DIETARY);
  const [allergyInput, setAllergyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setNickname(data.nickname ?? "");
        setDietary({ ...DEFAULT_DIETARY, ...data.dietary });
      })
      .catch(() => {});
  }, [status]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, dietary }),
    });
    setSaving(false);
    if (res.ok) {
      setToast({ msg: "프로필이 저장됐습니다.", type: "success" });
    } else {
      setToast({ msg: "저장에 실패했습니다.", type: "error" });
    }
  }

  function addAllergy() {
    const v = allergyInput.trim();
    if (!v || dietary.allergies.includes(v)) return;
    setDietary((d) => ({ ...d, allergies: [...d.allergies, v] }));
    setAllergyInput("");
  }

  function removeAllergy(item: string) {
    setDietary((d) => ({ ...d, allergies: d.allergies.filter((a) => a !== item) }));
  }

  if (status === "loading") {
    return <main className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
    </main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-12">

        <div className="flex items-center gap-3 mb-8">
          <Link href="/mypage" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">프로필 설정</h1>
            <p className="text-sm text-gray-500">{session?.user?.email}</p>
          </div>
        </div>

        <form onSubmit={save} className="flex flex-col gap-6">

          {/* 기본 정보 */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">기본 정보</h2>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* 식이 제한 */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-1">식이 제한</h2>
            <p className="text-xs text-gray-400 mb-4">설정해두면 레시피 추천 시 자동으로 반영돼요</p>

            <div className="space-y-3 mb-5">
              {([
                { key: "vegetarian", label: "채식 (Vegetarian)", desc: "육류 제외" },
                { key: "vegan", label: "비건 (Vegan)", desc: "모든 동물성 식품 제외" },
                { key: "gluten_free", label: "글루텐 프리", desc: "밀, 보리, 호밀 제외" },
              ] as const).map(({ key, label, desc }) => (
                <label key={key} className="flex items-center justify-between gap-3 cursor-pointer group">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <div
                    onClick={() => setDietary((d) => ({ ...d, [key]: !d[key] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                      dietary[key] ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      dietary[key] ? "translate-x-5" : ""
                    }`} />
                  </div>
                </label>
              ))}
            </div>

            {/* 알레르기 */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">알레르기 식재료</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {dietary.allergies.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                    {a}
                    <button type="button" onClick={() => removeAllergy(a)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAllergy(); } }}
                  placeholder="예: 견과류, 해산물 (Enter)"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button type="button" onClick={addAllergy}
                  className="px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors">
                  추가
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white font-bold transition-colors">
            {saving ? "저장 중..." : "프로필 저장"}
          </button>
        </form>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  );
}
