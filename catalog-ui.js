/* 機種カタログ。MACHINES（機種名・区分）＋ catalog.js（DMM ID・読み仮名）＋ borders.js（ボーダー）＋ reviews.js（口コミ）を
   機種ごとにまとめて見せる。数値はいずれも各データファイルの転記で、ここでは計算・推測しない。 */

// 検索用の正規化：全角半角・大文字小文字・カタカナ/ひらがな・空白や記号の差を吸収する（ledger.jsでも使う）
function normalizeSearch(s) {
  return String(s).normalize("NFKC").toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[^\p{L}\p{N}ー]/gu, "");
}

(function () {
  "use strict";

  const TYPE_LABEL = { pachinko: "パチンコ", slot: "スロット" };
  const PAGE = 20;

  /* ---------------- 機種リストの組み立て ---------------- */
  // 機種データベース（machine-db.js）の全機種：いまホールに設置されている機種＋新台・導入予定
  const list = [];
  const byName = new Map();
  const bordersByName = new Map();
  BORDER_DATA.forEach((e, i) => { if (!bordersByName.has(e.name)) bordersByName.set(e.name, []); bordersByName.get(e.name).push({ e, i }); });
  const TODAY = new Date();
  const NEW_DAYS = 180;
  MACHINE_ROWS.forEach((r) => {
    const introDate = r.intro ? new Date(r.intro + "T00:00:00") : null;
    const it = {
      name: r.name, type: r.type, specs: [r.spec], machine: r.desc ? { name: r.name, desc: r.desc } : r.name, id: r.id,
      nameN: normalizeSearch(r.name), kanaN: normalizeSearch(r.kana || ""),
      borders: bordersByName.get(r.name) || [],
      shops: r.shops, intro: r.intro, introDate,
      isFuture: !!(introDate && introDate > TODAY),
      isNew: !!(introDate && introDate <= TODAY && (TODAY - introDate) / 86400000 <= NEW_DAYS),
    };
    byName.set(r.name, it);
    list.push(it);
  });

  // 機種名の頭の「e」「P」「PA」を付けて入力されても探せるようにする
  function pos(hay, t) {
    let p = hay.indexOf(t);
    if (p < 0 && /^(pa|p|e)./.test(t)) p = hay.indexOf(t.replace(/^(pa|p|e)/, ""));
    return p;
  }
  // 空白区切りはAND検索。名前・読みの先頭に近い一致を上位にする。type=""なら全種別
  // 並び順：popular=設置店舗数が多い順／new=導入が新しい順／name=読み仮名順
  function sortList(arr, sort) {
    const a = arr.slice();
    if (sort === "new") a.sort((x, y) => (y.intro || "").localeCompare(x.intro || "") || y.shops - x.shops);
    else if (sort === "name") a.sort((x, y) => (x.kanaN || x.nameN).localeCompare(y.kanaN || y.nameN, "ja"));
    else a.sort((x, y) => y.shops - x.shops || (y.intro || "").localeCompare(x.intro || ""));
    return a;
  }
  function searchCatalog(q, type, sort) {
    const tokens = String(q).normalize("NFKC").split(/\s+/).map(normalizeSearch).filter(Boolean);
    const pool = sortList(type ? list.filter((x) => x.type === type) : list, sort || "popular");
    if (!tokens.length) return pool;
    const scored = [];
    pool.forEach((x, idx) => {
      let score = 0;
      for (const t of tokens) {
        const a = pos(x.nameN, t);
        const b = pos(x.kanaN, t);
        if (a < 0 && b < 0) return;
        score += Math.min(a < 0 ? 99 : a, b < 0 ? 99 : b);
      }
      scored.push({ x, score, idx });
    });
    scored.sort((p, q2) => p.score - q2.score || p.idx - q2.idx);
    return scored.map((s) => s.x);
  }

  document.querySelectorAll(".reviews-asof").forEach((el) => { el.textContent = typeof REVIEWS_AS_OF === "string" ? REVIEWS_AS_OF : ""; });

  /* ---------------- 一覧 ---------------- */
  const tabsEl = document.getElementById("cat-tabs");
  const searchEl = document.getElementById("cat-search");
  const countEl = document.getElementById("cat-count");
  const listEl = document.getElementById("cat-list");
  const moreWrap = document.getElementById("cat-more-wrap");
  const moreBtn = document.getElementById("cat-more");
  const listView = document.getElementById("cat-list-view");
  const detailView = document.getElementById("cat-detail-view");
  const sortEl = document.getElementById("cat-sort");
  const st = { type: "", shown: PAGE };

  // 設置状況のチップ：設置店舗数（DMMぱちタウン）、新台、導入予定
  function statusChips(it) {
    let h = "";
    if (it.isFuture) h += `<span class="cat-chip cat-chip-new">導入予定 ${escapeHTML(it.intro.replace(/-/g, "/"))}</span>`;
    else if (it.isNew) h += `<span class="cat-chip cat-chip-new">新台</span>`;
    if (!it.isFuture && it.shops > 0) h += `<span class="cat-chip cat-chip-shops">設置 ${it.shops.toLocaleString("ja-JP")}店</span>`;
    return h;
  }

  function borderChip(it) {
    const vals = it.borders.filter((x) => x.e.b[0] != null && !x.e.odd && !/^設定/.test(x.e.label)).map((x) => x.e.b[0]);
    if (!vals.length) return "";
    const lo = Math.min(...vals), hi = Math.max(...vals);
    return `<span class="cat-chip">等価${lo === hi ? lo : `${lo}〜${hi}`}回転</span>`;
  }

  function renderTabs() {
    const n = (t) => list.filter((x) => !t || x.type === t).length;
    const tabs = [["", "すべて"], ["pachinko", "パチンコ"], ["slot", "スロット"]];
    tabsEl.innerHTML = tabs.map(([k, label]) =>
      `<button type="button" role="tab" class="rank-tab${k === st.type ? " active" : ""}" aria-selected="${k === st.type}" data-type="${k}">${label}<small>${n(k)}</small></button>`).join("");
  }

  function renderList() {
    renderTabs();
    const q = searchEl.value;
    const hits = searchCatalog(q, st.type, sortEl.value);
    const shown = hits.slice(0, st.shown);
    countEl.textContent = q.trim() ? `「${q.trim()}」の検索結果：${hits.length}機種` : `${hits.length}機種`;
    listEl.innerHTML = shown.map((it) => {
      const specs = it.specs.map((s) => SPEC_LABELS[it.type][s]).join("・");
      return `<li><button type="button" class="cat-item" data-name="${escapeHTML(it.name)}">
        <span class="cat-item-name">${escapeHTML(it.name)}</span>
        <span class="cat-item-meta">${TYPE_LABEL[it.type]}／${escapeHTML(specs)}</span>
        <span class="cat-item-chips">${statusChips(it)}${borderChip(it)}${reviewMiniHTML(it.machine)}</span>
      </button></li>`;
    }).join("") || `<li class="rank-empty">該当する機種がありません。名前の一部や、ひらがなで試してみてください。</li>`;
    moreWrap.hidden = hits.length <= st.shown;
    if (hits.length > st.shown) moreBtn.textContent = `もっと見る（残り${hits.length - st.shown}件）`;
  }

  tabsEl.addEventListener("click", (e) => {
    const t = e.target.closest(".rank-tab");
    if (!t) return;
    st.type = t.dataset.type;
    st.shown = PAGE;
    renderList();
  });
  searchEl.addEventListener("input", () => { st.shown = PAGE; renderList(); });
  sortEl.addEventListener("change", () => { st.shown = PAGE; renderList(); });
  moreBtn.addEventListener("click", () => { st.shown += PAGE; renderList(); });
  listEl.addEventListener("click", (e) => {
    const b = e.target.closest(".cat-item");
    if (b) openMachine(b.dataset.name);
  });

  /* ---------------- 詳細 ---------------- */
  function borderBlockHTML(it) {
    if (it.type !== "pachinko") {
      return `<div class="cat-block"><h2>ボーダー</h2><p class="calc-foot">スロットは「ボーダー（1,000円あたりの回転数）」ではなく、設定や天井などで期待値を考えるため、ボーダーは掲載していません。</p></div>`;
    }
    if (!it.borders.length) {
      return `<div class="cat-block"><h2>ボーダー</h2><p class="calc-foot">この機種のボーダーはDMMぱちタウンに掲載がないため、載せていません。</p></div>`;
    }
    const blocks = it.borders.map(({ e, i }) => {
      const rows = BORDER_EXCHANGES.map((x, k) => e.b[k] == null ? "" :
        `<tr><th>${escapeHTML(x.label)}</th><td>${e.b[k]}回転</td></tr>`).join("");
      const cond = e.sapo ? `電サポ中の出玉増減 ${escapeHTML(e.sapo)}` : (e.note ? escapeHTML(e.note) : "条件の記載なし");
      return `${e.label ? `<h3 class="cat-sub">${escapeHTML(e.label)}</h3>` : ""}
        <table class="cat-table"><tbody>${rows}</tbody></table>
        <p class="calc-foot">1,000円（250玉）あたりの回転数の目安。${cond}／<a href="https://p-town.dmm.com/machines/${e.id}/border" target="_blank" rel="noopener nofollow">出典：DMMぱちタウン</a>（<span>${fmtBorderDate()}</span>取得）</p>
        ${e.odd ? `<p class="calc-error">このボーダー値は、一般的な範囲（8〜60回転）から外れているか、DMMの表の数値に矛盾があるため、参考にならない可能性があります。期待値の計算には使えません（ハネモノ・一発台など特殊な機種のことがあります）。</p>`
          : `<button type="button" class="btn-secondary cat-calc" data-i="${i}">この台のボーダーで期待値を計算する</button>`}`;
    }).join("");
    return `<div class="cat-block"><h2>ボーダー（1,000円あたりの回転数）</h2>${blocks}</div>`;
  }
  function fmtBorderDate() {
    const [y, m, d] = BORDERS_AS_OF.split("-").map(Number);
    return `${y}年${m}月${d}日`;
  }

  function openMachine(name) {
    const it = byName.get(name);
    if (!it) return;
    const spec = it.specs[0];
    const custom = typeof it.machine === "object";
    const specs = it.specs.map((s) => SPEC_LABELS[it.type][s]).join("・");
    const links = [];
    if (it.id) links.push(`<a href="https://p-town.dmm.com/machines/${it.id}" target="_blank" rel="noopener nofollow">DMMぱちタウンの機種ページ</a>`);
    links.push(`<a href="https://www.google.com/search?q=${encodeURIComponent(name + " 機種情報")}" target="_blank" rel="noopener">ウェブで検索</a>`);
    detailView.innerHTML = `
      <button type="button" class="step-back" id="cat-back">← 機種一覧へ</button>
      <h1 class="cat-title">${escapeHTML(name)}</h1>
      <p class="cat-tags"><span class="cat-chip">${TYPE_LABEL[it.type]}</span><span class="cat-chip">${escapeHTML(specs)}</span></p>
      <p class="cat-install">${it.isFuture ? `🆕 導入予定：${escapeHTML(it.intro.replace(/-/g, "/"))}（まだホールには設置されていません）` : `導入日：${escapeHTML((it.intro || "不明").replace(/-/g, "/"))}${it.shops > 0 ? `／設置店舗数：${it.shops.toLocaleString("ja-JP")}店` : ""}`}<br><small>設置店舗数はDMMぱちタウンの掲載値（${MACHINE_DB_ASOF.replace(/-/g, "/")}取得）で、実際の設置状況は店舗により異なります。</small></p>
      <p class="cat-desc">${escapeHTML(machineDesc(it.machine, it.type, spec))}</p>
      ${custom ? "" : `<p class="calc-foot">※説明は、この機種が属する区分の一般的な特徴です。</p>`}
      ${borderBlockHTML(it)}
      <div class="cat-block">${reviewBoxHTML(it.machine) || `<p class="calc-foot">この機種のDMMぱちタウンの口コミ情報はありません。</p>`}</div>
      <div class="cat-block" id="cat-vote"></div>
      <div class="ad-slot" id="cat-ad" hidden></div>
      <div class="cat-actions">
        <button type="button" class="btn-primary" id="cat-to-ledger">📒 この機種で収支ノートに記録する</button>
      </div>
      <p class="calc-foot cat-links">${links.join("　")}</p>
      <p class="calc-foot">掲載値・口コミは参考情報で、出玉や勝ちを保証するものではありません。20歳未満の方は遊技できません。出典・計算方法・訂正のご依頼は<a href="./data.html">データの出典・免責</a>をご覧ください。</p>`;
    listView.hidden = true;
    detailView.hidden = false;
    renderVoteBox(document.getElementById("cat-vote"), it.machine);
    const adEl = document.getElementById("cat-ad");
    adEl.innerHTML = adSlotHTML("jacard", "クレジットカードを作るなら。新規入会キャンペーンの条件は公式サイトでご確認ください。", "catalog");
    adEl.hidden = !adEl.innerHTML;
    detailView.querySelector("#cat-back").addEventListener("click", closeDetail);
    detailView.querySelector("#cat-to-ledger").addEventListener("click", () => {
      if (window.PS_LEDGER) window.PS_LEDGER.openWith(it.name, it.type);
    });
    detailView.querySelectorAll(".cat-calc").forEach((b) => b.addEventListener("click", () => {
      if (window.PS_CALC_OPEN) { window.PS_CALC_OPEN(Number(b.dataset.i)); window.scrollTo(0, 0); }
    }));
    track("catalog_machine_view", { type: it.type });
    window.scrollTo(0, 0);
  }
  function closeDetail() {
    detailView.hidden = true;
    detailView.innerHTML = "";
    listView.hidden = false;
    window.scrollTo(0, 0);
  }

  function openCatalog() {
    closeDetail();
    renderList();
    showScreen("catalog");
    track("catalog_view", {});
  }

  window.PS_CATALOG = { list, byName, search: searchCatalog, openMachine: (n) => { renderList(); showScreen("catalog"); openMachine(n); } };
  window.PS_NAV = window.PS_NAV || {};
  window.PS_NAV.catalog = openCatalog;

  if (!new URLSearchParams(location.search).has("c") && location.hash === "#catalog") openCatalog();
})();
