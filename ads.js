/* 広告（A8.net）の設定と表示。トップの画面（script.js など）と、機種ごとの専用ページ（m/*.html）の両方で使う。
   このファイルを先に読み込むこと。 */
/* ---------------- アフィリエイト広告（A8.net／アピールサイト：パチンコ・スロット占い） ----------------
   どの広告も「PR」表記つきの枠でのみ表示する。クリックはGA4の affiliate_click イベントで計測。 */
const ADS = {
  hunter: {
    id: "premium_hunter",
    href: "https://px.a8.net/svt/ejp?a8mat=4BCNG7+BZ1VIY+3ATI+5YJRM",
    pixel: "https://www14.a8.net/0.gif?a8mat=4BCNG7+BZ1VIY+3ATI+5YJRM",
    label: "スマホ対応★オンラインスロット",
    note: "※19歳以上の方向け。無料ポイントで遊べる景品交換型のゲームです。",
    // バナー素材015（336×280）
    banner: {
      href: "https://px.a8.net/svt/ejp?a8mat=4BCNG7+BZ1VIY+3ATI+61JSH",
      pixel: "https://www12.a8.net/0.gif?a8mat=4BCNG7+BZ1VIY+3ATI+61JSH",
      src: "https://www20.a8.net/svt/bgt?aid=260930743724&wid=002&eno=01&mid=s00000015399001015000&mc=1",
      w: 336,
      h: 280,
    },
  },
  keiba: {
    id: "keiba_saikyo",
    href: "https://px.a8.net/svt/ejp?a8mat=4BCNG7+BW2PI2+47AY+61Z82",
    pixel: "https://www18.a8.net/0.gif?a8mat=4BCNG7+BW2PI2+47AY+61Z82",
    label: "競馬予想なら！競馬最強の法則WEB",
    note: "※馬券の購入は20歳以上です。",
    // バナー素材061（350×263）。バナーがある広告はテキストの代わりにバナーを表示する
    banner: {
      href: "https://px.a8.net/svt/ejp?a8mat=4BCNG7+BW2PI2+47AY+6BEQ9",
      pixel: "https://www17.a8.net/0.gif?a8mat=4BCNG7+BW2PI2+47AY+6BEQ9",
      src: "https://www20.a8.net/svt/bgt?aid=260930743719&wid=002&eno=01&mid=s00000019609001061000&mc=1",
      w: 350,
      h: 263,
    },
  },
  hapitas: {
    id: "hapitas",
    href: "https://px.a8.net/svt/ejp?a8mat=4BC4QN+7WL8PM+1LP8+BWVTE",
    pixel: "https://www14.a8.net/0.gif?a8mat=4BC4QN+7WL8PM+1LP8+BWVTE",
    label: "ハピタス",
    note: "※無料で登録できるポイントサイトです。",
    // バナー素材058（250×250）
    banner: {
      href: "https://px.a8.net/svt/ejp?a8mat=4BC4QN+7WL8PM+1LP8+C93MP",
      pixel: "https://www16.a8.net/0.gif?a8mat=4BC4QN+7WL8PM+1LP8+C93MP",
      src: "https://www22.a8.net/svt/bgt?aid=260906495478&wid=002&eno=01&mid=s00000007478002058000&mc=1",
      w: 250,
      h: 250,
    },
  },
};

function adItemHTML(key, lead, placement) {
  const ad = ADS[key];
  if (ad.banner) {
    const b = ad.banner;
    return `<p class="ad-item">${lead}</p><a class="ad-banner-link" href="${b.href}" target="_blank" rel="nofollow sponsored noopener" data-ad="${ad.id}" data-placement="${placement}"><img class="ad-banner" src="${b.src}" width="${b.w}" height="${b.h}" alt="${ad.label}"></a><p class="ad-note">${ad.note}</p><img class="ad-pixel" border="0" width="1" height="1" src="${b.pixel}" alt="">`;
  }
  return `<p class="ad-item">${lead}<a href="${ad.href}" target="_blank" rel="nofollow sponsored noopener" data-ad="${ad.id}" data-placement="${placement}">${ad.label}</a></p><p class="ad-note">${ad.note}</p><img class="ad-pixel" border="0" width="1" height="1" src="${ad.pixel}" alt="">`;
}

function adBlockHTML(items, placement) {
  return `<p class="ad-slot-label">PR</p>` + items.map(([key, lead]) => adItemHTML(key, lead, placement)).join("");
}

// 承認待ちなどで ADS にまだ無い広告は、何も表示しない（機種カタログ・収支ノートの枠で使う）
function adSlotHTML(key, lead, placement) {
  return ADS[key] ? adBlockHTML([[key, lead]], placement) : "";
}

function track(name, params) {
  if (typeof gtag === "function") gtag("event", name, params);
}

document.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest("a[data-ad]");
  if (a) track("affiliate_click", { ad_id: a.dataset.ad, placement: a.dataset.placement });
});
