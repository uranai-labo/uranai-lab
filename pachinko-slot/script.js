/* ============================================================
   サイト設定
   別サイト（枕詞違い）を派生させる場合は、ここと index.html の
   タイトル/見出し文言、style.css の --accent 系カラーを差し替える。
   診断ロジック（QUESTIONS / MACHINES 以下）はそのまま使い回せる想定。
   ============================================================ */
const SITE_NAME = "パチンコ・スロット占い";

/* ---------------- 質問定義（全25問・占いチックな設問） ---------------- */
const QUESTIONS = [
  {
    key: "category",
    title: "今日占うのはどっち？",
    options: [
      { label: "パチンコ", value: "pachinko" },
      { label: "スロット", value: "slot" },
    ],
  },
  {
    key: "who",
    title: "今日は誰と行く？",
    options: [
      { label: "一人でじっくり", value: "solo" },
      { label: "友達とワイワイ", value: "friends" },
      { label: "恋人と", value: "couple" },
      { label: "まだ決めてない", value: "none" },
    ],
  },
  {
    key: "mood",
    title: "今日の気分は？",
    options: [
      { label: "まったり癒されたい", value: "chill" },
      { label: "熱くなりたい・勝負したい", value: "hot" },
      { label: "とにかく楽しく遊びたい", value: "fun" },
      { label: "暇つぶし・時間をつぶしたい", value: "kill_time" },
    ],
  },
  {
    key: "budget",
    title: "今日の予算は？",
    options: [
      { label: "〜5,000円", value: "low" },
      { label: "〜10,000円", value: "mid" },
      { label: "1〜3万円", value: "high" },
      { label: "3万円以上", value: "max" },
    ],
  },
  {
    key: "time",
    title: "今日打てる時間は？",
    options: [
      { label: "1時間以内", value: "short" },
      { label: "2〜3時間", value: "mid" },
      { label: "半日くらい", value: "long" },
      { label: "一日中いける", value: "allday" },
    ],
  },
  {
    key: "blood",
    title: "あなたの血液型は？",
    options: [
      { label: "A型", value: "A" },
      { label: "B型", value: "B" },
      { label: "O型", value: "O" },
      { label: "AB型", value: "AB" },
    ],
  },
  {
    key: "zodiac",
    title: "あなたの星座は？",
    options: [
      "おひつじ座","おうし座","ふたご座","かに座","しし座","おとめ座",
      "てんびん座","さそり座","いて座","やぎ座","みずがめ座","うお座",
    ].map((label) => ({ label, value: label })),
  },
  {
    key: "color",
    title: "直感で惹かれる色は？",
    options: [
      { label: "赤", value: "red" },
      { label: "青", value: "blue" },
      { label: "黄", value: "yellow" },
      { label: "緑", value: "green" },
      { label: "紫", value: "purple" },
      { label: "白", value: "white" },
    ],
  },
  {
    key: "weather",
    title: "今日の気分を天気で例えると？",
    options: [
      { label: "快晴", value: "sunny" },
      { label: "くもり", value: "cloudy" },
      { label: "雨", value: "rain" },
      { label: "雷雨", value: "thunder" },
    ],
  },
  {
    key: "number",
    title: "直感で数字をひとつ選んで",
    options: [
      { label: "1", value: "1" },
      { label: "3", value: "3" },
      { label: "7", value: "7" },
      { label: "9", value: "9" },
    ],
  },
  {
    key: "direction",
    title: "なんとなく惹かれる方角は？",
    options: [
      { label: "東", value: "east" },
      { label: "西", value: "west" },
      { label: "南", value: "south" },
      { label: "北", value: "north" },
    ],
  },
  {
    key: "seat",
    title: "座るならどんな場所が落ち着く？",
    options: [
      { label: "端っこの席", value: "edge" },
      { label: "島の中央", value: "center" },
      { label: "窓側・入口側", value: "window" },
      { label: "通路側", value: "aisle" },
    ],
  },
  {
    key: "suit",
    title: "直感で選ぶトランプのマークは？",
    options: [
      { label: "ハート", value: "heart" },
      { label: "スペード", value: "spade" },
      { label: "ダイヤ", value: "diamond" },
      { label: "クラブ", value: "club" },
    ],
  },
  {
    key: "pastlife",
    title: "前世は何だったと思う？（直感で）",
    options: [
      { label: "武将", value: "warrior" },
      { label: "旅人", value: "traveler" },
      { label: "忍者", value: "ninja" },
      { label: "職人", value: "craftsman" },
    ],
  },
  {
    key: "focus",
    title: "今日の集中力は？",
    options: [
      { label: "絶好調", value: "great" },
      { label: "まあまあ", value: "ok" },
      { label: "普通", value: "normal" },
      { label: "イマイチ", value: "low" },
    ],
  },
  {
    key: "kanji",
    title: "今日惹かれる漢字は？",
    options: [
      { label: "勝", value: "win" },
      { label: "運", value: "luck" },
      { label: "静", value: "calm" },
      { label: "熱", value: "heat" },
      { label: "風", value: "wind" },
    ],
  },
  {
    key: "season",
    title: "好きな季節は？",
    options: [
      { label: "春", value: "spring" },
      { label: "夏", value: "summer" },
      { label: "秋", value: "autumn" },
      { label: "冬", value: "winter" },
    ],
  },
  {
    key: "timeofday",
    title: "自分は何型だと思う？",
    options: [
      { label: "朝型", value: "morning" },
      { label: "昼型", value: "noon" },
      { label: "夕方型", value: "evening" },
      { label: "夜型", value: "night" },
    ],
  },
  {
    key: "condition",
    title: "今日の体調は？",
    options: [
      { label: "絶好調", value: "great" },
      { label: "普通", value: "normal" },
      { label: "ちょっと眠い", value: "sleepy" },
      { label: "そわそわする", value: "restless" },
    ],
  },
  {
    key: "dream",
    title: "最近見た夢に近いのは？",
    options: [
      { label: "空を飛ぶ夢", value: "flying" },
      { label: "追いかけられる夢", value: "chased" },
      { label: "知らない街を歩く夢", value: "town" },
      { label: "あまり覚えてない", value: "none" },
    ],
  },
  {
    key: "wallet",
    title: "財布の中の小銭、多い気がする？",
    options: [
      { label: "多い", value: "many" },
      { label: "少ない", value: "few" },
      { label: "ちょうどいい", value: "just_right" },
      { label: "わからない", value: "unknown" },
    ],
  },
  {
    key: "numberpattern",
    title: "好きな数字の並びは？",
    options: [
      { label: "ゾロ目", value: "repdigit" },
      { label: "連番", value: "sequence" },
      { label: "奇数", value: "odd" },
      { label: "偶数", value: "even" },
    ],
  },
  {
    key: "stance",
    title: "今日は「攻め」と「守り」どっちの気分？",
    options: [
      { label: "攻め", value: "attack" },
      { label: "守り", value: "defense" },
    ],
  },
  {
    key: "genrepref",
    title: "今日なんとなく惹かれるのは？",
    options: [
      { label: "版権・アニメ系", value: "license" },
      { label: "オリジナル系", value: "original" },
      { label: "昔からある定番機", value: "classic" },
      { label: "新台・話題機", value: "new" },
    ],
  },
  {
    key: "birthMonth",
    title: "あなたの生まれ月は？（運勢の算出に使います）",
    options: Array.from({ length: 12 }, (_, i) => ({
      label: `${i + 1}月`,
      value: String(i + 1),
    })),
  },
];

/* ---------------- 機種データ ----------------
   2026年9月時点でP-WORLD／DMMぱちタウン／altemaの現行機種一覧・人気ランキングを
   WebSearchで確認し、スペック区分ごとに実在の機種名を収集したもの。
   登録機種は全国で1万種以上あり「文字通り全て」を手作業で網羅するのは非現実的なため、
   主要スペック区分（パチンコ4区分・スロット4区分）ごとに実機を厚めに収録する方式にしている。
   区分を増やす／機種を追加する場合はこの MACHINES オブジェクトに配列を足すだけでよい。
   ------------------------------------------------------------ */
const SPEC_LABELS = {
  pachinko: {
    amadegi: "甘デジ",
    lightmiddle: "ライトミドル",
    middle: "ミドル",
    highspec: "ハイスペック（1種2種混合など）",
  },
  slot: {
    normal: "ノーマルタイプ（Aタイプ）",
    at: "AT機",
    art: "ART機",
    smart: "スマスロ",
  },
};

const SPEC_DESC = {
  pachinko: {
    amadegi: "低投資で長く遊べる、初心者にもやさしいタイプ。数字を狙うより時間を楽しむ日に。",
    lightmiddle: "甘デジよりやや荒いが、それでも手を出しやすいバランス型。",
    middle: "確率変動ありでムラはあるが、当たれば波に乗れるスペック。",
    highspec: "一撃の破壊力が魅力。当たれば大きいが、荒れる覚悟も必要な日に。",
  },
  slot: {
    normal: "ボーナスのみのシンプル設計。設定狙い・じっくり派に向いているタイプ。",
    at: "小役の引きと有利区間の管理がカギ。回転数を積み重ねたい日に。",
    art: "初当たりからの直撃や完走型など、当たれば伸びるタイプ。",
    smart: "スマスロ機。従来にない有利区間・天井設計で、新しい遊技感覚を試したい日に。",
  },
};

const MACHINES = {
  pachinko: {
    amadegi: [
      "eフィーバーダンベル何キロ持てる？2 77ver.",
      "eフィーバーBASTARD!! -暗黒の破壊神- Light ver.",
      "桃太郎電鉄 〜ぱちんこも定番！〜",
      "eACわんわんパラダイスCELEBRATION",
      "PA愛の不時着 99スイート ver.",
      "Pうしおととら〜神のせSPEC〜100ver.",
      "eフィーバー炎炎ノ消防隊2 99ver.",
      "PA大海物語Withアグネス・ラム Premium Edition",
      "eシン・ウルトラマン 79ver.",
      "P 春一番 2026",
      "Pぱちんこ押忍！番長 漢の頂 99ver.",
      "eぱちんこ押忍！番長 漢の頂 99ver.",
      "PシャカRUSH Z Jr.",
      "PAスーパー海物語IN沖縄6 Withえなこ",
      "e 化物語 鬼99ver.",
      "PA花の慶次〜傾奇一転 87ver.",
      "P 魔法少女まどか☆マギカ3 キュゥべえver.",
      "Pクイーンズブレイド奈落ナナエル79Ver.",
      "PフィーバークィーンⅡ",
      "デカスタP戦国無双100ver.",
    ],
    lightmiddle: [
      "ソードアート・オンライン アリシゼーション 夜空（京楽）",
      "アサルトリリィ（ビスティ）",
      "甲鉄城のカバネリ2 輪廻の果報119ver.（サミー）",
      "東京リベンジャーズ 聖夜決戦編（サミー）",
      "ソードアート・オンライン 閃光の軌跡（京楽）",
      "Re:ゼロから始める異世界生活 season2 129ver.（大都技研）",
      "ゾン100〜ゾンビになるまでにしたい100のこと〜（サンセイR&D）",
      "86-エイティシックス-（アムテックス）",
      "魔法少女まどか☆マギカ3（京楽）",
      "アクセル・ワールド（ニューギン）",
      "フィーバーブルーロック Light ver.（SANKYO）",
      "とある科学の超電磁砲 PHASE NEXT（オレンジ）",
      "フィーバーもののがたり（SANKYO）",
      "冥妃転生（メーシー）",
      "Re:ゼロから始める異世界生活 season2 249ver.（大都技研）",
      "ワールドダイスター（大都技研）",
      "範馬刃牙 129ver.（アムテックス）",
      "ラグナドール 妖しき皇帝と終焉の夜叉姫（メーシー）",
      "新世紀エヴァンゲリオン〜未来への咆哮〜PREMIUM MODEL（ビスティ）",
      "フィーバー機動戦士ガンダムユニコーン再来 129ver.（SANKYO）",
    ],
    middle: [
      "eリコリス・リコイル（ニューギン）",
      "新世紀エヴァンゲリオン〜未来への咆哮〜（ビスティ）",
      "eフィーバー妖怪ウォッチ（SANKYO）",
      "e七つの大罪3（サミー）",
      "ぱちんこ 必殺仕事人Ⅵ（京楽）",
      "e Re:ゼロから始める異世界生活 season2（大都技研）",
      "e魔法少女まどか☆マギカ3 時間遡行〜始まりの願い〜（京楽）",
      "e一方通行 最狂（オレンジ）",
      "eソードアート・オンライン オルタナティブ ガンゲイル・オンライン（大都技研）",
      "e甲鉄城のカバネリ2 咲かせや燦然（サミー）",
      "e東京リベンジャーズ（サミー）",
      "e虚構推理（D-light）",
      "eミリオンゴッド-天空の雷撃-（メーシー）",
      "e真・一騎当千〜軍神覚醒〜319大入りver.（D-light）",
      "ぱちんこ シン・エヴァンゲリオン Type レイ（ビスティ）",
      "P北斗の拳 暴凶星（サミー）",
    ],
    highspec: [
      "Re:ゼロから始める異世界生活 season2（大都技研）",
      "魔法少女まどか☆マギカ3（京楽）",
      "北斗の拳 暴凶星（サミー）",
      "Re:ゼロから始める異世界生活 鬼がかりver.（大都技研）",
      "フィーバー炎炎ノ消防隊Light ver.（SANKYO）",
      "大海物語5 ブラック（三洋）",
      "とある魔術の禁書目録2（JFJ）",
      "とある科学の超電磁砲（藤商事）",
      "とある科学の超電磁砲2（JFJ）",
      "フィーバー機動戦士ガンダムユニコーン 再来（SANKYO）",
      "フィーバー 機動戦士ガンダムユニコーン（SANKYO）",
      "フィーバー炎炎ノ消防隊（SANKYO）",
      "スーパー海物語IN地中海2（三洋）",
      "スーパー海物語 IN 沖縄5 夜桜超旋風 99ver.（三洋）",
    ],
  },
  slot: {
    normal: [
      "バーサス",
      "クレアの秘宝伝 〜眠りの塔とめざめの石〜",
      "A-SLOT偽物語",
      "ハナビ",
      "パチスロコードギアス反逆のルルーシュR2 C.C.ver.",
      "パチスロディスクアップ",
      "アレックス",
      "新世紀エヴァンゲリオン〜魂の軌跡〜",
      "グレートキングハナハナ",
      "ゲッターマウス",
      "マイジャグラーⅣ",
      "サンダーVリボルト",
      "新世紀エヴァンゲリオン〜まごころを、君に〜",
      "押忍！番長A",
      "クランキーコレクション",
      "SLOT魔法少女まどか☆マギカA",
      "パチスロ 快盗天使ツインエンジェル2",
      "熊酒場2丁目店",
      "クレアの秘宝伝〜はじまりの扉と太陽の石〜",
      "A-SLOT北斗の拳 将",
    ],
    at: [
      "パチスロライザのアトリエ 常闇の女王と秘密の隠れ家",
      "Lアカマター",
      "スマスロゼーガペインETR",
      "スマスロ バジリスク～甲賀忍法帖～Ⅳ",
      "スマート沖スロ ハイハイシオサイRe",
      "スロット Vivy -Fluorite Eye's Song-",
      "L聖闘士星矢 黄金十二宮",
      "L ソードアート・オンライン オルタナティブ ガンゲイル・オンライン",
      "スマスロ ラグナドール",
      "Lウミンチュ",
      "L魔法少女にあこがれて",
      "スマスロ 獣王",
      "L 転生王女と天才令嬢の魔法革命",
      "スマスロパリピ孔明",
      "スマスロ モンスターハンターライズ：サンブレイク",
      "Lパチスロ 彼女、お借りします",
      "L青春ブタ野郎はバニーガール先輩の夢を見ない",
      "パチスロ見える子ちゃん",
      "モグモグ風林火山 大海戦の巻",
      "スマスロ リコリス・リコイル",
    ],
    art: [
      "スマスロ 快盗天使ツインエンジェル2（サミー）",
      "Lパチスロ 喰霊-零-Re（オーイズミ）",
      "Lパチスロうみねこのなく頃に2（オーイズミ）",
      "パチスロ ダンジョンに出会いを求めるのは間違っているだろうか2（北電子）",
      "スマスロ ストライク・ザ・ブラッド（エンターライズ）",
      "マジカルハロウィン８（コナミアミューズメント）",
      "パチスロ交響詩篇エウレカセブン HI-EVOLUTION ZERO TYPE-ART（サミー）",
      "L ひぐらしのなく頃に 業（D-light）",
      "ファミスタ回胴版!!（ユニバーサルブロス）",
      "防空少女ラブキューレ2〜極限の共鳴〜（コナミアミューズメント）",
      "パチスロ 魔法少女育成計画（カルミナ）",
      "パチスロ ピンクパンサーSP（山佐）",
      "マジカルハロウィン〜Trick or Treat！〜（コナミアミューズメント）",
      "パチスロひぐらしのなく頃に祭2（オーイズミ）",
      "いろはに愛姫（パオン・ディーピー）",
      "戦国BASARA HEROES PARTY（エンターライズ）",
      "戦国パチスロ花の慶次 ～天を穿つ戦槍～剛弓ver.（ニューギン）",
      "アナザーゴッドハーデス-冥王召喚-（ミズホ）",
      "回胴黙示録カイジ4（サミー）",
      "パチスロ巨人の星～情熱編～（サンセイR&D）",
    ],
    smart: [
      "スマスロ リコリス・リコイル（サミー）",
      "L青春ブタ野郎はバニーガール先輩の夢を見ない（オリンピア）",
      "L 東京喰種（スパイキー）",
      "スロット ソードアート・オンラインⅡ（パオン・ディーピー）",
      "L戦国乙女5 業火を穿つ宿焔の双刃（オリンピア）",
      "Lパチスロ 彼女、お借りします（SANKYO）",
      "スマスロ とある魔術の禁書目録2（藤商事）",
      "スマスロ 甲鉄城のカバネリ 海門決戦（サミー）",
      "Lパチスロ 炎炎ノ消防隊2（SANKYO）",
      "スマスロモンキーターンV（山佐）",
      "真打 吉宗（大都技研）",
      "Lパチスロ からくりサーカス2（SANKYO）",
      "Lパチスロ 革命機ヴァルヴレイヴ2（SANKYO）",
      "スマスロ やじきた道中記参る！（ユニバーサルブロス）",
      "戦国コレクション6（コナミアミューズメント）",
      "スマスロ マギアレコード 魔法少女まどか☆マギカ外伝（ミズホ）",
      "スマスロ ミリオンゴッド-神々の軌跡-（ミズホ）",
      "スロット ワールドダイスター（パオン・ディーピー）",
      "スマスロ 北斗の拳 転生の章2（サミー）",
      "スマスロ タコスロ（ユニバーサルブロス）",
    ],
  },
};

// 「今日なんとなく惹かれるのは？」の回答をスペック区分に対応づける
// （版権・アニメ系＝ハイスペック/ART寄り、オリジナル系＝甘デジ/ノーマル寄り、
//   定番機＝ミドル/AT寄り、新台・話題機＝ライトミドル/スマスロ寄り、という体感マッピング）
const GENREPREF_TO_SPEC = {
  pachinko: { license: "highspec", original: "amadegi", classic: "middle", new: "lightmiddle" },
  slot: { license: "art", original: "normal", classic: "at", new: "smart" },
};

/* ---------------- 診断結果の素材（占い師キャラ「ロトさん」の語り口で統一） ---------------- */
const ADVICE_POOL = [
  "朝一の台選びは、データカウンターの「前日の履歴」を見てから座るんじゃぞ。",
  "決めた予算まで使ったら、潔く切り上げるのが今日は吉だな。深追いは無しだぞ。",
  "台選びに迷ったら、角台・端台より島の中央寄りを狙ってみるといいぞ。",
  "長時間戦になりそうな日じゃな。1〜2時間おきに休憩を挟むとリズムが整うぞ。",
  "今日は「ヤメ時」を先に決めてから座ると、いい形で終われそうだな。",
  "友達と行くなら、同じ島で近くの台を選ぶと情報交換しやすいぞ。ワシもよくやったもんじゃ。",
  "気になる新台があるなら、今日は思い切って試してみるといいだろう。",
  "設定狙いより「据え置きやすい台」を意識した方が、今日は噛み合いそうだぞ。",
];

const LUCKY_POOL = [
  "ラッキーカラー：赤",
  "ラッキーカラー：ゴールド",
  "ラッキーナンバー：7",
  "ラッキーナンバー：3",
  "ラッキータイム：開店直後",
  "ラッキータイム：夕方16時以降",
  "ラッキーアクション：席に座る前に一呼吸おく",
  "ラッキーアクション：出目や演出をメモしながら打つ",
];

const RANKS = ["SS", "S", "A", "B", "C"];

/* ---------------- 簡易ハッシュ（日付＋回答で決定論的に算出） ---------------- */
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/* ---------------- 状態管理 ---------------- */
const state = {
  step: 0,
  answers: {},
};

const screens = {
  intro: document.getElementById("screen-intro"),
  quiz: document.getElementById("screen-quiz"),
  result: document.getElementById("screen-result"),
};

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
}

/* ---------------- クイズ描画 ---------------- */
const quizStepsEl = document.getElementById("quiz-steps");
const progressBar = document.getElementById("progress-bar");

function renderQuiz() {
  quizStepsEl.innerHTML = "";
  QUESTIONS.forEach((q, i) => {
    const stepEl = document.createElement("div");
    stepEl.className = "step" + (i === state.step ? " active" : "");
    stepEl.dataset.index = i;

    if (i > 0) {
      const back = document.createElement("button");
      back.className = "step-back";
      back.textContent = "← 戻る";
      back.addEventListener("click", () => {
        state.step = i - 1;
        renderQuiz();
      });
      stepEl.appendChild(back);
    }

    const h2 = document.createElement("h2");
    h2.textContent = q.title;
    stepEl.appendChild(h2);

    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.textContent = opt.label;
      if (state.answers[q.key] === opt.value) btn.classList.add("selected");
      btn.addEventListener("click", () => {
        state.answers[q.key] = opt.value;
        if (i < QUESTIONS.length - 1) {
          state.step = i + 1;
          renderQuiz();
        } else {
          showResult();
        }
      });
      stepEl.appendChild(btn);
    });

    quizStepsEl.appendChild(stepEl);
  });

  progressBar.style.width = `${((state.step + 1) / QUESTIONS.length) * 100}%`;
}

/* ---------------- 結果算出 ---------------- */
function pickFromPool(pool, seedStr) {
  const h = hashString(seedStr);
  return pool[h % pool.length];
}

function showResult() {
  const seedStr = `${todayKey()}-${Object.values(state.answers).join("-")}`;
  const hash = hashString(seedStr);

  const category = state.answers.category === "pachinko" ? "pachinko" : "slot";
  const isPachinko = category === "pachinko";
  const specGroups = MACHINES[category];
  const specKeys = Object.keys(specGroups);

  // 「今日なんとなく惹かれるのは？」の回答から、あなた専用のメインおすすめのスペック区分を決める
  const pref = state.answers.genrepref;
  const mainSpec = GENREPREF_TO_SPEC[category][pref] || specKeys[0];
  const mainPool = specGroups[mainSpec];
  const mainMachine = pickFromPool(mainPool, seedStr);

  const rankIndex = Math.floor(hash / mainPool.length) % RANKS.length;
  const rank = RANKS[rankIndex];

  const advice = ADVICE_POOL[hash % ADVICE_POOL.length];
  const lucky = LUCKY_POOL[Math.floor(hash / 7) % LUCKY_POOL.length];

  document.getElementById("result-rank").textContent = rank;
  document.getElementById("result-type").textContent =
    `${isPachinko ? "パチンコ" : "スロット"} ／ ${SPEC_LABELS[category][mainSpec]}`;
  document.getElementById("result-genre").textContent = mainMachine;
  document.getElementById("result-desc").textContent = SPEC_DESC[category][mainSpec];
  document.getElementById("result-advice").textContent = advice;
  document.getElementById("result-lucky").textContent = lucky;

  // スペック区分別：今日のおすすめ一覧（区分ごとに独立したシードで選出）
  const specListEl = document.getElementById("spec-list");
  specListEl.innerHTML = "";
  specKeys.forEach((specKey) => {
    const pool = specGroups[specKey];
    const machine = pickFromPool(pool, `${seedStr}-${specKey}`);
    const li = document.createElement("li");
    li.className = "spec-item" + (specKey === mainSpec ? " spec-item-main" : "");
    li.innerHTML = `<span class="spec-name">${SPEC_LABELS[category][specKey]}</span><span class="spec-machine">${machine}</span>`;
    specListEl.appendChild(li);
  });

  showScreen("result");
}

/* ---------------- イベント ---------------- */
document.getElementById("btn-start").addEventListener("click", () => {
  state.step = 0;
  renderQuiz();
  showScreen("quiz");
});

document.getElementById("btn-retry").addEventListener("click", () => {
  state.step = 0;
  state.answers = {};
  showScreen("intro");
});

document.getElementById("btn-share").addEventListener("click", () => {
  const rank = document.getElementById("result-rank").textContent;
  const genre = document.getElementById("result-genre").textContent;
  const text = `【${SITE_NAME}】今日の運勢は「${rank}」、おすすめは「${genre}」でした！`;
  const url = location.href;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text
  )}&url=${encodeURIComponent(url)}`;
  window.open(shareUrl, "_blank", "noopener");
});
