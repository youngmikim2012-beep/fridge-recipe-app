"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AuthModal({ onSuccess, onClose }: Props) {
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
      onSuccess();
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
    // 가입 후 자동 로그인
    const loginResult = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (loginResult?.error) {
      setError("가입은 완료됐지만 로그인에 실패했습니다. 다시 로그인해주세요.");
    } else {
      onSuccess();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm mx-4 p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">×</button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-2xl mb-3">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">레시피 저장하기</h2>
          <p className="text-sm text-gray-500 mt-1">로그인하면 레시피를 저장할 수 있어요</p>
        </div>

        {/* 탭 */}
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
            <input
              type="text"
              placeholder="닉네임 (선택)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white font-semibold text-sm transition-colors mt-1">
            {loading ? "처리 중..." : tab === "login" ? "로그인" : "가입하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
