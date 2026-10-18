/* 「この台どうだった？」匿名投票（絵文字評価＋定型フレーズ最大3つ）。
   自由入力は無し（荒らし・違法投稿対策）。保存先は votes-config.js のSupabase。 */
const VOTE_RATINGS = [
  { value: 5, emoji: "😍", label: "最高" },
  { value: 4, emoji: "🙂", label: "良かった" },
  { value: 3, emoji: "😐", label: "普通" },
  { value: 2, emoji: "🙁", label: "微妙" },
  { value: 1, emoji: "😡", label: "ひどい" },
];
const VOTE_TAGS = [
  "出玉が良かった", "初当たりが軽かった", "初当たりが重かった", "連チャンした",
  "単発が多かった", "演出が楽しい", "演出が単調", "釘が辛かった",
  "遊びやすい", "荒れやすい", "また打ちたい", "もう打たない",
];
const VOTE_MAX_TAGS = 3;
// 同時に選べない（意味が正反対の）フレーズ
const VOTE_OPPOSITES = {
  "初当たりが軽かった": "初当たりが重かった",
  "初当たりが重かった": "初当たりが軽かった",
  "演出が楽しい": "演出が単調",
  "演出が単調": "演出が楽しい",
  "遊びやすい": "荒れやすい",
  "荒れやすい": "遊びやすい",
  "また打ちたい": "もう打たない",
  "もう打たない": "また打ちたい",
};

function votesEnabled() {
  return !!(VOTES_CONFIG.mock || (VOTES_CONFIG.url && VOTES_CONFIG.key));
}

function votesHeaders() {
  // 新形式の Publishable key（sb_publishable_…）は JWT ではないので apikey ヘッダーだけで送る。
  // 旧形式の anon（JWT）キーなら Authorization にも付ける。
  if (/^sb_/.test(VOTES_CONFIG.key)) return { apikey: VOTES_CONFIG.key };
  return { apikey: VOTES_CONFIG.key, Authorization: `Bearer ${VOTES_CONFIG.key}` };
}

function mockVotesLoad() {
  try { return JSON.parse(localStorage.getItem("mockvotes") || "[]"); } catch (e) { return []; }
}

async function votesFetchSummary(machine) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const tags = {};
  if (VOTES_CONFIG.mock) {
    mockVotesLoad().filter((v) => v.machine === machine).forEach((v) => {
      counts[v.rating] += 1;
      v.tags.forEach((t) => { tags[t] = (tags[t] || 0) + 1; });
    });
  } else {
    const q = encodeURIComponent(machine);
    const base = `${VOTES_CONFIG.url}/rest/v1`;
    const [r1, r2] = await Promise.all([
      fetch(`${base}/machine_vote_summary?machine=eq.${q}&select=rating,c`, { headers: votesHeaders() }),
      fetch(`${base}/machine_tag_summary?machine=eq.${q}&select=tag,c`, { headers: votesHeaders() }),
    ]);
    if (!r1.ok || !r2.ok) throw new Error("summary fetch failed");
    (await r1.json()).forEach((row) => { counts[row.rating] = Number(row.c); });
    (await r2.json()).forEach((row) => { tags[row.tag] = Number(row.c); });
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, tags, total };
}

async function votesSubmit(machine, rating, tags) {
  if (VOTES_CONFIG.mock) {
    const all = mockVotesLoad();
    all.push({ machine, rating, tags });
    localStorage.setItem("mockvotes", JSON.stringify(all));
    return;
  }
  const res = await fetch(`${VOTES_CONFIG.url}/rest/v1/machine_votes`, {
    method: "POST",
    headers: { ...votesHeaders(), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ machine, rating, tags }),
  });
  if (!res.ok) throw new Error("vote failed");
}

function votesAlreadyVoted(machine) {
  try { return !!localStorage.getItem("voted:" + machine); } catch (e) { return false; }
}
function votesMarkVoted(machine) {
  try { localStorage.setItem("voted:" + machine, "1"); } catch (e) { /* 保存できない環境では何度でも投票できるだけ */ }
}

function voteResultsHTML(summary) {
  if (!summary.total) {
    return `<p class="vote-empty">まだ投票がありません。最初の1票をどうぞ。</p>`;
  }
  const bars = VOTE_RATINGS.map((r) => {
    const pct = Math.round((summary.counts[r.value] / summary.total) * 100);
    return `<div class="vote-bar"><span class="vote-bar-label">${r.emoji} ${r.label}</span><span class="vote-track"><i style="width:${pct}%"></i></span><span class="vote-pct">${pct}%</span></div>`;
  }).join("");
  const topTags = Object.entries(summary.tags).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([t, c]) => `<span class="vote-chip-static">${escapeHTML(t)} <b>${c}</b></span>`).join("");
  return `<p class="vote-total">みんなの評価（${summary.total}票）</p>${bars}${topTags ? `<p class="vote-tags-title">よく選ばれたひとこと</p><div class="vote-chips">${topTags}</div>` : ""}`;
}

function renderVoteBox(container, machine) {
  if (!container) return;
  if (!votesEnabled()) { container.innerHTML = ""; return; }
  const name = machineName(machine);
  container.innerHTML = `<div class="vote-box"></div>`;
  const box = container.firstElementChild;

  const showResults = async (thanks) => {
    box.innerHTML = `<p class="vote-head">🗳 この台、どうだった？</p>${thanks ? `<p class="vote-thanks">投票ありがとうございます！</p>` : ""}<div class="vote-results"><p class="vote-empty">集計を読み込み中…</p></div><p class="vote-note">※当サイト利用者の匿名の感想で、出玉や勝ちを保証するものではありません。</p>`;
    try {
      const summary = await votesFetchSummary(name);
      box.querySelector(".vote-results").innerHTML = voteResultsHTML(summary);
    } catch (e) {
      box.querySelector(".vote-results").innerHTML = `<p class="vote-empty">集計を取得できませんでした。</p>`;
    }
  };

  const showForm = () => {
    const sel = { rating: null, tags: [] };
    box.innerHTML = `
      <p class="vote-head">🗳 この台、どうだった？<small>（打ったことがある方の感想・匿名）</small></p>
      <div class="vote-emojis">${VOTE_RATINGS.map((r) => `<button type="button" class="vote-emoji" data-v="${r.value}"><span>${r.emoji}</span><small>${r.label}</small></button>`).join("")}</div>
      <p class="vote-tags-title">ひとこと（最大${VOTE_MAX_TAGS}つ・任意）</p>
      <div class="vote-chips">${VOTE_TAGS.map((t) => `<button type="button" class="vote-chip" data-tag="${escapeHTML(t)}">${escapeHTML(t)}</button>`).join("")}</div>
      <button type="button" class="btn-primary vote-submit" disabled>投票する</button>
      <p class="vote-skip"><button type="button" class="link-btn vote-view">投票せずに結果を見る</button></p>`;
    const submitBtn = box.querySelector(".vote-submit");
    box.addEventListener("click", async (e) => {
      const emoji = e.target.closest(".vote-emoji");
      const chip = e.target.closest(".vote-chip");
      if (emoji) {
        sel.rating = Number(emoji.dataset.v);
        box.querySelectorAll(".vote-emoji").forEach((b) => b.classList.toggle("selected", b === emoji));
        submitBtn.disabled = false;
      } else if (chip) {
        const t = chip.dataset.tag;
        const i = sel.tags.indexOf(t);
        if (i >= 0) {
          sel.tags.splice(i, 1);
        } else {
          const opp = VOTE_OPPOSITES[t];
          if (opp && sel.tags.includes(opp)) sel.tags.splice(sel.tags.indexOf(opp), 1);
          if (sel.tags.length < VOTE_MAX_TAGS) sel.tags.push(t);
        }
        box.querySelectorAll(".vote-chip").forEach((c) => c.classList.toggle("selected", sel.tags.includes(c.dataset.tag)));
      } else if (e.target.closest(".vote-view")) {
        showResults(false);
      } else if (e.target.closest(".vote-submit") && sel.rating) {
        submitBtn.disabled = true;
        submitBtn.textContent = "送信中…";
        try {
          await votesSubmit(name, sel.rating, sel.tags);
          votesMarkVoted(name);
          track("machine_vote", { rating: sel.rating });
          showResults(true);
        } catch (err) {
          submitBtn.disabled = false;
          submitBtn.textContent = "投票する";
          alert("投票を送信できませんでした。時間をおいてもう一度お試しください。");
        }
      }
    });
  };

  if (votesAlreadyVoted(name)) showResults(false);
  else showForm();
}
