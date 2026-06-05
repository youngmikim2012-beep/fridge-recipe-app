"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/mypage";

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else {
      router.push(callbackUrl);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, nickname }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "회원가입에 실패했습니다.");
      setLoading(false);
      return;
    }
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("가입 완료. 로그인해주세요.");
      setTab("login");
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">냉장고 레시피 AI</h1>
          <p className="text-gray-500 text-sm mt-1">레시피를 저장하고 관리하세요</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {(["login", "signup"] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}>
                {t === "login" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>

          <form onSubmit={tab === "login" ? handleLogin : handleSignup} className="flex flex-col gap-3">
            {tab === "signup" && (
              <input type="text" placeholder="닉네임 (선택)" value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            )}
            <input type="email" placeholder="이메일" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <input type="password" placeholder="비밀번호 (6자 이상)" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white font-semibold transition-colors mt-1">
              {loading ? "처리 중..." : tab === "login" ? "로그인" : "가입하기"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <AuthForm />
    </Suspense>
  );
}
