/* サイトメニュー（三本線）／ボーダー計算機／ボーダーが甘い機種ランキング。
   ボーダーの数値は borders.js（DMMぱちタウンの掲載値をそのまま転記）だけを使い、自前の推測値は持たない。
   式：期待値(1,000円あたり) = 1,000 × (実回転数 ÷ ボーダー − 1)
      （ボーダー＝期待値0になる回転数。1回転の価値が 1,000÷ボーダー 円で一定なので、回転数に比例して増減する） */

(function () {
  "use strict";

  const PACHINKO_LABELS = SPEC_LABELS.pachinko;
  const CAT_ORDER = ["amadegi", "lightmiddle", "middle", "highspec"];
  const RANK_STEP = 15;

  function fmtDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return `${y}年${m}月${d}日`;
  }
  document.querySelectorAll(".border-asof").forEach((el) => { el.textContent = fmtDate(BORDERS_AS_OF); });

  function entryTitle(e) {
    return e.label ? `${e.name}【${e.label}】` : e.name;
  }
  function sourceUrl(e) {
    return `https://p-town.dmm.com/machines/${e.id}/border`;
  }
  function signed(n, digits) {
    const s = Math.abs(n).toLocaleString("ja-JP", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    if (Number(s.replace(/,/g, "")) === 0) return s;
    return (n > 0 ? "+" : "−") + s;
  }

  /* ---------------- メニュー（三本線） ---------------- */
  const menuBtn = document.getElementById("menu-btn");
  const menuEl = document.getElementById("site-menu");
  const overlayEl = document.getElementById("menu-overlay");
  const closeBtn = document.getElementById("menu-close");

  function menuItems() {
    return Array.from(menuEl.querySelectorAll(".menu-item, .menu-close"));
  }
  function openMenu() {
    menuEl.hidden = false;
    overlayEl.hidden = false;
    void menuEl.offsetWidth;
    menuEl.classList.add("open");
    overlayEl.classList.add("open");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", "メニューを閉じる");
    document.body.classList.add("menu-open");
    (menuEl.querySelector(".menu-item") || closeBtn).focus();
  }
  function closeMenu(restoreFocus) {
    if (menuEl.hidden) return;
    menuEl.classList.remove("open");
    overlayEl.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "メニューを開く");
    document.body.classList.remove("menu-open");
    setTimeout(() => {
      if (!menuEl.classList.contains("open")) { menuEl.hidden = true; overlayEl.hidden = true; }
    }, 220);
    if (restoreFocus) menuBtn.focus();
  }
  menuBtn.addEventListener("click", () => (menuEl.hidden || !menuEl.classList.contains("open") ? openMenu() : closeMenu(true)));
  closeBtn.addEventListener("click", () => closeMenu(true));
  overlayEl.addEventListener("click", () => closeMenu(false));
  document.addEventListener("keydown", (e) => {
    if (menuEl.hidden) return;
    if (e.key === "Escape") { closeMenu(true); return; }
    if (e.key === "Tab") {
      const items = menuItems();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------------- 画面移動 ---------------- */
  function navigate(name) {
    if (name === "about") {
      const about = document.getElementById("about");
      const d = about.querySelector("details");
      if (d) d.open = true;
      about.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (name === "amida") document.getElementById("btn-goto-amida").click();
    else if (name === "gamble") document.getElementById("btn-goto-gamble").click();
    else if (name === "calc") openCalc();
    else if (name === "rank") openRank();
    else if (window.PS_NAV && typeof window.PS_NAV[name] === "function") window.PS_NAV[name]();
    else showScreen("intro");
    window.scrollTo(0, 0);
  }
  document.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-nav]");
    if (!nav) return;
    const inMenu = !!nav.closest("#site-menu");
    track("nav_click", { target: nav.dataset.nav, from: inMenu ? "menu" : "page" });
    closeMenu(false);
    navigate(nav.dataset.nav);
  });
  menuEl.querySelectorAll("a.menu-item").forEach((a) => a.addEventListener("click", () => closeMenu(false)));

  /* ---------------- ボーダー計算機 ---------------- */
  const calcSearch = document.getElementById("calc-search");
  const calcSuggest = document.getElementById("calc-suggest");
  const calcSearchRow = document.getElementById("calc-search-row");
  const calcPicked = document.getElementById("calc-picked");
  const calcPickedName = document.getElementById("calc-picked-name");
  const calcExchange = document.getElementById("calc-exchange");
  const calcExchangeRow = document.getElementById("calc-exchange-row");
  const calcManualRow = document.getElementById("calc-manual-row");
  const calcManual = document.getElementById("calc-manual");
  const calcManualToggle = document.getElementById("calc-manual-toggle");
  const calcInfo = document.getElementById("calc-border-info");
  const calcRate = document.getElementById("calc-rate");
  const calcHour = document.getElementById("calc-spins-hour");
  const calcResult = document.getElementById("calc-result");
  let calcTracked = false;
  // null=未選択 / "manual"=手入力 / 数値=BORDER_DATAの添字
  let calcSel = null;
  let suggestItems = [];
  let suggestActive = -1;

  calcExchange.innerHTML = BORDER_EXCHANGES.map((x, i) => `<option value="${i}">${escapeHTML(x.label)}</option>`).join("");

  // 検索用の正規化：全角半角・大文字小文字・カタカナ/ひらがな・空白や記号の差を吸収する
  function normalize(s) {
    return String(s).normalize("NFKC").toLowerCase()
      .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
      .replace(/[^\p{L}\p{N}ー]/gu, "");
  }
  const searchIndex = BORDER_DATA.map((e, i) => ({
    i,
    name: normalize(e.name + e.label),
    kana: normalize(e.kana || ""),
  }));
  const noDataIndex = BORDER_NO_DATA.map((n) => ({ n, name: normalize(n) }));

  // 空白区切りは AND 検索。名前・読みの先頭に近い一致を上位にする
  function runSearch(q) {
    const tokens = String(q).normalize("NFKC").split(/\s+/).map(normalize).filter(Boolean);
    if (!tokens.length) return { hits: [], noData: [] };
    const scored = [];
    // 機種名の頭の「e」「P」「PA」（スマパチ/通常機の区別）を付けて入力されても探せるようにする
    const pos = (hay, t) => {
      let p = hay.indexOf(t);
      if (p < 0 && /^(pa|p|e)./.test(t)) p = hay.indexOf(t.replace(/^(pa|p|e)/, ""));
      return p;
    };
    searchIndex.forEach((x) => {
      let score = 0;
      for (const t of tokens) {
        const inName = pos(x.name, t);
        const inKana = pos(x.kana, t);
        if (inName < 0 && inKana < 0) return;
        score += Math.min(inName < 0 ? 99 : inName, inKana < 0 ? 99 : inKana);
      }
      scored.push({ i: x.i, score });
    });
    scored.sort((a, b) => a.score - b.score || a.i - b.i);
    const noData = noDataIndex.filter((x) => tokens.every((t) => x.name.indexOf(t) >= 0)).map((x) => x.n);
    return { hits: scored.map((s) => s.i), noData };
  }

  function entryOptionHTML(i, idx) {
    const e = BORDER_DATA[i];
    return `<li role="option" id="calc-opt-${idx}" data-i="${i}" aria-selected="${idx === suggestActive}"${idx === suggestActive ? ' class="active"' : ""}><span class="sg-name">${escapeHTML(e.name)}${e.label ? `<small>【${escapeHTML(e.label)}】</small>` : ""}</span><span class="sg-meta">${escapeHTML(PACHINKO_LABELS[e.cat])}・等価${e.b[0]}回転</span></li>`;
  }

  function renderSuggest() {
    const q = calcSearch.value;
    if (!q.trim()) { hideSuggest(); return; }
    const { hits, noData } = runSearch(q);
    suggestItems = hits.slice(0, 30);
    if (suggestActive >= suggestItems.length) suggestActive = suggestItems.length - 1;
    let html = suggestItems.map((i, idx) => entryOptionHTML(i, idx)).join("");
    if (hits.length > 30) html += `<li class="sg-note">他${hits.length - 30}件。もう少し文字を足して絞り込んでください。</li>`;
    if (!hits.length && !noData.length) {
      html = `<li class="sg-note">該当する機種がありません。名前の一部や、ひらがなで試してみてください。</li>`;
    }
    noData.forEach((n) => { html += `<li class="sg-note">${escapeHTML(n)}：DMMぱちタウンにボーダーの掲載がないため計算できません。</li>`; });
    calcSuggest.innerHTML = html;
    calcSuggest.hidden = false;
    calcSearch.setAttribute("aria-expanded", "true");
  }
  function hideSuggest() {
    calcSuggest.hidden = true;
    calcSuggest.innerHTML = "";
    suggestItems = [];
    suggestActive = -1;
    calcSearch.setAttribute("aria-expanded", "false");
    calcSearch.removeAttribute("aria-activedescendant");
  }
  function setActive(n) {
    if (!suggestItems.length) return;
    suggestActive = (n + suggestItems.length) % suggestItems.length;
    calcSuggest.querySelectorAll("li[role=option]").forEach((li, idx) => {
      li.classList.toggle("active", idx === suggestActive);
      li.setAttribute("aria-selected", idx === suggestActive);
    });
    const li = document.getElementById(`calc-opt-${suggestActive}`);
    calcSearch.setAttribute("aria-activedescendant", li.id);
    li.scrollIntoView({ block: "nearest" });
  }

  function selectEntry(i) {
    calcSel = i;
    calcExchange.value = "0";
    calcSearch.value = "";
    hideSuggest();
    renderCalc();
    calcRate.focus();
  }
  function clearSelection() {
    calcSel = null;
    renderCalc();
    calcSearch.focus();
  }

  calcSearch.addEventListener("input", () => { suggestActive = -1; renderSuggest(); });
  calcSearch.addEventListener("focus", renderSuggest);
  calcSearch.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (calcSuggest.hidden) renderSuggest(); setActive(suggestActive + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(suggestActive - 1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestActive >= 0) selectEntry(suggestItems[suggestActive]);
      else if (suggestItems.length === 1) selectEntry(suggestItems[0]);
    } else if (e.key === "Escape") hideSuggest();
  });
  // mousedown で選ぶ（blurより先に処理して、タップでも確実に選べるようにする）
  calcSuggest.addEventListener("mousedown", (e) => {
    const li = e.target.closest("li[data-i]");
    if (!li) return;
    e.preventDefault();
    selectEntry(Number(li.dataset.i));
  });
  document.addEventListener("click", (e) => {
    if (!calcSearchRow.contains(e.target)) hideSuggest();
  });
  document.getElementById("calc-change").addEventListener("click", clearSelection);
  calcManualToggle.addEventListener("click", () => {
    if (calcSel === "manual") { calcSel = null; renderCalc(); calcSearch.focus(); }
    else { calcSel = "manual"; hideSuggest(); renderCalc(); calcManual.focus(); }
  });

  // 現在の入力から {border, entry, ...} を返す
  function currentBorder() {
    if (calcSel === "manual") {
      const b = parseFloat(calcManual.value);
      if (!Number.isFinite(b)) return { border: null, hint: "ボーダーを入力してください。" };
      if (b < 1 || b > 60) return { border: null, hint: "ボーダーは1〜60の範囲で入力してください。" };
      return { border: b, manual: true };
    }
    if (calcSel == null) return { border: null, hint: "機種を検索して選ぶと、ボーダーが表示されます。" };
    const e = BORDER_DATA[calcSel];
    const ex = BORDER_EXCHANGES[Number(calcExchange.value)];
    const b = e.b[Number(calcExchange.value)];
    if (b == null) return { border: null, entry: e, hint: `この機種の「${ex.label}」のボーダーはDMMぱちタウンに掲載がありません。` };
    return { border: b, entry: e, ex };
  }

  function renderCalc() {
    const manual = calcSel === "manual";
    const picked = typeof calcSel === "number";
    calcSearchRow.hidden = picked || manual;
    calcPicked.hidden = !picked;
    if (picked) calcPickedName.textContent = entryTitle(BORDER_DATA[calcSel]);
    calcManualRow.hidden = !manual;
    calcExchangeRow.hidden = !picked;
    calcManualToggle.textContent = manual ? "機種を検索して選ぶ" : "機種を選ばず、ボーダーを自分で入力する";
    calcManualToggle.parentElement.hidden = picked;
    const cb = currentBorder();

    if (cb.border == null) {
      calcInfo.textContent = cb.hint || "";
    } else if (cb.manual) {
      calcInfo.innerHTML = `ボーダー：<b>${cb.border}回転</b>／1,000円（入力値）`;
    } else {
      const e = cb.entry;
      const cond = e.sapo ? `電サポ中の出玉増減 ${escapeHTML(e.sapo)}` : "条件の記載なし";
      calcInfo.innerHTML = `ボーダー：<b>${cb.border}回転</b>／1,000円（${escapeHTML(cb.ex.label)}）<br><small>DMMぱちタウン掲載値・${cond}・${fmtDate(BORDERS_AS_OF)}取得　<a href="${sourceUrl(e)}" target="_blank" rel="noopener">出典を見る</a></small>`;
    }

    const r = parseFloat(calcRate.value);
    if (cb.border == null || calcRate.value === "") { calcResult.innerHTML = ""; return; }
    if (!Number.isFinite(r) || r < 1 || r > 60) {
      calcResult.innerHTML = `<p class="calc-error">実際の回転数（1,000円あたり）は1〜60の範囲で入力してください。</p>`;
      return;
    }
    const B = cb.border;
    const diff = r - B;
    const ev1000 = 1000 * (r / B - 1);
    const hour = parseFloat(calcHour.value);
    const hourOk = Number.isFinite(hour) && hour >= 50 && hour <= 500;
    const wage = hourOk ? hour * (1000 / B - 1000 / r) : null;

    const state = Math.abs(diff) < 0.05 ? "even" : diff > 0 ? "plus" : "minus";
    const verdict = { even: "ボーダーちょうど（期待値はほぼ0）", plus: "ボーダー超え（理論上プラス）", minus: "ボーダー割れ（理論上マイナス）" }[state];
    const row = (label, val, cls) => `<div class="calc-row"><span>${label}</span><b class="${cls || ""}">${val}</b></div>`;
    calcResult.innerHTML = `
      <div class="calc-verdict ${state}">${verdict}</div>
      ${row("ボーダーとの差", `${signed(diff, 1)} 回転／1,000円`, state)}
      ${row("期待値（1,000円あたり）", `${signed(Math.round(ev1000), 0)} 円`, state)}
      ${row("期待値（10,000円あたり）", `${signed(Math.round(ev1000 * 10), 0)} 円`, state)}
      ${wage == null ? row("期待値（時給）", "1時間あたりの回転数を50〜500で入力してください") : row(`期待値（時給・${hour}回転/時）`, `${signed(Math.round(wage), 0)} 円`, state)}
      <p class="calc-foot">期待値は長期の平均で、短期の勝ち負けを保証するものではありません。${cb.manual || !cb.entry || cb.ex.label.startsWith("等価") ? "" : "非等価はDMMの前提にもとづく目安です。"}</p>`;
    if (!calcTracked) { calcTracked = true; track("border_calc", { mode: cb.manual ? "manual" : "machine" }); }
  }

  [calcExchange, calcManual, calcRate, calcHour].forEach((el) => {
    el.addEventListener("input", renderCalc);
    el.addEventListener("change", renderCalc);
  });
  document.getElementById("calc-form").addEventListener("submit", (e) => e.preventDefault());

  function openCalc(entryIndex) {
    if (entryIndex != null) { calcSel = entryIndex; calcExchange.value = "0"; }
    renderCalc();
    showScreen("calc");
  }
  window.PS_CALC_OPEN = openCalc;   // 機種カタログから「この台で計算する」で使う

  /* ---------------- ボーダーが甘い機種ランキング ---------------- */
  const rankTabs = document.getElementById("rank-tabs");
  const rankList = document.getElementById("rank-list");
  const rankMoreWrap = document.getElementById("rank-more-wrap");
  const rankMore = document.getElementById("rank-more");
  const rankOther = document.getElementById("rank-include-other");
  const rankState = { cat: "all", shown: RANK_STEP };

  function rankItems() {
    return BORDER_DATA.map((e, i) => ({ e, i }))
      .filter((x) => x.e.rank && x.e.b[0] != null)
      .filter((x) => rankOther.checked || x.e.sapo === "-5%")
      .filter((x) => rankState.cat === "all" || x.e.cat === rankState.cat)
      .sort((a, b) => a.e.b[0] - b.e.b[0] || a.e.name.localeCompare(b.e.name, "ja"));
  }

  function renderRankTabs() {
    const base = BORDER_DATA.filter((e) => e.rank && e.b[0] != null && (rankOther.checked || e.sapo === "-5%"));
    const tabs = [{ key: "all", label: "すべて", n: base.length }]
      .concat(CAT_ORDER.map((c) => ({ key: c, label: PACHINKO_LABELS[c], n: base.filter((e) => e.cat === c).length })));
    rankTabs.innerHTML = tabs.map((t) =>
      `<button type="button" role="tab" class="rank-tab${t.key === rankState.cat ? " active" : ""}" aria-selected="${t.key === rankState.cat}" data-cat="${t.key}">${escapeHTML(t.label)}<small>${t.n}</small></button>`).join("");
  }

  function renderRank() {
    renderRankTabs();
    const items = rankItems();
    const shown = items.slice(0, rankState.shown);
    let html = "";
    shown.forEach((x, idx) => {
      // 同じボーダーは同順位（1, 2, 2, 4…）
      let pos = idx;
      while (pos > 0 && items[pos - 1].e.b[0] === x.e.b[0]) pos--;
      const e = x.e;
      const cond = rankOther.checked && e.sapo ? ` ／ 電サポ出玉増減 ${escapeHTML(e.sapo)}` : "";
      html += `<li class="rank-item">
        <span class="rank-no">${pos + 1}</span>
        <div class="rank-main">
          <p class="rank-name">${escapeHTML(e.name)}${e.label ? `<small>【${escapeHTML(e.label)}】</small>` : ""}</p>
          <p class="rank-meta">${escapeHTML(PACHINKO_LABELS[e.cat])}${cond}</p>
          <p class="rank-actions"><button type="button" class="link-btn" data-calc="${x.i}">この台で計算する</button><a href="${sourceUrl(e)}" target="_blank" rel="noopener">出典</a></p>
        </div>
        <div class="rank-val"><b>${e.b[0].toFixed(1)}</b><small>回転</small></div>
      </li>`;
    });
    rankList.innerHTML = html || `<li class="rank-empty">該当する機種がありません。</li>`;
    rankMoreWrap.hidden = items.length <= rankState.shown;
    if (items.length > rankState.shown) rankMore.textContent = `もっと見る（残り${items.length - rankState.shown}件）`;
  }

  rankTabs.addEventListener("click", (e) => {
    const t = e.target.closest(".rank-tab");
    if (!t) return;
    rankState.cat = t.dataset.cat;
    rankState.shown = RANK_STEP;
    renderRank();
  });
  rankOther.addEventListener("change", () => { rankState.shown = RANK_STEP; renderRank(); });
  rankMore.addEventListener("click", () => { rankState.shown += RANK_STEP; renderRank(); });
  rankList.addEventListener("click", (e) => {
    const b = e.target.closest("[data-calc]");
    if (!b) return;
    openCalc(Number(b.dataset.calc));
    window.scrollTo(0, 0);
    track("rank_to_calc", {});
  });

  document.getElementById("rank-nodata").textContent =
    `DMMぱちタウンにボーダーの掲載がなく、並べていない機種：${BORDER_NO_DATA.join("、")}（${fmtDate(BORDERS_AS_OF)}時点）`;

  function openRank() {
    renderRank();
    showScreen("rank");
    track("rank_view", {});
  }

  /* ---------------- URLのハッシュで直接開く（#calc / #rank） ---------------- */
  if (!new URLSearchParams(location.search).has("c")) {
    if (location.hash === "#calc") openCalc();
    else if (location.hash === "#rank") openRank();
  }
})();
