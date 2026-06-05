/**
 * 실제 식재료 이미지로 전체 흐름 라이브 테스트
 */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3000";
const SHOT_DIR = path.join(__dirname, "test-screenshots", "live");
fs.mkdirSync(SHOT_DIR, { recursive: true });

let n = 0;
async function shot(page, label) {
  n++;
  const file = path.join(SHOT_DIR, `${String(n).padStart(2,"0")}-${label}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${file}`);
  return file;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  const imgPath = path.join(__dirname, "test-screenshots", "fridge-test.jpg");

  try {
    // ── Step 1: 메인 페이지 ──
    console.log("\n▶ [1] 메인 페이지 로드");
    await page.goto(BASE, { waitUntil: "networkidle" });
    await shot(page, "home");

    // ── Step 1: 이미지 업로드 ──
    console.log("\n▶ [2] 식재료 이미지 업로드");
    await page.locator('input[type="file"]').setInputFiles(imgPath);
    await page.waitForTimeout(600);
    await shot(page, "image-preview");
    console.log("  이미지 업로드 완료");

    // ── Step 1: 분석 시작 → Gemma API 대기 ──
    console.log("\n▶ [3] 분석 시작 — Gemma 비전 모델 호출 (최대 40초 대기)");
    await page.locator("text=분석 시작").click();
    await shot(page, "analyzing");

    // 로딩 스피너가 사라질 때까지 대기
    await page.locator("text=이미지를 분석하는 중").waitFor({ state: "hidden", timeout: 40000 });
    await shot(page, "analysis-done");

    const failed = await page.locator("text=분석 실패").isVisible();
    if (failed) {
      const errMsg = await page.locator("text=분석 실패").locator("..").textContent().catch(() => "");
      console.log(`  ❌ 분석 실패: ${errMsg.trim()}`);
      await browser.close();
      return;
    }

    // 인식된 재료 태그 수집
    const tags = await page.locator("button.rounded-full, span.rounded-full").allTextContents();
    const ingredients = tags.map(t => t.trim()).filter(t => t && t !== "×" && t !== "x" && !t.includes("+"));
    console.log(`\n  ✅ Gemma 인식 재료 (${ingredients.length}개): ${ingredients.join(", ")}`);
    await shot(page, "ingredients-found");

    // ── Step 2: 레시피 생성 ──
    console.log("\n▶ [4] '다음 단계' 클릭 → 레시피 페이지 이동");
    const nextBtn = page.locator("text=다음 단계");
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    } else {
      // URL 파라미터로 직접 이동
      const query = encodeURIComponent(JSON.stringify(ingredients.slice(0, 8)));
      await page.goto(`${BASE}/recipe?ingredients=${query}`, { waitUntil: "networkidle" });
    }
    await page.waitForTimeout(500);
    await shot(page, "recipe-page");

    console.log("\n▶ [5] 레시피 생성하기 클릭 — DeepSeek API 호출 (최대 60초 대기)");
    await page.locator("text=레시피 생성하기").click();
    await shot(page, "recipe-generating");

    await page.locator("text=레시피를 생성하는 중").waitFor({ state: "hidden", timeout: 60000 });
    await shot(page, "recipe-done");

    const recipeFailed = await page.locator("text=생성 실패").isVisible();
    if (recipeFailed) {
      console.log("  ❌ 레시피 생성 실패");
    } else {
      // 생성된 레시피 제목 수집
      const titles = await page.locator("h2, h3").allTextContents();
      const recipeNames = titles.map(t => t.trim()).filter(t => t && t.length > 2 && t.length < 40);
      console.log(`\n  ✅ 생성된 레시피:`);
      recipeNames.slice(0, 5).forEach((r, i) => console.log(`    ${i+1}. ${r}`));

      // ── Step 3: 첫 번째 레시피 저장 (로그인 필요 → AuthModal 확인) ──
      console.log("\n▶ [6] 레시피 저장 버튼 클릭 (비로그인 → 로그인 모달 확인)");
      // 레시피 카드 안의 저장 버튼만 클릭 (step 배지 제외)
      await page.getByRole("button", { name: "저장" }).first().click();
      await page.waitForTimeout(1500);
      await shot(page, "save-modal");

      const modal = await page.locator("text=레시피 저장하기").isVisible()
        || await page.locator("text=로그인하면 레시피를 저장할 수 있어요").isVisible();
      console.log(`  ${modal ? "✅ 로그인 모달 표시" : "⚠️  모달 미확인"}`);
    }

    // ── 최종 스크린샷 ──
    await shot(page, "final");

    console.log("\n" + "=".repeat(50));
    console.log("라이브 테스트 완료");
    console.log(`스크린샷: ${SHOT_DIR}`);

  } catch (err) {
    console.error("\n❌ 오류:", err.message);
    await shot(page, "error").catch(() => {});
  } finally {
    await browser.close();
  }
}

run();
