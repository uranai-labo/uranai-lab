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
    clear: $("lg-clear"), toolsMsg: $("lg-tools-msg"),
  };

  /* ---------------- 保存 ---------------- */
  let data = { v: 1, entries: [], fortunes: {} };
  let storageOk = true;
  let editingId = null;

  const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + "T00:00:00").getTime());
  const clampStr = (s, n) => String(s == null ? "" : s).slice(0, n);
  const intIn = (v, lo, hi) => { const n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };

  // 読み込んだ／取り込んだデータを検証して、想定した形のものだけ残す
  function sanitize(o) {
    const out = { v: 1, entries: [], fortunes: {} };
    if (!o || typeof o !== "object") return out;
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

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = sanitize(JSON.parse(raw));
    } catch (e) { /* 壊れたデータ・読み取り不可：空で始める */ }
    try { localStorage.setItem(KEY + "_t", "1"); localStorage.removeItem(KEY + "_t"); storageOk = true; } catch (e) { storageOk = false; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); storageOk = true; } catch (e) { storageOk = false; }
    el.warn.hidden = storageOk;
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
    renderSummary(); renderList(); renderFortunes(); renderInsight();
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
    const entry = { id: editingId || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7)), date, type: el.type.value, machine: clampStr(machine, 60), invest, recover, rate, memo: clampStr(el.memo.value.trim(), 200) };
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
    download(`shushi-note-${stamp()}.json`, JSON.stringify({ app: "pachinko-slot-uranai-ledger", v: 1, exportedAt: new Date().toISOString(), entries: data.entries, fortunes: data.fortunes }, null, 1), "application/json");
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
        const byId = new Map(data.entries.map((e) => [e.id, e]));
        inc.entries.forEach((e) => byId.set(e.id, e));
        data.entries = Array.from(byId.values());
        Object.keys(inc.fortunes).forEach((d) => {
          const cur = data.fortunes[d] || [];
          const seen = new Set(cur.map((r) => r.t + r.kind));
          inc.fortunes[d].forEach((r) => { if (!seen.has(r.t + r.kind)) cur.push(r); });
          data.fortunes[d] = cur.sort((a, b) => a.t - b.t).slice(-MAX_FORTUNES_PER_DAY);
        });
        save(); renderAll();
        msg(`${inc.entries.length}件の記録を読み込みました（同じ記録は上書き、それ以外は追加）。`);
      } catch (e) {
        msg("読み込めませんでした。このサイトで書き出したバックアップ（JSON）を選んでください。");
      }
    };
    reader.readAsText(file);
  });
  el.clear.addEventListener("click", () => {
    if (!confirm("収支の記録と占い履歴を、この端末からすべて削除します。元に戻せません。先にバックアップを書き出しましたか？")) return;
    data = { v: 1, entries: [], fortunes: {} };
    save(); resetForm(false); renderAll();
    msg("すべて削除しました。");
  });

  /* ---------------- 画面 ---------------- */
  function openLedger() {
    el.date.max = todayStr();
    if (!editingId && !el.date.value) el.date.value = todayStr();
    updateTypeRows(); updateFormHints(); renderAll();
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
