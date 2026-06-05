/**
 * Step 1~3 전체 흐름 테스트
 * 실행: node test-flow.js
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:3000";
const SCREENSHOT_DIR = path.join(__dirname, "test-screenshots");
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

let stepNum = 0;
async function shot(page, name) {
  stepNum++;
  const file = path.join(SCREENSHOT_DIR, `${String(stepNum).padStart(2,"0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${file}`);
  return file;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const results = [];

  // 콘솔 에러 수집
  const consoleErrors = [];
  page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  try {
    // ───────────────────────────────────────────
    // STEP 1 — 메인 페이지 (이미지 업로드 UI)
    // ───────────────────────────────────────────
    console.log("\n▶ [Step 1] 메인 페이지 로딩");
    await page.goto(BASE, { waitUntil: "networkidle" });
    await shot(page, "step1-home");

    const h1 = await page.textContent("h1");
    results.push({ test: "Step1: 페이지 제목", pass: h1.includes("냉장고 재료 인식"), detail: h1 });

    const uploader = await page.locator("text=클릭하거나 사진을 여기에 드래그하세요").isVisible();
    results.push({ test: "Step1: 업로드 영역 노출", pass: uploader });

    const steps = await page.locator("text=1 재료 인식").isVisible();
    results.push({ test: "Step1: 단계 표시 (1 활성)", pass: steps });

    // ───────────────────────────────────────────
    // 테스트 이미지 생성 후 업로드
    // ───────────────────────────────────────────
    console.log("\n▶ [Step 1] 테스트 이미지 업로드");

    // 1×1 흰색 PNG (유효한 이미지)
    const testImagePath = path.join(SCREENSHOT_DIR, "test-fridge.png");
    // 작은 PNG 바이너리 생성
    const pngBytes = Buffer.from(
      "89504e470d0a1a0a0000000d49484452000000010000000108020000009001" +
      "2e00000000c4944415478016360f8cfc00000000200016ee211600000000049454e44ae426082",
      "hex"
    );
    fs.writeFileSync(testImagePath, pngBytes);

    // 파일 input에 직접 세팅
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(500);
    await shot(page, "step1-preview");

    const analyzeBtn = await page.locator("text=분석 시작").isVisible();
    results.push({ test: "Step1: 미리보기 후 '분석 시작' 버튼 노출", pass: analyzeBtn });

    // ───────────────────────────────────────────
    // 분석 시작 → API 응답 대기 (성공 또는 에러)
    // ───────────────────────────────────────────
    console.log("\n▶ [Step 1] 분석 시작 클릭 (API 응답 대기 최대 30초)");
    await page.locator("text=분석 시작").click();
    // Wait for loading spinner to disappear (analysis complete)
    await page.locator("text=이미지를 분석하는 중").waitFor({ state: "hidden", timeout: 30000 }).catch(() => {});
    await shot(page, "step1-analysis-result");

    const analysisError = await page.locator("text=분석 실패").isVisible();
    const analysisSuccess = await page.locator("text=다음 단계").isVisible()
      || await page.locator("text=인식된 재료").isVisible()
      || await page.locator("text=재료 편집").isVisible()
      || (await page.locator("button.rounded-full").count()) > 0;
    const analysisResponded = analysisError || analysisSuccess;
    results.push({ test: "Step1: 이미지 분석 API 응답", pass: analysisResponded,
      detail: analysisError ? "에러 응답" : (analysisSuccess ? "성공 응답" : "미응답") });

    // 다시 시도 버튼 (에러 시) 또는 다음 단계 버튼 (성공 시) 노출
    const actionBtn = await page.locator("text=다시 시도").isVisible()
      || await page.locator("text=다음 단계").isVisible();
    results.push({ test: "Step1: 분석 후 액션 버튼 노출", pass: actionBtn });

    // ───────────────────────────────────────────
    // 재료를 수동으로 세팅해서 Step 2로 이동
    // ───────────────────────────────────────────
    console.log("\n▶ [Step 2] 재료 URL 파라미터로 직접 이동");
    const ingredients = ["달걀", "우유", "당근", "양파", "치즈"];
    const query = encodeURIComponent(JSON.stringify(ingredients));
    await page.goto(`${BASE}/recipe?ingredients=${query}`, { waitUntil: "networkidle" });
    await shot(page, "step2-options");

    const step2H1 = await page.textContent("h1");
    results.push({ test: "Step2: 페이지 제목", pass: step2H1.includes("레시피 추천"), detail: step2H1 });

    // 재료 요약 바
    const ingBar = await page.locator("text=달걀").first().isVisible();
    results.push({ test: "Step2: 재료 요약 바 표시", pass: ingBar });

    // 옵션 필터 표시 확인
    const mealFilter = await page.locator("text=아침").isVisible();
    results.push({ test: "Step2: 식사 유형 필터 표시", pass: mealFilter });

    const timeFilter = await page.locator("text=15분 이내").isVisible();
    results.push({ test: "Step2: 조리 시간 필터 표시", pass: timeFilter });

    // 필터 클릭 동작 확인
    await page.locator("text=아침").click();
    await page.waitForTimeout(200);
    await shot(page, "step2-options-selected");

    // 레시피 생성 클릭 → 로딩 후 결과 대기
    console.log("\n▶ [Step 2] 레시피 생성 클릭 (API 응답 대기 최대 60초)");
    await page.locator("text=레시피 생성하기").click();
    // Check loading state immediately — it appears synchronously on click before API responds
    const loadingText = await page.locator("text=레시피를 생성하는 중").isVisible({ timeout: 2000 }).catch(() => false);
    await shot(page, "step2-loading");
    results.push({ test: "Step2: 로딩 UI 표시", pass: loadingText });

    // Wait for loading to complete (up to 60s for recipe generation)
    await page.locator("text=레시피를 생성하는 중").waitFor({ state: "hidden", timeout: 60000 }).catch(() => {});
    await shot(page, "step2-after-generate");

    const step2Error = await page.locator("text=생성 실패").isVisible()
      || await page.locator("text=다시 시도").isVisible();
    const step2Success = await page.locator("text=저장하기").isVisible()
      || await page.locator("text=레시피 저장").isVisible()
      || (await page.locator("h2, h3").count()) > 0;
    const step2Done = step2Error || step2Success;
    results.push({ test: "Step2: 레시피 생성 완료 (성공 또는 에러)", pass: step2Done,
      detail: step2Error ? "에러 응답" : (step2Success ? "레시피 생성 성공" : "미완료") });

    // ───────────────────────────────────────────
    // STEP 3 — 인증 페이지
    // ───────────────────────────────────────────
    console.log("\n▶ [Step 3] 인증 페이지 이동");
    await page.goto(`${BASE}/auth`, { waitUntil: "networkidle" });
    await shot(page, "step3-auth-page");

    const loginTab = await page.locator("text=로그인").first().isVisible();
    const signupTab = await page.locator("text=회원가입").isVisible();
    results.push({ test: "Step3: 인증 페이지 로그인/회원가입 탭 표시", pass: loginTab && signupTab });

    // 회원가입 탭 클릭
    await page.locator("text=회원가입").click();
    await page.waitForTimeout(200);
    await shot(page, "step3-signup-tab");

    const nicknameInput = await page.locator('input[placeholder="닉네임 (선택)"]').isVisible();
    results.push({ test: "Step3: 회원가입 폼 (닉네임 필드) 표시", pass: nicknameInput });

    // 회원가입 실행
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = "password123";
    console.log(`  이메일: ${testEmail}`);

    await page.locator('input[placeholder="닉네임 (선택)"]').fill("테스터");
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await shot(page, "step3-signup-filled");

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await shot(page, "step3-after-signup");

    const currentUrl = page.url();
    const signupSuccess = currentUrl.includes("/mypage") || currentUrl === BASE + "/";
    results.push({ test: "Step3: 회원가입 후 마이페이지로 이동", pass: signupSuccess, detail: currentUrl });

    // ───────────────────────────────────────────
    // STEP 3 — 마이페이지 확인
    // ───────────────────────────────────────────
    if (signupSuccess) {
      console.log("\n▶ [Step 3] 마이페이지 확인");
      if (!currentUrl.includes("/mypage")) await page.goto(`${BASE}/mypage`, { waitUntil: "networkidle" });
      await shot(page, "step3-mypage");

      const mypageTitle = await page.locator("h1").textContent();
      results.push({ test: "Step3: 마이페이지 타이틀", pass: mypageTitle.includes("마이페이지"), detail: mypageTitle });

      const emptyMsg = await page.locator("text=아직 저장된 레시피가 없어요").isVisible();
      results.push({ test: "Step3: 빈 상태 메시지 표시", pass: emptyMsg });

      const profileBtn = await page.locator("text=프로필").isVisible();
      results.push({ test: "Step3: 프로필 버튼 표시", pass: profileBtn });

      // ───────────────────────────────────────────
      // API로 레시피 저장 후 마이페이지 재확인
      // ───────────────────────────────────────────
      console.log("\n▶ [Step 3] API로 레시피 저장 (인증 상태)");
      const cookies = await context.cookies();
      const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");

      const mockRecipe = {
        name: "달걀 야채 볶음밥",
        time: "20분",
        difficulty: "초보",
        description: "냉장고 재료로 간단하게 만드는 한 그릇 요리",
        ingredients: ["달걀 2개", "당근 1/2개", "양파 1/4개"],
        steps: ["야채를 썬다", "달걀을 풀어 볶는다", "밥을 넣고 볶는다"]
      };

      const saveRes = await page.evaluate(async (recipe) => {
        const r = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe })
        });
        return { status: r.status, body: await r.json() };
      }, mockRecipe);

      results.push({ test: "Step3: 로그인 상태에서 레시피 저장 API", pass: saveRes.status === 201, detail: JSON.stringify(saveRes) });

      // 저장 후 마이페이지 새로고침
      await page.reload({ waitUntil: "networkidle" });
      await shot(page, "step3-mypage-with-recipe");

      const recipeCard = await page.locator("text=달걀 야채 볶음밥").isVisible();
      results.push({ test: "Step3: 저장된 레시피 마이페이지 표시", pass: recipeCard });

      if (recipeCard) {
        // 보기 버튼 클릭
        await page.locator("text=보기").first().click();
        await page.waitForTimeout(300);
        await shot(page, "step3-recipe-expanded");

        const stepsVisible = await page.locator("text=야채를 썬다").isVisible();
        results.push({ test: "Step3: 레시피 조리법 펼치기", pass: stepsVisible });

        // 메모 추가 테스트
        await page.locator("text=추가").first().click();
        await page.waitForTimeout(200);
        await page.locator('textarea').fill("소금 적게 넣으면 더 맛있음");
        await page.getByRole("button", { name: "저장" }).click();
        await page.waitForTimeout(1000);
        await shot(page, "step3-memo-saved");

        const memoSaved = await page.locator("text=소금 적게 넣으면 더 맛있음").isVisible()
          || await page.locator("text=저장됐습니다").isVisible();
        results.push({ test: "Step3: 메모 저장", pass: memoSaved });
      }

      // ───────────────────────────────────────────
      // 프로필 페이지
      // ───────────────────────────────────────────
      console.log("\n▶ [Step 3] 프로필 페이지");
      await page.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
      await shot(page, "step3-profile");

      const profileTitle = await page.locator("h1").textContent();
      results.push({ test: "Step3: 프로필 페이지 로드", pass: profileTitle.includes("프로필"), detail: profileTitle });

      const vegToggle = await page.locator("text=채식 (Vegetarian)").isVisible();
      results.push({ test: "Step3: 식이 제한 토글 표시", pass: vegToggle });

      // 닉네임 변경
      const nicknameField = page.locator('input[placeholder="닉네임을 입력하세요"]');
      await nicknameField.fill("테스터_변경");
      await page.locator("text=프로필 저장").click();
      await page.waitForTimeout(1000);
      await shot(page, "step3-profile-saved");

      const toastVisible = await page.locator("text=프로필이 저장됐습니다").isVisible();
      results.push({ test: "Step3: 프로필 저장 토스트", pass: toastVisible });

      // ───────────────────────────────────────────
      // 비로그인 상태에서 레시피 저장 시 AuthModal
      // ───────────────────────────────────────────
      console.log("\n▶ [Step 2→3] 비로그인 저장 시 모달 확인");
      await context.clearCookies();
      await page.goto(`${BASE}/recipe?ingredients=${query}`, { waitUntil: "networkidle" });

      // 레시피 카드 UI를 임의로 표시하기 위해 JS로 상태 조작 불가 → 대신 API 401 확인
      const unauthRes = await page.evaluate(async () => {
        const r = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe: { name: "test" } })
        });
        return r.status;
      });
      results.push({ test: "Step3: 비로그인 /api/recipes POST → 401", pass: unauthRes === 401, detail: `status=${unauthRes}` });

      const unauthGet = await page.evaluate(async () => {
        const r = await fetch("/api/recipes");
        return r.status;
      });
      results.push({ test: "Step3: 비로그인 /api/recipes GET → 401", pass: unauthGet === 401, detail: `status=${unauthGet}` });
    }

    // ───────────────────────────────────────────
    // 중복 회원가입 에러 확인
    // ───────────────────────────────────────────
    console.log("\n▶ [Step 3] 중복 회원가입 에러 처리 확인");
    await page.goto(`${BASE}/auth`, { waitUntil: "networkidle" });
    await page.locator("text=회원가입").click();
    await page.locator('input[placeholder="닉네임 (선택)"]').fill("중복");
    await page.locator('input[type="email"]').fill(testEmail); // 이미 사용된 이메일
    await page.locator('input[type="password"]').fill(testPassword);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);
    await shot(page, "step3-duplicate-error");

    const dupError = await page.locator("text=이미 사용 중인 이메일").isVisible();
    results.push({ test: "Step3: 중복 이메일 에러 표시", pass: dupError });

    // 로그아웃 후 재로그인 확인
    console.log("\n▶ [Step 3] 로그인 탭으로 재로그인");
    await page.locator("text=로그인").first().click();
    await page.waitForTimeout(200);
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
    await shot(page, "step3-login-success");

    const afterLogin = page.url();
    results.push({ test: "Step3: 재로그인 후 마이페이지 이동", pass: afterLogin.includes("/mypage"), detail: afterLogin });

  } catch (err) {
    console.error("테스트 실행 오류:", err.message);
    await shot(page, "error-state").catch(() => {});
    results.push({ test: "실행 오류", pass: false, detail: err.message });
  } finally {
    await browser.close();
  }

  // ───────────────────────────────────────────
  // 결과 출력
  // ───────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("테스트 결과");
  console.log("=".repeat(60));
  let pass = 0, fail = 0;
  for (const r of results) {
    const icon = r.pass ? "✅" : "❌";
    const detail = r.detail ? ` (${r.detail})` : "";
    console.log(`${icon} ${r.test}${detail}`);
    if (r.pass) pass++; else fail++;
  }
  console.log("=".repeat(60));
  console.log(`총 ${results.length}개 | 통과 ${pass}개 | 실패 ${fail}개`);

  if (consoleErrors.length > 0) {
    console.log("\n⚠️  브라우저 콘솔 에러:");
    consoleErrors.slice(0, 5).forEach(e => console.log("  -", e.substring(0, 120)));
  }

  console.log(`\n📁 스크린샷: ${SCREENSHOT_DIR}`);
  return fail === 0;
}

run().then(ok => process.exit(ok ? 0 : 1));
