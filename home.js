/* ホーム画面：ボーダーTOP3、ホーム画面追加（PWA）の案内、広告枠、サービスワーカー登録。
   ボーダーの数値は borders.js（DMMぱちタウンの掲載値）をそのまま使う。 */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const PACHINKO_LABELS = SPEC_LABELS.pachinko;

  /* ---------------- ボーダーが甘い台 TOP3 ---------------- */
  function renderTop3() {
    const ol = $("home-top3");
    if (!ol || typeof BORDER_DATA === "undefined") return;
    // ランキングページの標準表示と同じ条件（電サポ中の出玉増減-5%・等価・順位対象のみ）
    const items = BORDER_DATA.map((e, i) => ({ e, i }))
      .filter((x) => x.e.rank && x.e.b[0] != null && x.e.sapo === "-5%")
      .sort((a, b) => a.e.b[0] - b.e.b[0] || a.e.name.localeCompare(b.e.name, "ja"))
      .slice(0, 3);
    ol.innerHTML = items.map((x, n) => {
      const e = x.e;
      return `<li class="home-top3-item"><span class="rank-no">${n + 1}</span>
        <div class="rank-main"><p class="rank-name">${escapeHTML(e.name)}${e.label ? `<small>【${escapeHTML(e.label)}】</small>` : ""}</p>
        <p class="rank-meta">${escapeHTML(PACHINKO_LABELS[e.cat])}　<button type="button" class="link-btn" data-calc-home="${x.i}">この台で計算する</button></p></div>
        <div class="rank-val"><b>${e.b[0].toFixed(1)}</b><small>回転</small></div></li>`;
    }).join("");
    const [y, m, d] = BORDERS_AS_OF.split("-").map(Number);
    $("home-top3-note").textContent = `出典：DMMぱちタウンの掲載値（${y}年${m}月${d}日取得）。「ボーダーが低い」は「勝てる台」という意味ではありません。`;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-calc-home]");
    if (b && window.PS_CALC_OPEN) { window.PS_CALC_OPEN(Number(b.dataset.calcHome)); window.scrollTo(0, 0); }
  });

  /* ---------------- 広告（ホーム・ランキング・計算機の下） ---------------- */
  function fillAds() {
    const withJa = (items, lead) => (typeof ADS !== "undefined" && ADS.jacard ? items.concat([["jacard", lead]]) : items);
    const jaLead = "クレジットカードを作るなら。新規入会キャンペーンの条件は公式サイトでご確認ください。";
    const set = (id, items, placement) => { const el = $(id); if (el) { el.innerHTML = adBlockHTML(withJa(items, jaLead), placement); } };
    set("home-ad", [["hunter", "パチンコ・スロット好きの運試しに。"], ["keiba", "競馬も気になるなら。"], ["hapitas", "遊びに行く前のお小遣い稼ぎに。"]], "home");
    set("rank-ad", [["hapitas", "軍資金づくりに。"], ["hunter", "ホールに行けない日の運試しに。"]], "rank");
    set("calc-ad", [["hapitas", "軍資金づくりに。"]], "calc");
  }

  /* ---------------- ホーム画面に追加（PWA） ---------------- */
  const DISMISS_KEY = "pslab_install_dismissed";
  let deferredPrompt = null;
  const isStandalone = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  function dismissed() { try { return !!localStorage.getItem(DISMISS_KEY); } catch (e) { return false; } }

  function renderInstall() {
    const box = $("install-box");
    if (!box) return;
    if (isStandalone() || dismissed()) { box.hidden = true; return; }
    let how;
    if (deferredPrompt) how = `<button type="button" class="btn-primary" id="install-go">ホーム画面に追加する</button>`;
    else if (isIOS()) how = `<p class="home-sub">Safariの <b>共有ボタン（□に↑）</b> →「<b>ホーム画面に追加</b>」で、アプリのように1タップで開けます。</p>`;
    else how = `<p class="home-sub">ブラウザのメニューから「<b>ホーム画面に追加</b>」または「<b>アプリをインストール</b>」を選ぶと、アプリのように1タップで開けます。</p>`;
    box.hidden = false;
    box.innerHTML = `
      <h2 class="home-h2">📲 ホーム画面に追加して、アプリのように使う</h2>
      <p class="home-sub">ワンタップで開けて、電波が弱いホールでも収支ノートと計算機が使えます。無料・登録不要です。</p>
      ${how}
      <p class="calc-foot">※iPhoneでは、Safariで保存した記録がホーム画面から開く版に表示されないことがあります（保存領域が別になるため）。記録をつけ始める前に追加するか、収支ノートの「引き継ぎコード」やバックアップで移してください。</p>
      <button type="button" class="link-btn" id="install-dismiss">今は表示しない</button>`;
  }
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; renderInstall(); });
  window.addEventListener("appinstalled", () => { deferredPrompt = null; $("install-box").hidden = true; track("pwa_installed", {}); });
  document.addEventListener("click", async (e) => {
    if (e.target.id === "install-go" && deferredPrompt) {
      deferredPrompt.prompt();
      try { const r = await deferredPrompt.userChoice; track("pwa_install_prompt", { outcome: r.outcome }); } catch (err) { /* 無視 */ }
      deferredPrompt = null; renderInstall();
    } else if (e.target.id === "install-dismiss") {
      try { localStorage.setItem(DISMISS_KEY, "1"); } catch (err) { /* 保存不可でも今回は閉じる */ }
      $("install-box").hidden = true;
    }
  });

  /* ---------------- サービスワーカー ---------------- */
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => { /* 非対応・失敗でもサイトは動く */ }); });
  }

  renderTop3();
  fillAds();
  renderInstall();
})();
