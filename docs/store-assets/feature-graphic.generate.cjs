const { chromium } = require('/Users/halilibrahimozhanli/scorepion/node_modules/playwright-core');
const CREST = `
<svg class="crest" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
<path d="M 32 2 C 32 2, 14 8, 14 22 C 14 34, 20 46, 32 56 C 44 46, 50 34, 50 22 C 50 8, 32 2, 32 2 Z" fill="#00A651"/>
<path d="M 28 26 L 36 26 Q 38 26, 38 28 L 38 40 Q 38 42, 36 42 L 28 42 Q 26 42, 26 40 L 26 28 Q 26 26, 28 26 Z" fill="#FFFFFF"/>
<path d="M 28 27 Q 20 23, 18 26" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<path d="M 36 27 Q 44 23, 46 26" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<path d="M 26 30 L 20 32" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" fill="none"/>
<path d="M 26 36 L 20 39" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" fill="none"/>
<path d="M 38 30 L 44 32" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" fill="none"/>
<path d="M 38 36 L 44 39" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" fill="none"/>
<path d="M 37 42 Q 40 38, 42 32 Q 43 26, 41 20 Q 40 18, 38 19" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<path d="M 38 19 L 39 14 L 42 17 Z" fill="#FFFFFF"/>
</svg>`;
const html = `<!doctype html><html><head>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800;900&display=swap');
html,body{margin:0;padding:0}
.wrap{width:1024px;height:500px;position:relative;overflow:hidden;display:flex;align-items:center;
  background:radial-gradient(125% 150% at 20% 45%, #103057 0%, #0A1B34 42%, #060D1F 100%);
  font-family:Inter,'Helvetica Neue',Arial,sans-serif;}
/* subtle pitch arc */
.arc{position:absolute;right:-160px;top:50%;transform:translateY(-50%);width:520px;height:520px;
  border:2px solid rgba(255,255,255,0.05);border-radius:50%;}
.arc2{position:absolute;right:-40px;top:50%;transform:translateY(-50%);width:300px;height:300px;
  border:2px solid rgba(0,166,81,0.10);border-radius:50%;}
.glow{position:absolute;left:30px;top:50%;transform:translateY(-50%);width:520px;height:520px;
  background:radial-gradient(circle, rgba(0,166,81,0.30) 0%, rgba(0,166,81,0) 62%);}
.crest{width:284px;height:284px;margin-left:92px;flex:0 0 auto;position:relative;z-index:2;
  filter:drop-shadow(0 10px 34px rgba(0,166,81,0.40));}
.text{margin-left:58px;padding-right:56px;position:relative;z-index:2;}
.kicker{font-weight:700;font-size:21px;letter-spacing:6px;color:#2BD576;text-transform:uppercase;}
.title{font-weight:900;font-size:94px;line-height:0.95;color:#fff;letter-spacing:-3px;margin-top:10px;}
.rule{width:104px;height:5px;background:#00A651;border-radius:3px;margin:24px 0 22px;}
.tag{font-weight:600;font-size:38px;letter-spacing:0.3px;color:#C7D4E6;}
.tag b{color:#fff;font-weight:700;}
</style></head><body>
<div class="wrap">
  <div class="arc"></div><div class="arc2"></div><div class="glow"></div>
  ${CREST}
  <div class="text">
    <div class="kicker">Football Score Predictions</div>
    <div class="title">Scorepion</div>
    <div class="rule"></div>
    <div class="tag"><b>Predict.</b> <b>Compete.</b> <b>Climb.</b></div>
  </div>
</div></body></html>`;
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1024, height: 500 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.locator('.wrap').screenshot({ path: '/tmp/feature-graphic.png' });
  await page.close();
  await browser.close();
  console.log('rendered /tmp/feature-graphic.png');
})();
