/* 「今日のスロット占い／パチンコ占い」（日替わり・全員共通）。占い専用ページ（slot-uranai.html / pachinko-uranai.html）で使う。
   machine-db.js（機種データ）を先に読み込むこと。<body data-type="slot|pachinko"> と <div id="today-box"> が必要。
   結果は「今日の日付」だけで決まる（同じ日は誰が見ても同じ）。あなた専用の結果は、質問に答える占い（トップ）で出る。 */
(function () {
  "use strict";
  var box = document.getElementById("today-box");
  if (!box || typeof MACHINE_DB === "undefined") return;
  var type = document.body.getAttribute("data-type") === "pachinko" ? "pachinko" : "slot";

  var RANKS = ["SS", "S", "A", "B", "C"];
  var RANK_TEXT = {
    SS: "絶好調。迷ったらこの運気を信じて、気になった台に座ってみる日。",
    S: "好調。直感がさえる日。いつもより少し大胆に台を選んでもよさそう。",
    A: "まずまず。落ち着いて、いつもどおりの立ち回りが吉。",
    B: "ふつう。決めた予算を守ることを意識したい日。",
    C: "慎重に。今日は様子見や早めの切り上げも作戦のうち。",
  };
  var SPECS = type === "slot"
    ? [["normal", "ノーマルタイプ（ジャグラー等）"], ["at", "AT機"], ["smart", "スマスロ"]]
    : [["amadegi", "甘デジ"], ["lightmiddle", "ライトミドル"], ["middle", "ミドル"], ["highspec", "ハイスペック"]];
  var COLORS = ["赤", "ゴールド", "紫", "白", "青", "緑", "黒", "ピンク"];

  // トップの占い（script.js）と同じ簡易ハッシュ
  function hashString(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
    return Math.abs(h);
  }
  var d = new Date();
  var dayKey = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  var dateJp = d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";

  var rows = MACHINE_DB.filter(function (r) { return r[1] === (type === "pachinko" ? "p" : "s") && r[10] === 1; });
  function pick(spec) {
    var pool = rows.filter(function (r) { return r[2] === spec; });
    if (!pool.length) return null;
    var total = 0, i;
    for (i = 0; i < pool.length; i++) total += Math.max(1, pool[i][9]);
    var x = hashString("today|" + dayKey + "|" + type + "|" + spec) % total;
    for (i = 0; i < pool.length; i++) { x -= Math.max(1, pool[i][9]); if (x < 0) return pool[i]; }
    return pool[0];
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function hasPage(r) { return r[6] >= 20; }   // m/{ID}.html がある機種（設置20店以上）

  var rank = RANKS[hashString("today|" + dayKey + "|" + type + "|rank") % RANKS.length];
  var color = COLORS[hashString("today|" + dayKey + "|" + type + "|color") % COLORS.length];
  var lines = SPECS.map(function (s) {
    var m = pick(s[0]);
    if (!m) return "";
    var name = hasPage(m) ? '<a href="m/' + m[3] + '.html">' + esc(m[0]) + "</a>" : esc(m[0]);
    return "<li><span class=\"lp-spec\">" + esc(s[1]) + "</span><span class=\"lp-machine\">" + name + "</span></li>";
  }).join("");

  box.innerHTML =
    '<p class="lp-date">' + dateJp + "の" + (type === "slot" ? "スロット" : "パチンコ") + "占い</p>" +
    '<p class="lp-rank"><b>' + rank + "</b><span>今日の総合運</span></p>" +
    '<p class="lp-rank-text">' + RANK_TEXT[rank] + "（ラッキーカラー：" + color + "）</p>" +
    '<p class="lp-sub">区分別・今日のおすすめ機種</p><ul class="lp-today-list">' + lines + "</ul>" +
    '<p class="calc-foot">※日付だけで決まる、全員共通の占いです。あなた専用の結果（運勢ランク・二つ名・おすすめ機種）は、質問に答える占いで出ます。占いはエンタメで、出玉や勝ち負けを保証するものではありません。</p>';
})();
