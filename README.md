# 냉장고 레시피 AI

냉장고 사진을 찍으면 AI가 재료를 인식하고, 보유한 재료로 만들 수 있는 레시피를 추천해주는 웹 애플리케이션입니다.

## 주요 기능

### Step 1 — 재료 인식
- 냉장고 사진 업로드 (클릭 또는 드래그 앤 드롭)
- **Gemma 3 27B** 비전 모델이 사진 속 식재료를 자동 인식
- 인식 결과 편집 (태그 삭제 / 재료 직접 추가)

### Step 2 — 레시피 생성
- **DeepSeek Chat v3** 가 보유 재료 기반 레시피 3개를 스트리밍으로 생성
- 식사 유형 (아침/점심/저녁/간식) · 조리 시간 · 난이도 필터
- 보유 재료 매칭 표시, 단계별 조리법 확인

### Step 3 — 저장 및 관리
- 이메일/비밀번호 회원가입 & 로그인
- 마음에 드는 레시피 저장, 메모 작성
- 마이페이지에서 저장한 레시피 목록 관리
- 프로필 닉네임 및 식이 제한 (채식·글루텐프리 등) 설정

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| 스타일 | TailwindCSS |
| AI — 이미지 분석 | [google/gemma-3-27b-it](https://openrouter.ai/google/gemma-3-27b-it) via OpenRouter |
| AI — 레시피 생성 | [deepseek/deepseek-chat-v3-0324](https://openrouter.ai/deepseek/deepseek-chat-v3-0324) via OpenRouter |
| 인증 | NextAuth v5 (Credentials, JWT) |
| ORM / DB | Prisma 7 + libSQL adapter + SQLite |
| 암호화 | bcryptjs |
| 테스트 | Playwright |

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 아래 값을 입력합니다:

```env
OPENROUTER_API_KEY=sk-or-v1-...   # https://openrouter.ai 에서 발급
NEXTAUTH_SECRET=your-secret-key   # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

### 3. 데이터베이스 초기화

```bash
npx prisma db push
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열면 됩니다.

## 프로젝트 구조

```
├── app/
│   ├── page.tsx                  # Step 1: 이미지 업로드 & 재료 인식
│   ├── recipe/page.tsx           # Step 2: 레시피 생성
│   ├── auth/page.tsx             # 로그인 / 회원가입
│   ├── mypage/page.tsx           # 저장된 레시피 목록
│   ├── profile/page.tsx          # 프로필 설정
│   └── api/
│       ├── analyze-image/        # Gemma 비전 API 호출
│       ├── generate-recipe/      # DeepSeek 스트리밍 API 호출
│       ├── auth/                 # NextAuth + 회원가입
│       ├── recipes/              # 레시피 저장 / 조회 / 수정 / 삭제
│       └── profile/              # 프로필 조회 / 수정
├── components/
│   ├── ImageUploader.tsx
│   ├── IngredientTags.tsx
│   ├── RecipeCard.tsx
│   ├── RecipeOptions.tsx
│   ├── SavedRecipeCard.tsx
│   ├── AuthModal.tsx
│   ├── Toast.tsx
│   └── Providers.tsx
├── lib/prisma.ts                 # Prisma 클라이언트 (libSQL adapter)
├── auth.ts                       # NextAuth 설정
├── proxy.ts                      # 인증 미들웨어
└── prisma/schema.prisma          # User, SavedRecipe 스키마
```

## E2E 테스트

```bash
# 전체 흐름 자동 테스트 (Step 1~3)
node test-flow.js

# 실제 이미지로 AI 라이브 테스트
node test-live.js
```

테스트 스크린샷은 `test-screenshots/` 폴더에 저장됩니다.

## 주요 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/analyze-image` | 이미지 → 재료 목록 (Gemma) |
| POST | `/api/generate-recipe` | 재료 → 레시피 스트리밍 (DeepSeek) |
| POST | `/api/auth/signup` | 회원가입 |
| GET | `/api/recipes` | 저장된 레시피 목록 |
| POST | `/api/recipes` | 레시피 저장 |
| PATCH | `/api/recipes/[id]` | 메모/태그 수정 |
| DELETE | `/api/recipes/[id]` | 레시피 삭제 |
| GET/PATCH | `/api/profile` | 프로필 조회/수정 |
