/* 収支ノート＋占い履歴。保存先はこのブラウザの localStorage だけ（ユーザー登録なし・サーバー送信なし）。
   端末をまたぐ引き継ぎはできないため、JSON書き出し／読み込みでバックアップできるようにしている。 */

(function () {
  "use strict";

  const KEY = "pslab_ledger_v1";
  const MAX_FORTUNES_PER_DAY = 8;
  const MAX_FORTUNE_DAYS = 400;
  const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
  const KIND_ICON = { diagnosis: "🔮", amida: "🪢", gamble: "🔥" };

  const $ = (id) => document.getElementById(id);
  const el = {
    warn: $("ledger-warn"), summary: $("ledger-summary"), formTitle: $("ledger-form-title"), form: $("ledger-form"),
    date: $("lg-date"), hint: $("lg-fortune-hint"), type: $("lg-type"), machine: $("lg-machine"), suggest: $("lg-suggest"),
    machineRow: $("lg-machine-row"), invest: $("lg-invest"), recover: $("lg-recover"), rate: $("lg-rate"), rateRow: $("lg-rate-row"),
    memo: $("lg-memo"), diff: $("lg-diff"), error: $("lg-error"), submit: $("lg-submit"), cancel: $("lg-cancel"),
    list: $("ledger-list"), fortunes: $("ledger-fortunes"), insight: $("ledger-insight"),
    exportJson: $("lg-export-json"), exportCsv: $("lg-export-csv"), importBtn: $("lg-import"), importFile: $("lg-import-file"),
    clear: $("lg-clear"), toolsMsg: $("lg-tools-msg"), backup: $("ledger-backup"), persist: $("ledger-persist"),
  };
  const EXPORT_KEY = "pslab_last_export";
  const BACKUP_NUDGE_DAYS = 14;

  /* ---------------- 保存 ---------------- */
  let data = { v: 1, entries: [], fortunes: {}, del: {} };
  let storageOk = true;
  let editingId = null;

  const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + "T00:00:00").getTime());
  const clampStr = (s, n) => String(s == null ? "" : s).slice(0, n);
  const intIn = (v, lo, hi) => { const n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };

  // 読み込んだ／取り込んだデータを検証して、想定した形のものだけ残す
  function sanitize(o) {
    const out = { v: 1, entries: [], fortunes: {}, del: {} };
    if (!o || typeof o !== "object") return out;
    // 削除済みの記録（端末をまたいだ同期で、消した記録が復活しないための印）
    if (o.del && typeof o.del === "object") {
      Object.keys(o.del).slice(0, 5000).forEach((k) => { const t = Number(o.del[k]); if (Number.isFinite(t) && t > 0) out.del[clampStr(k, 40)] = t; });
    }
    (Array.isArray(o.entries) ? o.entries : []).forEach((e) => {
      if (!e || !isDate(e.date)) return;
      const invest = intIn(e.invest, 0, 9999999), recover = intIn(e.recover, 0, 9999999);
      if (invest == null || recover == null) return;
      const rate = e.rate == null || e.rate === "" ? null : Number(e.rate);
      out.entries.push({
        id: clampStr(e.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7)), 40),
        date: e.date,
        type: e.type === "slot" ? "slot" : "pachinko",
        machine: clampStr(e.machine, 60),
        invest, recover,
        rate: Number.isFinite(rate) && rate >= 1 && rate <= 60 ? rate : null,
        memo: clampStr(e.memo, 200),
        u: Number.isFinite(Number(e.u)) && Number(e.u) > 0 ? Number(e.u) : 0,   // 最終更新時刻（同期でどちらが新しいか決める）
      });
    });
    const f = o.fortunes && typeof o.fortunes === "object" ? o.fortunes : {};
    Object.keys(f).forEach((d) => {
      if (!isDate(d) || !Array.isArray(f[d])) return;
      const arr = f[d].filter((r) => r && ["diagnosis", "amida", "gamble"].includes(r.kind)).slice(-MAX_FORTUNES_PER_DAY).map((r) => ({
        kind: r.kind, rank: clampStr(r.rank, 4), catchphrase: clampStr(r.catchphrase, 40), machine: clampStr(r.machine, 80),
        spec: clampStr(r.spec, 40), category: r.category === "slot" ? "slot" : r.category === "pachinko" ? "pachinko" : "",
        pick: clampStr(r.pick, 40), t: Number.isFinite(Number(r.t)) ? Number(r.t) : 0,
      }));
      if (arr.length) out.fortunes[d] = arr;
    });
    return out;
  }

  // 2つのデータを統合する（端末間の同期・バックアップの読み込み用）。記録はIDごとに新しい方を採用し、
  // 削除の印が新しければ削除、占い履歴は和集合。
  function mergeData(a, b) {
    const out = { v: 1, entries: [], fortunes: {}, del: {} };
    const del = Object.assign({}, a.del);
    Object.keys(b.del || {}).forEach((k) => { del[k] = Math.max(del[k] || 0, b.del[k]); });
    const map = new Map();
    a.entries.concat(b.entries).forEach((e) => { const cur = map.get(e.id); if (!cur || e.u > cur.u) map.set(e.id, e); });
    map.forEach((e, id) => { if (!(del[id] && del[id] >= e.u)) out.entries.push(e); });
    const cutoff = Date.now() - 400 * 86400000;
    Object.keys(del).forEach((k) => { if (del[k] > cutoff) out.del[k] = del[k]; });
    new Set(Object.keys(a.fortunes).concat(Object.keys(b.fortunes))).forEach((d) => {
      const cur = (a.fortunes[d] || []).slice();
      const seen = new Set(cur.map((r) => r.t + r.kind));
      (b.fortunes[d] || []).forEach((r) => { if (!seen.has(r.t + r.kind)) cur.push(r); });
      out.fortunes[d] = cur.sort((x, y) => x.t - y.t).slice(-MAX_FORTUNES_PER_DAY);
    });
    return out;
  }
  // 内容が同じか比べるための並び替え済み文字列
  function canon(d) {
    return JSON.stringify([d.entries.slice().sort((x, y) => (x.id < y.id ? -1 : 1)), Object.keys(d.fortunes).sort().map((k) => [k, d.fortunes[k]]), Object.keys(d.del).sort().map((k) => [k, d.del[k]])]);
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = sanitize(JSON.parse(raw));
    } catch (e) { /* 壊れたデータ・読み取り不可：空で始める */ }
    try { localStorage.setItem(KEY + "_t", "1"); localStorage.removeItem(KEY + "_t"); storageOk = true; } catch (e) { storageOk = false; }
  }
  function persistLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); storageOk = true; } catch (e) { storageOk = false; }
    el.warn.hidden = storageOk;
  }
  function save() {
    persistLocal();
    requestPersist();
    scheduleSync();
  }

  // ブラウザに「容量不足でも自動削除しない保存領域」を頼む（許可されれば、ブラウザが勝手に消しにくくなる。
  // ユーザーが手動で閲覧データを消した場合や別端末までは守れない）
  let persistAsked = false;
  function showPersist(granted) {
    el.persist.hidden = false;
    el.persist.innerHTML = granted
      ? "✅ このブラウザに「自動で消さない保存領域」を許可してもらっています。"
      : "ℹ️ 「自動で消さない保存領域」はまだ許可されていません（ブラウザの判断で、使い続けると許可されることがあります）。バックアップの併用をおすすめします。";
  }
  function requestPersist() {
    if (!navigator.storage || !navigator.storage.persist) return;
    const done = (g) => showPersist(!!g);
    if (persistAsked) return;
    persistAsked = true;
    navigator.storage.persisted().then((p) => (p ? done(true) : navigator.storage.persist().then(done))).catch(() => {});
  }
  function checkPersist() {
    if (!navigator.storage || !navigator.storage.persisted) return;
    navigator.storage.persisted().then((p) => { if (p || data.entries.length) showPersist(p); }).catch(() => {});
  }

  // バックアップの催促：記録があるのに、書き出しが一度も無い／14日以上前のとき
  function lastExportTime() { try { return Number(localStorage.getItem(EXPORT_KEY)) || 0; } catch (e) { return 0; } }
  function renderBackupNudge() {
    if (!data.entries.length) { el.backup.hidden = true; return; }
    const t = lastExportTime();
    const days = t ? Math.floor((Date.now() - t) / 86400000) : null;
    if (t && days < BACKUP_NUDGE_DAYS) { el.backup.hidden = true; return; }
    el.backup.hidden = false;
    el.backup.innerHTML = t
      ? `💾 最後のバックアップから${days}日たっています。<button type="button" class="link-btn" id="lg-nudge-export">いま書き出す</button>`
      : `💾 バックアップがまだありません（記録${data.entries.length}件）。端末の故障やデータ削除に備えて、<button type="button" class="link-btn" id="lg-nudge-export">いま書き出す</button>`;
    $("lg-nudge-export").addEventListener("click", () => el.exportJson.click());
  }

  /* ---------------- 日付・表示 ---------------- */
  const pad = (n) => String(n).padStart(2, "0");
  function todayStr() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function fmtDay(s) { const [y, m, d] = s.split("-").map(Number); return `${m}/${d}（${WEEK[new Date(y, m - 1, d).getDay()]}）`; }
  const yen = (n) => `${Math.abs(n).toLocaleString("ja-JP")}円`;
  function signedYen(n) { return n === 0 ? "±0円" : (n > 0 ? "+" : "−") + yen(n); }
  const cls = (n) => (n > 0 ? "plus" : n < 0 ? "minus" : "even");
  const balance = (e) => e.recover - e.invest;

  function fortuneLine(r) {
    if (r.kind === "diagnosis") return `${KIND_ICON.diagnosis} 診断：運勢「${escapeHTML(r.rank)}」／${escapeHTML(r.machine)}${r.catchphrase ? `（${escapeHTML(r.catchphrase)}）` : ""}`;
    if (r.kind === "amida") return `${KIND_ICON.amida} あみだくじ：${escapeHTML(r.machine)}`;
    return `${KIND_ICON.gamble} 今日が勝負：${escapeHTML(r.pick)}`;
  }
  function fortuneLines(date, max) {
    const arr = data.fortunes[date] || [];
    if (!arr.length) return "";
    const lines = arr.slice(0, max).map((r) => `<span>${fortuneLine(r)}</span>`).join("");
    return lines + (arr.length > max ? `<span class="lg-more">ほか${arr.length - max}件</span>` : "");
  }

  /* ---------------- 占いの記録（script.js から呼ばれる） ---------------- */
  window.recordFortune = function (rec) {
    try {
      const d = todayStr();
      const arr = data.fortunes[d] || [];
      const key = (r) => [r.kind, r.rank || "", r.machine || "", r.pick || ""].join("|");
      if (arr.some((r) => key(r) === key(rec))) return;
      arr.push({ kind: rec.kind, rank: rec.rank || "", catchphrase: rec.catchphrase || "", machine: rec.machine || "", spec: rec.spec || "", category: rec.category || "", pick: rec.pick || "", t: Date.now() });
      data.fortunes[d] = arr.slice(-MAX_FORTUNES_PER_DAY);
      const days = Object.keys(data.fortunes).sort();
      if (days.length > MAX_FORTUNE_DAYS) days.slice(0, days.length - MAX_FORTUNE_DAYS).forEach((x) => delete data.fortunes[x]);
      save();
    } catch (e) { /* 履歴が残せなくても占い自体は続ける */ }
  };

  /* ---------------- 集計 ---------------- */
  function renderSummary() {
    const es = data.entries;
    const ym = todayStr().slice(0, 7);
    const sum = (arr) => arr.reduce((a, e) => a + balance(e), 0);
    const month = es.filter((e) => e.date.startsWith(ym));
    const wins = es.filter((e) => balance(e) > 0).length;
    const card = (label, val, c) => `<div class="lg-card"><small>${label}</small><b class="${c || ""}">${val}</b></div>`;
    el.summary.innerHTML = [
      card("今月の収支", signedYen(sum(month)), cls(sum(month))),
      card("通算の収支", signedYen(sum(es)), cls(sum(es))),
      card("勝った日の割合", es.length ? `${Math.round((wins / es.length) * 100)}%` : "－"),
      card("記録した回数", `${es.length}回`),
    ].join("");
  }

  function renderList() {
    const es = data.entries.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    if (!es.length) { el.list.innerHTML = `<p class="rank-empty">まだ記録がありません。上のフォームから最初の1件を記録してみましょう。</p>`; return; }
    let html = "", curMonth = "";
    const monthTotals = {};
    es.forEach((e) => { const m = e.date.slice(0, 7); (monthTotals[m] = monthTotals[m] || { s: 0, n: 0 }); monthTotals[m].s += balance(e); monthTotals[m].n += 1; });
    es.forEach((e) => {
      const m = e.date.slice(0, 7);
      if (m !== curMonth) {
        curMonth = m;
        const t = monthTotals[m];
        html += `<h3 class="lg-month">${Number(m.slice(0, 4))}年${Number(m.slice(5))}月<small>${t.n}回／<b class="${cls(t.s)}">${signedYen(t.s)}</b></small></h3>`;
      }
      const b = balance(e);
      const fl = fortuneLines(e.date, 2);
      html += `<div class="lg-entry" data-id="${escapeHTML(e.id)}">
        <div class="lg-top"><span class="lg-date">${fmtDay(e.date)}</span><span class="lg-bal ${cls(b)}">${signedYen(b)}</span></div>
        <div class="lg-machine"><span class="cat-chip">${e.type === "slot" ? "スロット" : "パチンコ"}</span> ${escapeHTML(e.machine || "（機種未入力）")}</div>
        <div class="lg-meta">投資 ${yen(e.invest)} → 回収 ${yen(e.recover)}${e.rate != null ? `／実回転数 ${e.rate}回転/千円` : ""}</div>
        ${fl ? `<div class="lg-fortune">${fl}</div>` : ""}
        ${e.memo ? `<div class="lg-memo">📝 ${escapeHTML(e.memo)}</div>` : ""}
        <div class="lg-actions"><button type="button" class="link-btn" data-act="edit">編集</button><button type="button" class="link-btn" data-act="del">削除</button></div>
      </div>`;
    });
    el.list.innerHTML = html;
  }

  function renderFortunes() {
    const days = Object.keys(data.fortunes).sort().reverse().slice(0, 30);
    if (!days.length) { el.fortunes.innerHTML = `<p class="rank-empty">まだ占い履歴がありません。占いを見ると、ここに残ります。</p>`; return; }
    el.fortunes.innerHTML = days.map((d) => `<div class="lg-fday"><b>${fmtDay(d)}</b>${fortuneLines(d, 8)}</div>`).join("") +
      (Object.keys(data.fortunes).length > 30 ? `<p class="calc-foot">直近30日分を表示しています。</p>` : "");
  }

  function renderInsight() {
    // 占い（診断）の運勢ランクと、その日の収支の関係をネタとして見せる
    const lastRank = (d) => { const a = (data.fortunes[d] || []).filter((r) => r.kind === "diagnosis" && r.rank); return a.length ? a[a.length - 1].rank : null; };
    const groups = {};
    let n = 0;
    data.entries.forEach((e) => {
      const r = lastRank(e.date);
      if (!r) return;
      (groups[r] = groups[r] || { n: 0, s: 0 }); groups[r].n += 1; groups[r].s += balance(e); n += 1;
    });
    let body;
    if (n < 5) {
      body = `<p class="calc-foot">占いの運勢ランクがある日の記録が5件たまると、運勢ランク別の平均収支を表示します（いまは${n}件）。</p>`;
    } else {
      const rows = RANKS.filter((r) => groups[r]).map((r) => `<tr><th>${r}</th><td>${groups[r].n}回</td><td class="${cls(Math.round(groups[r].s / groups[r].n))}">${signedYen(Math.round(groups[r].s / groups[r].n))}</td></tr>`).join("");
      body = `<table class="cat-table lg-insight-table"><thead><tr><th>運勢</th><td>回数</td><td>平均収支</td></tr></thead><tbody>${rows}</tbody></table>
        <p class="calc-foot">占いと収支に因果関係はなく、記録が少ないうちは偶然のブレが大きいです。ネタとして楽しむための表示です。</p>`;
    }
    el.insight.innerHTML = `<h2>🔮 占いの運勢ランク別の平均収支（おまけ）</h2>${body}`;
  }

  function renderAll() {
    el.warn.hidden = storageOk;
    renderSummary(); renderList(); renderFortunes(); renderInsight(); renderBackupNudge();
  }

  /* ---------------- フォーム ---------------- */
  function updateFormHints() {
    const d = el.date.value;
    const fl = isDate(d) ? fortuneLines(d, 3) : "";
    el.hint.hidden = !fl;
    el.hint.innerHTML = fl ? `<b>この日の占い</b>（記録と一緒に表示されます）${fl}` : "";
    const inv = el.invest.value, rec = el.recover.value;
    if (inv === "" && rec === "") { el.diff.textContent = ""; return; }
    const b = (Number(rec) || 0) - (Number(inv) || 0);
    el.diff.innerHTML = `この記録の収支：<b class="${cls(b)}">${signedYen(b)}</b>`;
  }
  function updateTypeRows() {
    el.rateRow.hidden = el.type.value !== "pachinko";
  }
  function resetForm(keepDate) {
    editingId = null;
    el.formTitle.textContent = "記録を追加";
    el.submit.textContent = "記録する";
    el.cancel.hidden = true;
    el.machine.value = ""; el.invest.value = ""; el.recover.value = ""; el.rate.value = ""; el.memo.value = "";
    if (!keepDate) el.date.value = todayStr();
    el.error.hidden = true;
    updateTypeRows(); updateFormHints();
  }
  function showError(msg) { el.error.textContent = msg; el.error.hidden = false; }

  el.date.max = todayStr();
  el.date.value = todayStr();
  [el.date, el.invest, el.recover].forEach((x) => x.addEventListener("input", updateFormHints));
  el.type.addEventListener("change", () => { updateTypeRows(); renderMachineSuggest(); });

  el.form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    el.error.hidden = true;
    const date = el.date.value;
    if (!isDate(date) || date < "2000-01-01") return showError("日付を入力してください。");
    if (date > todayStr()) return showError("未来の日付は記録できません。");
    const machine = el.machine.value.trim();
    if (!machine) return showError("機種名を入力してください（検索して選ぶこともできます）。");
    const invest = el.invest.value === "" ? null : intIn(el.invest.value, 0, 9999999);
    const recover = el.recover.value === "" ? null : intIn(el.recover.value, 0, 9999999);
    if (invest == null) return showError("投資額を0〜9,999,999円の整数で入力してください。");
    if (recover == null) return showError("回収額を0〜9,999,999円の整数で入力してください（出なかった場合は0）。");
    let rate = null;
    if (el.type.value === "pachinko" && el.rate.value !== "") {
      rate = Number(el.rate.value);
      if (!Number.isFinite(rate) || rate < 1 || rate > 60) return showError("実際の回転数は1〜60の範囲で入力してください。");
    }
    const entry = { id: editingId || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7)), date, type: el.type.value, machine: clampStr(machine, 60), invest, recover, rate, memo: clampStr(el.memo.value.trim(), 200), u: Date.now() };
    const i = data.entries.findIndex((x) => x.id === entry.id);
    if (i >= 0) data.entries[i] = entry; else data.entries.push(entry);
    save();
    track("ledger_save", { type: entry.type, edit: i >= 0 });
    resetForm(true);
    renderAll();
  });
  el.cancel.addEventListener("click", () => resetForm(false));

  el.list.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-act]");
    if (!btn) return;
    const id = btn.closest(".lg-entry").dataset.id;
    const e = data.entries.find((x) => x.id === id);
    if (!e) return;
    if (btn.dataset.act === "del") {
      if (!confirm(`${fmtDay(e.date)}「${e.machine}」の記録を削除しますか？（元に戻せません）`)) return;
      data.entries = data.entries.filter((x) => x.id !== id);
      data.del[id] = Date.now();
      save(); renderAll();
    } else {
      editingId = id;
      el.date.value = e.date; el.type.value = e.type; el.machine.value = e.machine;
      el.invest.value = e.invest; el.recover.value = e.recover; el.rate.value = e.rate == null ? "" : e.rate; el.memo.value = e.memo;
      el.formTitle.textContent = "記録を編集";
      el.submit.textContent = "更新する";
      el.cancel.hidden = false;
      updateTypeRows(); updateFormHints();
      el.form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  /* ---------------- 機種の検索サジェスト（自由入力も可） ---------------- */
  let sgItems = [];
  let sgActive = -1;
  function hideMachineSuggest() {
    el.suggest.hidden = true; el.suggest.innerHTML = ""; sgItems = []; sgActive = -1;
    el.machine.setAttribute("aria-expanded", "false"); el.machine.removeAttribute("aria-activedescendant");
  }
  function renderMachineSuggest() {
    const q = el.machine.value;
    if (!q.trim() || !window.PS_CATALOG) { hideMachineSuggest(); return; }
    sgItems = window.PS_CATALOG.search(q, el.type.value).slice(0, 8);
    if (!sgItems.length) { hideMachineSuggest(); return; }
    if (sgActive >= sgItems.length) sgActive = -1;
    el.suggest.innerHTML = sgItems.map((it, i) => `<li role="option" id="lg-opt-${i}" data-i="${i}" aria-selected="${i === sgActive}"${i === sgActive ? ' class="active"' : ""}><span class="sg-name">${escapeHTML(it.name)}</span></li>`).join("") +
      `<li class="sg-note">候補にない機種は、そのまま入力して記録できます。</li>`;
    el.suggest.hidden = false;
    el.machine.setAttribute("aria-expanded", "true");
  }
  function pickMachine(it) {
    el.machine.value = it.name;
    el.type.value = it.type;
    updateTypeRows();
    hideMachineSuggest();
    el.invest.focus();
  }
  el.machine.addEventListener("input", () => { sgActive = -1; renderMachineSuggest(); });
  el.machine.addEventListener("keydown", (e) => {
    if (el.suggest.hidden) return;
    if (e.key === "ArrowDown") { e.preventDefault(); sgActive = (sgActive + 1) % sgItems.length; renderMachineSuggest(); el.machine.setAttribute("aria-activedescendant", "lg-opt-" + sgActive); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sgActive = (sgActive - 1 + sgItems.length) % sgItems.length; renderMachineSuggest(); el.machine.setAttribute("aria-activedescendant", "lg-opt-" + sgActive); }
    else if (e.key === "Enter" && sgActive >= 0) { e.preventDefault(); pickMachine(sgItems[sgActive]); }
    else if (e.key === "Escape") hideMachineSuggest();
  });
  el.suggest.addEventListener("mousedown", (e) => {
    const li = e.target.closest("li[data-i]");
    if (!li) return;
    e.preventDefault();
    pickMachine(sgItems[Number(li.dataset.i)]);
  });
  document.addEventListener("click", (e) => { if (!el.machineRow.contains(e.target)) hideMachineSuggest(); });

  /* ---------------- バックアップ ---------------- */
  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const stamp = () => todayStr().replace(/-/g, "");
  function msg(t) { el.toolsMsg.textContent = t; }

  el.exportJson.addEventListener("click", () => {
    download(`shushi-note-${stamp()}.json`, JSON.stringify({ app: "pachinko-slot-uranai-ledger", v: 1, exportedAt: new Date().toISOString(), entries: data.entries, fortunes: data.fortunes, del: data.del }, null, 1), "application/json");
    try { localStorage.setItem(EXPORT_KEY, String(Date.now())); } catch (e) { /* 記録できなくても書き出しは有効 */ }
    renderBackupNudge();
    msg("バックアップを書き出しました。ファイルは大切に保管してください（別の端末では「読み込む」で復元できます）。");
    track("ledger_export", { kind: "json" });
  });
  el.exportCsv.addEventListener("click", () => {
    const cell = (s) => { if (typeof s === "number") return String(s); let v = String(s == null ? "" : s); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return `"${v.replace(/"/g, '""')}"`; };
    const rows = [["日付", "種別", "機種", "投資", "回収", "収支", "実回転数(1000円あたり)", "メモ", "その日の占い"]];
    data.entries.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).forEach((e) => {
      const f = (data.fortunes[e.date] || []).map((r) => fortuneLine(r).replace(/<[^>]+>/g, "").replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (m) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" }[m]))).join(" / ");
      rows.push([e.date, e.type === "slot" ? "スロット" : "パチンコ", e.machine, e.invest, e.recover, e.recover - e.invest, e.rate == null ? "" : e.rate, e.memo, f]);
    });
    download(`shushi-note-${stamp()}.csv`, "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n"), "text/csv");
    msg("CSVを書き出しました（Excelなどで開けます）。");
    track("ledger_export", { kind: "csv" });
  });
  el.importBtn.addEventListener("click", () => el.importFile.click());
  el.importFile.addEventListener("change", () => {
    const file = el.importFile.files[0];
    el.importFile.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { msg("ファイルが大きすぎます（5MBまで）。"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const o = JSON.parse(String(reader.result));
        if (!o || o.app !== "pachinko-slot-uranai-ledger") throw new Error("形式が違います");
        const inc = sanitize(o);
        data = mergeData(data, inc);
        save(); renderAll();
        msg(`${inc.entries.length}件の記録を読み込みました（同じ記録は新しい方を採用、それ以外は追加）。`);
      } catch (e) {
        msg("読み込めませんでした。このサイトで書き出したバックアップ（JSON）を選んでください。");
      }
    };
    reader.readAsText(file);
  });
  el.clear.addEventListener("click", async () => {
    const cloud = !!sync;
    if (!confirm(`収支の記録と占い履歴を、この端末からすべて削除します。${cloud ? "クラウド保存も解除し、クラウド上のデータも削除します。" : ""}元に戻せません。先にバックアップを書き出しましたか？`)) return;
    if (cloud) await disableSync(true);
    data = { v: 1, entries: [], fortunes: {}, del: {} };
    save(); resetForm(false); renderAll(); renderSync();
    msg("すべて削除しました。");
  });

  /* ---------------- 引き継ぎコードによるクラウド保存（登録不要） ----------------
     ・20文字のランダムな「引き継ぎコード」を端末で作る（サーバーには送らない）。
     ・コードから「保存先ID（SHA-256）」と「暗号鍵（AES-GCM）」を作り、データを暗号化してから Supabase に預ける。
       サーバー側には暗号文しか無く、運営者にも読めない。コードを失くすと誰にも復元できない。
     ・別の端末では、同じコードを入力すると復元できる。以後は自動で同期（記録はIDごとに新しい方を採用）。
     ・Supabaseの設定（votes-config.js）が空のあいだは、この機能は画面に出さない。 */
  const SYNC_KEY = "pslab_sync_v1";
  const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // 紛らわしい 0/O/1/I を除いた32文字
  const syncBox = $("ledger-sync");
  let sync = null;           // { code, last } 有効なとき
  let syncing = false, syncQueued = false, syncTimer = null;
  let syncStatusText = "", syncStatusErr = false, showingCode = false, issuing = null;

  try { const s = JSON.parse(localStorage.getItem(SYNC_KEY) || "null"); if (s && /^[A-HJ-NP-Z2-9]{20}$/.test(s.code)) sync = { code: s.code, last: Number(s.last) || 0 }; } catch (e) { /* 無効 */ }
  function saveSync() { try { if (sync) localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); else localStorage.removeItem(SYNC_KEY); } catch (e) { /* 保存不可 */ } }

  function syncAvailable() {
    return typeof VOTES_CONFIG !== "undefined" && !!(VOTES_CONFIG.mock || (VOTES_CONFIG.url && VOTES_CONFIG.key));
  }
  const textEnc = new TextEncoder(), textDec = new TextDecoder();
  function b64(buf) {
    const u = new Uint8Array(buf); let s = "";
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function unb64(s) { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  const hexOf = (buf) => Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, "0")).join("");
  async function deriveIds(code) {
    const id = hexOf(await crypto.subtle.digest("SHA-256", textEnc.encode("pslab-id:" + code)));
    const raw = await crypto.subtle.digest("SHA-256", textEnc.encode("pslab-key:" + code));
    const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
    return { id, key };
  }
  async function encryptData(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, textEnc.encode(JSON.stringify(obj)));
    return b64(iv) + "." + b64(ct);
  }
  async function decryptData(key, blob) {
    const [a, b] = String(blob).split(".");
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(a) }, key, unb64(b));
    return JSON.parse(textDec.decode(pt));
  }
  function newCode() {
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    return Array.from(bytes).map((x) => CODE_ALPHABET[x & 31]).join("");   // 256は32で割り切れるので偏りなし
  }
  const showCode = (c) => c.match(/.{5}/g).join("-");
  function parseCode(s) {
    const c = String(s).toUpperCase().replace(/[\s\-ー－‐]/g, "");
    return /^[A-HJ-NP-Z2-9]{20}$/.test(c) ? c : null;
  }

  /* --- サーバー（Supabase RPC）／ローカル検証用モック --- */
  function mockStore() { try { return JSON.parse(localStorage.getItem("pslab_mocksync") || "{}"); } catch (e) { return {}; } }
  function mockWrite(o) { localStorage.setItem("pslab_mocksync", JSON.stringify(o)); }
  async function rpc(fn, body) {
    const res = await fetch(`${VOTES_CONFIG.url}/rest/v1/rpc/${fn}`, { method: "POST", headers: Object.assign({}, votesHeaders(), { "Content-Type": "application/json" }), body: JSON.stringify(body) });
    if (!res.ok) {
      let m = ""; try { m = (await res.json()).message || ""; } catch (e) { /* 本文なし */ }
      throw new Error(/conflict/.test(m) ? "conflict" : "rpc " + res.status);
    }
    const t = await res.text();
    return t ? JSON.parse(t) : null;
  }
  async function remoteGet(id) {
    if (VOTES_CONFIG.mock) return mockStore()[id] || null;
    const rows = await rpc("ledger_get", { p_id: id });
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }
  async function remotePut(id, blob, expected) {
    if (VOTES_CONFIG.mock) {
      const s = mockStore(); const cur = s[id];
      if ((cur ? cur.version : 0) !== expected) throw new Error("conflict");
      s[id] = { blob, version: expected + 1 }; mockWrite(s); return expected + 1;
    }
    return Number(await rpc("ledger_put", { p_id: id, p_blob: blob, p_expected: expected }));
  }
  async function remoteDelete(id) {
    if (VOTES_CONFIG.mock) { const s = mockStore(); delete s[id]; mockWrite(s); return; }
    await rpc("ledger_delete", { p_id: id });
  }

  function setSyncStatus(t, err) { syncStatusText = t; syncStatusErr = !!err; const n = $("sy-status"); if (n) { n.textContent = t; n.className = "sy-status" + (err ? " sy-err" : ""); } }
  function fmtTime(t) { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }

  // 手元とクラウドを統合して、変化があればクラウドへ書き戻す。restore=true は「コードが存在すること」を必須にする
  async function syncNow(opts) {
    opts = opts || {};
    if (!sync || !syncAvailable()) return false;
    if (syncing) { syncQueued = true; return false; }
    syncing = true;
    setSyncStatus("同期中…");
    try {
      const { id, key } = await deriveIds(sync.code);
      let done = false;
      for (let attempt = 0; attempt < 4 && !done; attempt++) {
        const remote = await remoteGet(id);
        let expected = 0, same = false;
        if (remote) {
          let rd;
          try { rd = sanitize(await decryptData(key, remote.blob)); } catch (e) { const err = new Error("badcode"); err.badcode = true; throw err; }
          const merged = mergeData(data, rd);
          same = canon(merged) === canon(rd);
          data = merged;
          expected = Number(remote.version);
        } else if (opts.restore) {
          const err = new Error("notfound"); err.notfound = true; throw err;
        }
        persistLocal();
        if (same) { done = true; break; }
        try { await remotePut(id, await encryptData(key, data), expected); done = true; } catch (e) { if (e.message !== "conflict") throw e; }
      }
      if (!done) throw new Error("conflict-loop");
      sync.last = Date.now(); saveSync();
      renderAll();
      setSyncStatus(`☁ 同期できました（${fmtTime(sync.last)}）`);
      return true;
    } catch (e) {
      if (e.badcode) setSyncStatus("クラウドのデータをこのコードで開けませんでした。コードが違う可能性があります。", true);
      else if (e.notfound) setSyncStatus("このコードのデータが見つかりませんでした。コードを確認してください。", true);
      else setSyncStatus("同期できませんでした（通信エラーなど）。記録はこの端末には保存されています。あとで自動的に再試行します。", true);
      e.syncError = true;
      syncing = false;
      return Promise.reject(e);
    } finally {
      syncing = false;
      if (syncQueued) { syncQueued = false; scheduleSync(); }
    }
  }
  function scheduleSync() {
    if (!sync || !syncAvailable()) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => { syncNow().catch(() => {}); }, 1500);
  }
  window.addEventListener("online", () => { if (sync) scheduleSync(); });

  async function disableSync(deleteRemote) {
    if (!sync) return true;
    if (deleteRemote) {
      try { const { id } = await deriveIds(sync.code); await remoteDelete(id); } catch (e) { setSyncStatus("クラウドのデータを削除できませんでした。通信状態を確認して、もう一度お試しください。", true); return false; }
    }
    sync = null; saveSync(); showingCode = false; issuing = null;
    return true;
  }

  function renderSync() {
    if (!syncBox) return;
    if (!syncAvailable() || !window.crypto || !crypto.subtle) { syncBox.hidden = true; return; }
    syncBox.hidden = false;
    let html = `<h2>☁ 別の端末でも見られるようにする（引き継ぎコード）</h2>`;
    if (sync) {
      html += `<p class="calc-foot">クラウド保存：<b>有効</b>。記録を変えると自動で同期し、別の端末で同じコードを入力すると復元できます。内容は暗号化されて預けられ、運営者にも読めません。</p>
        <p class="sy-status${syncStatusErr ? " sy-err" : ""}" id="sy-status" aria-live="polite">${escapeHTML(syncStatusText || (sync.last ? `☁ 最終同期 ${fmtTime(sync.last)}` : ""))}</p>
        ${showingCode ? `<div class="sy-code" id="sy-code">${showCode(sync.code)}</div><p class="calc-foot">このコードが「鍵」です。失くすとデータを復元できず、運営者にも再発行できません。</p>` : ""}
        <div class="ledger-tools">
          <button type="button" class="btn-secondary" id="sy-now">いま同期する</button>
          <button type="button" class="btn-secondary" id="sy-show">${showingCode ? "コードを隠す" : "引き継ぎコードを表示する"}</button>
          ${showingCode ? `<button type="button" class="btn-secondary" id="sy-copy">コードをコピー</button>` : ""}
          <button type="button" class="btn-secondary ledger-danger" id="sy-off">クラウド保存をやめる（クラウドのデータを削除）</button>
        </div>`;
    } else if (issuing) {
      html += `<div class="sy-code" id="sy-code">${showCode(issuing)}</div>
        <p class="ledger-warn-box">⚠ <b>このコードが「鍵」です。</b>スクリーンショットやメモで必ず控えてください。失くすとデータを復元できず、運営者にも再発行できません。</p>
        <label class="sy-ack"><input type="checkbox" id="sy-ack"> 控えました</label>
        <div class="ledger-tools">
          <button type="button" class="btn-secondary" id="sy-copy">コードをコピー</button>
          <button type="button" class="btn-primary" id="sy-enable" disabled>クラウド保存を有効にする</button>
          <button type="button" class="link-btn" id="sy-cancel">やめる</button>
        </div>
        <p class="sy-status${syncStatusErr ? " sy-err" : ""}" id="sy-status" aria-live="polite">${escapeHTML(syncStatusText)}</p>`;
    } else {
      html += `<p class="calc-foot">登録・ログインは不要です。<b>引き継ぎコード</b>を発行すると、記録を暗号化してクラウドに預けられます（運営者にも内容は読めません）。機種変更・ブラウザのデータ削除・別の端末でも、コードを入れれば元通りになります。<b>コードを失くすと復元できません。</b></p>
        <div class="ledger-tools">
          <button type="button" class="btn-secondary" id="sy-issue">引き継ぎコードを発行して有効にする</button>
        </div>
        <div class="sy-restore">
          <label for="sy-input">すでにコードを持っている方（別の端末のデータを復元）</label>
          <input type="text" id="sy-input" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="30">
          <button type="button" class="btn-secondary" id="sy-restore">コードで復元する</button>
        </div>
        <p class="sy-status${syncStatusErr ? " sy-err" : ""}" id="sy-status" aria-live="polite">${escapeHTML(syncStatusText)}</p>`;
    }
    syncBox.innerHTML = html;
  }

  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) { return false; }
  }
  if (syncBox) syncBox.addEventListener("click", async (ev) => {
    const id = ev.target.id;
    if (id === "sy-issue") { issuing = newCode(); syncStatusText = ""; syncStatusErr = false; renderSync(); }
    else if (id === "sy-cancel") { issuing = null; renderSync(); }
    else if (id === "sy-ack") { $("sy-enable").disabled = !ev.target.checked; }
    else if (id === "sy-copy") { const ok = await copyText(sync ? sync.code : issuing); setSyncStatus(ok ? "コードをコピーしました。メモ帳などに貼って控えてください。" : "コピーできませんでした。画面のコードを書き写すか、スクリーンショットで控えてください。", !ok); }
    else if (id === "sy-enable") {
      sync = { code: issuing, last: 0 }; issuing = null; saveSync(); renderSync();
      track("ledger_sync", { action: "enable" });
      syncNow().catch(() => {}).then(() => renderSync());
    } else if (id === "sy-restore") {
      const code = parseCode($("sy-input").value);
      if (!code) { setSyncStatus("コードは英大文字と数字（0・1・O・I を除く）の20文字です。入力を確認してください。", true); return; }
      sync = { code, last: 0 }; saveSync();
      try { await syncNow({ restore: true }); track("ledger_sync", { action: "restore" }); } catch (e) { sync = null; saveSync(); }
      renderSync();
      if (sync) msg("復元しました。");
    } else if (id === "sy-now") { syncNow().catch(() => {}); }
    else if (id === "sy-show") { showingCode = !showingCode; renderSync(); }
    else if (id === "sy-off") {
      if (!confirm("クラウド保存をやめて、クラウド上のデータを削除します。この端末の記録は残ります。よろしいですか？")) return;
      if (await disableSync(true)) { setSyncStatus(""); renderSync(); track("ledger_sync", { action: "disable" }); }
    }
  });

  /* ---------------- 画面 ---------------- */
  function openLedger() {
    el.date.max = todayStr();
    if (!editingId && !el.date.value) el.date.value = todayStr();
    updateTypeRows(); updateFormHints(); renderAll(); checkPersist();
    renderSync();
    const adEl = $("ledger-ad");
    if (adEl) { adEl.innerHTML = adSlotHTML("jacard", "軍資金の管理にも。クレジットカードの新規入会キャンペーンの条件は公式サイトでご確認ください。", "ledger"); adEl.hidden = !adEl.innerHTML; }
    if (sync) syncNow().catch(() => {}).then(() => renderSync());
    showScreen("ledger");
    track("ledger_view", {});
  }
  window.PS_LEDGER = {
    openWith(name, type) {
      resetForm(false);
      openLedger();
      el.machine.value = name;
      if (type) el.type.value = type;
      updateTypeRows();
      el.form.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => el.invest.focus({ preventScroll: true }), 300);
    },
  };
  window.PS_NAV = window.PS_NAV || {};
  window.PS_NAV.ledger = openLedger;

  load();
  updateTypeRows();
  updateFormHints();
  if (!new URLSearchParams(location.search).has("c") && location.hash === "#ledger") openLedger();
})();
