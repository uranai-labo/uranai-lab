/* ============================================================
   サイト設定
   別サイト（枕詞違い）を派生させる場合は、ここと index.html の
   タイトル/見出し文言、style.css の --accent 系カラーを差し替える。
   診断ロジック（QUESTION_POOL / MACHINES 以下）はそのまま使い回せる想定。
   ============================================================ */
const SITE_NAME = "パチンコ・スロット占い";

/* ---------------- 質問定義 ----------------
   「category」は最初に必ず聞く（パチンコ/スロットの判定に使うため）。
   「genrepref」は最後に必ず聞く（結果のスペック区分決定に使うため）。
   その間は QUESTION_POOL からランダムに選出・ランダムな順番で出題することで、
   毎回同じ質問にならないようにしている（buildQuizRoute参照）。
   ------------------------------------------------------------ */
const FIXED_START_QUESTION = {
  key: "category",
  title: "今日占うのはどっち？",
  options: [
    { label: "パチンコ", value: "pachinko" },
    { label: "スロット", value: "slot" },
  ],
};

const FIXED_END_QUESTION = {
  key: "genrepref",
  title: "今日なんとなく惹かれるのは？",
  options: [
    { label: "版権・アニメ系", value: "license" },
    { label: "オリジナル系", value: "original" },
    { label: "昔からある定番機", value: "classic" },
    { label: "新台・話題機", value: "new" },
  ],
};

// 出題ルートに毎回含める質問の数（この数だけ QUESTION_POOL からランダムに抽出する）
const ROUTE_POOL_COUNT = 18;

const QUESTION_POOL = [
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
    key: "birthMonth",
    title: "あなたの生まれ月は？（運勢の算出に使います）",
    options: Array.from({ length: 12 }, (_, i) => ({
      label: `${i + 1}月`,
      value: String(i + 1),
    })),
  },

  /* ---- ここから追加の余剰質問（毎回ランダムに一部だけ出題される） ---- */
  {
    key: "eto",
    title: "あなたの干支は？",
    options: [
      "子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥",
    ].map((label) => ({ label, value: label })),
  },
  {
    key: "taste",
    title: "直感で好きな味は？",
    options: [
      { label: "甘い", value: "sweet" },
      { label: "辛い", value: "spicy" },
      { label: "しょっぱい", value: "salty" },
      { label: "酸っぱい", value: "sour" },
    ],
  },
  {
    key: "drink",
    title: "好きな飲み物は？",
    options: [
      { label: "コーヒー", value: "coffee" },
      { label: "お茶", value: "tea" },
      { label: "ジュース", value: "juice" },
      { label: "水・炭酸水", value: "water" },
    ],
  },
  {
    key: "palmline",
    title: "手相で気になる線は？",
    options: [
      { label: "生命線", value: "life" },
      { label: "感情線", value: "emotion" },
      { label: "知能線", value: "brain" },
      { label: "運命線", value: "fate" },
    ],
  },
  {
    key: "omikuji",
    title: "おみくじで出てほしいのは？",
    options: [
      { label: "大吉", value: "daikichi" },
      { label: "中吉", value: "chukichi" },
      { label: "吉", value: "kichi" },
      { label: "末吉", value: "suekichi" },
    ],
  },
  {
    key: "animal",
    title: "直感で好きな動物は？",
    options: [
      { label: "犬", value: "dog" },
      { label: "猫", value: "cat" },
      { label: "鳥", value: "bird" },
      { label: "うさぎ", value: "rabbit" },
    ],
  },
  {
    key: "celestial",
    title: "好きな天体は？",
    options: [
      { label: "太陽", value: "sun" },
      { label: "月", value: "moon" },
      { label: "星", value: "star" },
      { label: "惑星", value: "planet" },
    ],
  },
  {
    key: "stoneColor",
    title: "パワーストーンで惹かれる色は？",
    options: [
      { label: "透明・白", value: "clear" },
      { label: "黒", value: "black" },
      { label: "緑", value: "green" },
      { label: "青", value: "blue" },
    ],
  },
  {
    key: "sound",
    title: "今日惹かれる音は？",
    options: [
      { label: "静寂", value: "silence" },
      { label: "雨音", value: "rain" },
      { label: "音楽", value: "music" },
      { label: "賑わい", value: "bustle" },
    ],
  },
  {
    key: "dominantHand",
    title: "利き手は？",
    options: [
      { label: "右利き", value: "right" },
      { label: "左利き", value: "left" },
      { label: "両利き", value: "both" },
    ],
  },
  {
    key: "shoeOrder",
    title: "靴を履くのはどっちの足から？",
    options: [
      { label: "右から", value: "right" },
      { label: "左から", value: "left" },
      { label: "気にしたことない", value: "none" },
    ],
  },
  {
    key: "walletColor",
    title: "財布の色は？",
    options: [
      { label: "金色・黄色系", value: "gold" },
      { label: "黒", value: "black" },
      { label: "赤", value: "red" },
      { label: "茶色", value: "brown" },
    ],
  },
  {
    key: "scent",
    title: "好きな香りは？",
    options: [
      { label: "柑橘系", value: "citrus" },
      { label: "フローラル系", value: "floral" },
      { label: "ウッド系", value: "wood" },
      { label: "無香", value: "none" },
    ],
  },
  {
    key: "tempFeel",
    title: "今日の気温の感じ方は？",
    options: [
      { label: "暑い", value: "hot" },
      { label: "ちょうどいい", value: "nice" },
      { label: "肌寒い", value: "cool" },
      { label: "寒い", value: "cold" },
    ],
  },
  {
    key: "timeSpend",
    title: "好きな時間の過ごし方は？",
    options: [
      { label: "一人の時間", value: "alone" },
      { label: "誰かと過ごす", value: "together" },
      { label: "自然の中", value: "nature" },
      { label: "賑やかな場所", value: "crowd" },
    ],
  },
  {
    key: "recentIncrease",
    title: "最近増えた気がするものは？",
    options: [
      { label: "物", value: "things" },
      { label: "お金", value: "money" },
      { label: "悩み", value: "worries" },
      { label: "やる気", value: "motivation" },
    ],
  },
  {
    key: "intuitionSide",
    title: "直感でどちらが良い気がする？",
    options: [
      { label: "右", value: "right" },
      { label: "左", value: "left" },
    ],
  },
  {
    key: "vehicle",
    title: "好きな乗り物は？",
    options: [
      { label: "車", value: "car" },
      { label: "電車", value: "train" },
      { label: "バイク", value: "bike" },
      { label: "自転車", value: "bicycle" },
    ],
  },
  {
    key: "sportsWatch",
    title: "好きなスポーツ観戦は？",
    options: [
      { label: "野球", value: "baseball" },
      { label: "サッカー", value: "soccer" },
      { label: "相撲", value: "sumo" },
      { label: "格闘技", value: "fighting" },
    ],
  },
  {
    key: "cafeSeat",
    title: "カフェで座るなら？",
    options: [
      { label: "窓際", value: "window" },
      { label: "奥の席", value: "back" },
      { label: "カウンター", value: "counter" },
      { label: "テラス", value: "terrace" },
    ],
  },
  {
    key: "clockStyle",
    title: "好きな時計の形は？",
    options: [
      { label: "アナログ", value: "analog" },
      { label: "デジタル", value: "digital" },
      { label: "砂時計", value: "hourglass" },
      { label: "日時計", value: "sundial" },
    ],
  },
  {
    key: "shape",
    title: "直感で好きな図形は？",
    options: [
      { label: "丸", value: "circle" },
      { label: "三角", value: "triangle" },
      { label: "四角", value: "square" },
      { label: "星形", value: "star" },
    ],
  },
  {
    key: "jankenFirst",
    title: "じゃんけんで最初に出しがちなのは？",
    options: [
      { label: "グー", value: "rock" },
      { label: "チョキ", value: "scissors" },
      { label: "パー", value: "paper" },
    ],
  },
  {
    key: "zodiacElement",
    title: "星座の性質で近いのは？",
    options: [
      { label: "火（牡羊・獅子・射手）", value: "fire" },
      { label: "地（牡牛・乙女・山羊）", value: "earth" },
      { label: "風（双子・天秤・水瓶）", value: "air" },
      { label: "水（蟹・蠍・魚）", value: "water" },
    ],
  },
  {
    key: "diceWish",
    title: "サイコロを振って出てほしい目は？",
    options: [
      { label: "1", value: "1" },
      { label: "3", value: "3" },
      { label: "5", value: "5" },
      { label: "6", value: "6" },
    ],
  },
  {
    key: "charmType",
    title: "お守りを選ぶなら？",
    options: [
      { label: "金運", value: "money" },
      { label: "勝負運", value: "victory" },
      { label: "縁結び", value: "love" },
      { label: "健康", value: "health" },
    ],
  },
  {
    key: "flower",
    title: "直感で好きな花は？",
    options: [
      { label: "桜", value: "sakura" },
      { label: "向日葵", value: "sunflower" },
      { label: "バラ", value: "rose" },
      { label: "椿", value: "camellia" },
    ],
  },
  {
    key: "kanjiPhrase",
    title: "響きが好きな四字熟語は？",
    options: [
      { label: "一攫千金", value: "ikkaku" },
      { label: "七転八起", value: "shichiten" },
      { label: "大願成就", value: "taigan" },
      { label: "運気上昇", value: "unki" },
    ],
  },
  {
    key: "clothColor",
    title: "今日の服は何系の色？",
    options: [
      { label: "明るい色", value: "bright" },
      { label: "暗い色", value: "dark" },
      { label: "派手な色", value: "flashy" },
      { label: "地味な色", value: "plain" },
    ],
  },
  {
    key: "cardGame",
    title: "好きなカードゲームは？",
    options: [
      { label: "トランプ", value: "cards" },
      { label: "花札", value: "hanafuda" },
      { label: "UNO", value: "uno" },
      { label: "ポーカー", value: "poker" },
    ],
  },
  {
    key: "jinxHabit",
    title: "縁起の担ぎ方といえば？",
    options: [
      { label: "ゲン担ぎご飯を食べる", value: "food" },
      { label: "お守りを持つ", value: "charm" },
      { label: "願掛けをする", value: "vow" },
      { label: "特にしない", value: "none" },
    ],
  },
  {
    key: "oddEven",
    title: "奇数派？偶数派？",
    options: [
      { label: "奇数派", value: "odd" },
      { label: "偶数派", value: "even" },
    ],
  },
  {
    key: "meetupTiming",
    title: "待ち合わせのタイプは？",
    options: [
      { label: "早めに着く", value: "early" },
      { label: "ぴったりに着く", value: "ontime" },
      { label: "少し遅れがち", value: "late" },
    ],
  },
  {
    key: "musicGenre",
    title: "好きな音楽の雰囲気は？",
    options: [
      { label: "アップテンポ", value: "upbeat" },
      { label: "バラード", value: "ballad" },
      { label: "レトロ", value: "retro" },
      { label: "静か系", value: "calm" },
    ],
  },
  {
    key: "cravingToday",
    title: "今日一番食べたいものは？",
    options: [
      { label: "甘いもの", value: "sweet" },
      { label: "しょっぱいもの", value: "salty" },
      { label: "麺類", value: "noodles" },
      { label: "ご飯もの", value: "rice" },
    ],
  },
  {
    key: "starView",
    title: "好きな星の見え方は？",
    options: [
      { label: "満天の星", value: "starry_sky" },
      { label: "一番星", value: "first_star" },
      { label: "流れ星", value: "shooting_star" },
      { label: "月と一緒", value: "with_moon" },
    ],
  },
  {
    key: "walletItem",
    title: "財布に入れておきたいものは？",
    options: [
      { label: "五円玉", value: "coin" },
      { label: "お札は上向きに", value: "bills_up" },
      { label: "レシートは持たない", value: "no_receipt" },
      { label: "特にこだわりなし", value: "none" },
    ],
  },
  {
    key: "skyColor",
    title: "好きな時間帯の空の色は？",
    options: [
      { label: "朝焼け", value: "dawn" },
      { label: "青空", value: "blue_sky" },
      { label: "夕焼け", value: "sunset" },
      { label: "星空", value: "starry" },
    ],
  },
  {
    key: "doorColor",
    title: "直感で選ぶ扉の色は？",
    options: [
      { label: "赤い扉", value: "red" },
      { label: "青い扉", value: "blue" },
      { label: "金の扉", value: "gold" },
      { label: "木の扉", value: "wood" },
    ],
  },
  {
    key: "luckyItemType",
    title: "ラッキーアイテムにするなら？",
    options: [
      { label: "リング", value: "ring" },
      { label: "ネックレス", value: "necklace" },
      { label: "キーホルダー", value: "keyholder" },
      { label: "腕時計", value: "watch" },
    ],
  },
  {
    key: "folktale",
    title: "好きな昔話は？",
    options: [
      { label: "桃太郎", value: "momotaro" },
      { label: "浦島太郎", value: "urashima" },
      { label: "かぐや姫", value: "kaguyahime" },
      { label: "一寸法師", value: "issunboshi" },
    ],
  },
  {
    key: "todayVibe",
    title: "今日のテンションを一言で言うと？",
    options: [
      { label: "ワクワク", value: "excited" },
      { label: "落ち着き", value: "calm" },
      { label: "そわそわ", value: "restless" },
      { label: "どっしり", value: "steady" },
    ],
  },
  {
    key: "uranaiGenre",
    title: "好きな占いジャンルは？",
    options: [
      { label: "星座占い", value: "zodiac" },
      { label: "血液型占い", value: "blood" },
      { label: "タロット", value: "tarot" },
      { label: "手相", value: "palm" },
    ],
  },
  {
    key: "walletConcern",
    title: "財布の中で気になるのは？",
    options: [
      { label: "小銭の量", value: "coins" },
      { label: "カードの枚数", value: "cards" },
      { label: "レシートの量", value: "receipts" },
      { label: "特に気にしない", value: "none" },
    ],
  },
  {
    key: "wagara",
    title: "好きな和柄は？",
    options: [
      { label: "麻の葉", value: "asanoha" },
      { label: "市松模様", value: "ichimatsu" },
      { label: "七宝", value: "shippo" },
      { label: "青海波", value: "seigaiha" },
    ],
  },
  {
    key: "fruit",
    title: "直感で選ぶ果物は？",
    options: [
      { label: "りんご", value: "apple" },
      { label: "みかん", value: "orange" },
      { label: "ぶどう", value: "grape" },
      { label: "桃", value: "peach" },
    ],
  },
  {
    key: "rainMood",
    title: "天気雨に出会ったときの気分は？",
    options: [
      { label: "ラッキーと思う", value: "lucky" },
      { label: "不思議に思う", value: "curious" },
      { label: "特に気にしない", value: "none" },
      { label: "写真を撮りたくなる", value: "photo" },
    ],
  },
  {
    key: "recentColor",
    title: "最近よく目にする色は？",
    options: [
      { label: "赤系", value: "red" },
      { label: "青系", value: "blue" },
      { label: "緑系", value: "green" },
      { label: "黄色系", value: "yellow" },
    ],
  },
  {
    key: "mythicalCreature",
    title: "好きな伝説上の生き物は？",
    options: [
      { label: "龍", value: "dragon" },
      { label: "鳳凰", value: "phoenix" },
      { label: "麒麟", value: "kirin" },
      { label: "白虎", value: "byakko" },
    ],
  },
  {
    key: "indoorOutdoor",
    title: "インドア派？アウトドア派？",
    options: [
      { label: "インドア派", value: "indoor" },
      { label: "アウトドア派", value: "outdoor" },
    ],
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
    amadegi: "低投資で長く遊べる、初心者にもやさしいタイプ。大当たり確率が高く当たりやすい分、1回あたりの出玉は少なめなので、一撃より回転数と演出をじっくり楽しみたい日に向いている。",
    lightmiddle: "甘デジよりやや大当たり確率は低いが、それでも手を出しやすいバランス型。当たった後の継続率もそこそこあるので、平日の空き時間にも狙いやすい。",
    middle: "確率変動ありでムラはあるが、当たれば波に乗れるスペック。連チャンが続けば大きいが、ハマる時はとことんハマるので予算配分がカギになる。",
    highspec: "一撃の破壊力が魅力。当たれば大きいが、荒れる覚悟も必要な日に。継続率と突破率のバランス次第で明暗が分かれる、ギャンブル性の高いタイプじゃ。",
  },
  slot: {
    normal: "ボーナスのみのシンプル設計。設定狙い・じっくり派に向いているタイプ。差枚のブレが比較的少なく、長時間コツコツ打ちたい日に安心感がある。",
    at: "小役の引きと有利区間の管理がカギ。回転数を積み重ねたい日に。ATの継続率と上乗せ性能次第で、まとまった出玉にも期待できるタイプ。",
    art: "初当たりからの直撃や完走型など、当たれば伸びるタイプ。ワンチャンスをどれだけモノにできるかで収支が大きく変わる、勝負どころが分かりやすい台。",
    smart: "スマスロ機。従来にない有利区間・天井設計で、新しい遊技感覚を試したい日に。天井狙いと通常時の期待値、両方を意識した立ち回りが求められる。",
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
      "eフィーバー炎炎ノ消防隊2 99ver.",
      "PA大海物語Withアグネス・ラム Premium Edition",
      "eシン・ウルトラマン 79ver.",
      "P 春一番 2026",
      "Pぱちんこ押忍！番長 漢の頂 99ver.",
      "eぱちんこ押忍！番長 漢の頂 99ver.",
      "PシャカRUSH Z Jr.",
      "PAスーパー海物語IN沖縄6 Withえなこ",
      "PA花の慶次〜傾奇一転 87ver.",
      "P 魔法少女まどか☆マギカ3 キュゥべえver.",
      "PフィーバークィーンⅡ",
      {
        name: "e 化物語 鬼99ver.",
        desc: "「甘デジ」表記だが、口コミでは大当たりが単発になりやすく投資がかさみやすいとの声が多い台。マイルドさより一撃を狙いたい日向け。",
      },
      {
        name: "Pうしおととら〜神のせSPEC〜100ver.",
        desc: "口コミでは大当たりが単発になりやすく、体感の荒さを指摘する声が多い台。甘デジの中では波を覚悟したい日に。",
      },
      {
        name: "Pクイーンズブレイド奈落ナナエル79Ver.",
        desc: "「甘デジの皮を被った一撃狙いの台」と評されることが多く、想定より投資がかさみやすいとの口コミが目立つ。",
      },
      {
        name: "デカスタP戦国無双100ver.",
        desc: "継続率の高さが謳われる一方、口コミでは体感との乖離を指摘する声が目立つ台。",
      },
    ],
    lightmiddle: [
      "ソードアート・オンライン アリシゼーション 夜空（京楽）",
      "アサルトリリィ（ビスティ）",
      "甲鉄城のカバネリ2 輪廻の果報119ver.（サミー）",
      "ソードアート・オンライン 閃光の軌跡（京楽）",
      "Re:ゼロから始める異世界生活 season2 129ver.（大都技研）",
      "86-エイティシックス-（アムテックス）",
      "魔法少女まどか☆マギカ3（京楽）",
      "アクセル・ワールド（ニューギン）",
      "フィーバーブルーロック Light ver.（SANKYO）",
      "とある科学の超電磁砲 PHASE NEXT（オレンジ）",
      "フィーバーもののがたり（SANKYO）",
      "冥妃転生（メーシー）",
      "Re:ゼロから始める異世界生活 season2 249ver.（大都技研）",
      "ワールドダイスター（大都技研）",
      "ラグナドール 妖しき皇帝と終焉の夜叉姫（メーシー）",
      "新世紀エヴァンゲリオン〜未来への咆哮〜PREMIUM MODEL（ビスティ）",
      "フィーバー機動戦士ガンダムユニコーン再来 129ver.（SANKYO）",
      {
        name: "東京リベンジャーズ 聖夜決戦編（サミー）",
        desc: "口コミでは大きなハマりが報告されることが多く、ライトミドルの中でも体感は重めとの評判。",
      },
      {
        name: "ゾン100〜ゾンビになるまでにしたい100のこと〜（サンセイR&D）",
        desc: "新台好き・上級者向けと評されることが多く、難易度はライトミドルの中でも高めとの口コミが目立つ台。",
      },
      {
        name: "範馬刃牙 129ver.（アムテックス）",
        desc: "口コミでは想定よりギャンブル性が強いとの声があり、釘やデータをよく見た上で立ち回りに工夫が必要な台。",
      },
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
      "e甲鉄城のカバネリ2 咲かせや燦然（サミー）",
      "e東京リベンジャーズ（サミー）",
      "eミリオンゴッド-天空の雷撃-（メーシー）",
      "e真・一騎当千〜軍神覚醒〜319大入りver.（D-light）",
      "ぱちんこ シン・エヴァンゲリオン Type レイ（ビスティ）",
      "P北斗の拳 暴凶星（サミー）",
      {
        name: "eソードアート・オンライン オルタナティブ ガンゲイル・オンライン（大都技研）",
        desc: "口コミでは安定度の低さ（期待した演出が外れて当たる等、理不尽な当たり方）を指摘する声が目立つ台。",
      },
      {
        name: "e虚構推理（D-light）",
        desc: "口コミでは想定よりかなり渋いとの評判が多く、ミドルの中でも我慢が必要な台。",
      },
    ],
    highspec: [
      "Re:ゼロから始める異世界生活 season2（大都技研）",
      "魔法少女まどか☆マギカ3（京楽）",
      "北斗の拳 暴凶星（サミー）",
      "Re:ゼロから始める異世界生活 鬼がかりver.（大都技研）",
      "大海物語5 ブラック（三洋）",
      "とある魔術の禁書目録2（JFJ）",
      "とある科学の超電磁砲（藤商事）",
      "とある科学の超電磁砲2（JFJ）",
      "フィーバー機動戦士ガンダムユニコーン 再来（SANKYO）",
      "フィーバー 機動戦士ガンダムユニコーン（SANKYO）",
      "フィーバー炎炎ノ消防隊（SANKYO）",
      {
        name: "フィーバー炎炎ノ消防隊Light ver.（SANKYO）",
        desc: "口コミでは「甘デジ」に近いマイルドな挙動と評されることが多く、ハイスペックらしい荒さは控えめな台。",
      },
      {
        name: "スーパー海物語IN地中海2（三洋）",
        desc: "口コミでは「甘デジ」に近い、まったり系の海物語として評価されている台。一撃よりのんびり派向け。",
      },
      {
        name: "スーパー海物語 IN 沖縄5 夜桜超旋風 99ver.（三洋）",
        desc: "「甘海物語」系のマイルドな台と口コミで評されており、ハイスペックとしては控えめな荒さ。",
      },
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
      "パチスロ見える子ちゃん",
      "モグモグ風林火山 大海戦の巻",
      "スマスロ リコリス・リコイル",
      {
        name: "Lパチスロ 彼女、お借りします",
        desc: "口コミでは当落バランスに疑問の声が多く、評判が分かれている台。設定・据え置き情報を意識したい。",
      },
      {
        name: "L青春ブタ野郎はバニーガール先輩の夢を見ない",
        desc: "口コミでは当選率の渋さを指摘する声が多く、天井狙い以外での期待は禁物との評判。",
      },
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

/* ---------------- 診断結果の素材（占い師キャラ「ロトさん」の語り口で統一） ----------------
   ADVICEはパチンコ／スロットで用語が違う（保留・電サポ・釘 vs 設定・据え置き・天井など）ため
   カテゴリ別にプールを分けている。同じ一言が何度も出て寒くならないよう、それぞれ20種類用意。
   ------------------------------------------------------------ */
const ADVICE_POOL_PACHINKO = [
  "朝一の台選びは、データカウンターの「前日の履歴」を見てから座るんじゃぞ。",
  "今日は「ヘソの入り」を意識して台を選ぶと噛み合いそうだぞ。",
  "保留が3つ以上たまったら、少し様子を見るのも手じゃな。",
  "右打ちに切り替わったら、しばらくは玉の行方をよく見ておくといいぞ。",
  "遊タイムが近い台があれば、今日はそこを狙ってみるのも悪くないな。",
  "決めた予算まで使ったら、潔く切り上げるのが今日は吉だな。深追いは無しだぞ。",
  "台選びに迷ったら、角台・端台より島の中央寄りを狙ってみるといいぞ。",
  "長時間戦になりそうな日じゃな。1〜2時間おきに休憩を挟むとリズムが整うぞ。",
  "今日は「ヤメ時」を先に決めてから座ると、いい形で終われそうだな。",
  "友達と行くなら、同じ島で近くの台を選ぶと情報交換しやすいぞ。ワシもよくやったもんじゃ。",
  "気になる新台があるなら、今日は思い切って試してみるといいだろう。",
  "電サポが切れた後の初当たりを大事にするんじゃぞ。",
  "釘の状態は座る前にさりげなく見ておくといいぞ。ヘソの入りが全てじゃ。",
  "今日は「大当たり確率」より「継続率」で台を選んでみるといいだろう。",
  "ハマり台には理由がある。深追いせず、見切る勇気も大事じゃぞ。",
  "前日ずっと苦戦していた台より、平均的に回っていた台を今日は狙ってみるといいぞ。",
  "隣の台の当たり方をチラ見するのも、案外馬鹿にできんぞ。",
  "今日は「時短中の引き戻し」に期待できそうな日じゃな。",
  "初当たりが軽い日は、思い切って長丁場を覚悟するのもありじゃぞ。",
  "ボーダーラインを軽く超えている台があれば、今日はそこが狙い目じゃな。",
];

const ADVICE_POOL_SLOT = [
  "設定狙いなら、朝一の据え置き情報を必ずチェックするんじゃぞ。",
  "レア役の引きが良い日は、そのまま強気で回し続けるといいだろう。",
  "天井が近い台があれば、今日はそこを消化するのも悪くないぞ。",
  "有利区間の消化状況は、こまめに確認しておくといいじゃろう。",
  "決めた予算まで使ったら、潔く切り上げるのが今日は吉だな。深追いは無しだぞ。",
  "台選びに迷ったら、角台・端台より島の中央寄りを狙ってみるといいぞ。",
  "長時間戦になりそうな日じゃな。1〜2時間おきに休憩を挟むとリズムが整うぞ。",
  "今日は「ヤメ時」を先に決めてから座ると、いい形で終われそうだな。",
  "友達と行くなら、同じ島で近くの台を選ぶと情報交換しやすいぞ。ワシもよくやったもんじゃ。",
  "気になる新台があるなら、今日は思い切って試してみるといいだろう。",
  "設定狙いより「据え置きやすい台」を意識した方が、今日は噛み合いそうだぞ。",
  "ボーナスの引き戻しが良い日は、無理に追わず流れに乗るといいぞ。",
  "小役の抜けが悪い日は、無理せず見切るのも立派な立ち回りじゃぞ。",
  "上乗せのチャンスがある日は、焦らずじっくり抽選を待つのが吉じゃな。",
  "ゾーン狙いをするなら、周期のズレも計算に入れておくといいぞ。",
  "差枚がプラスに乗った時点で、一度冷静になるのも手じゃぞ。",
  "設定6の香りがする台に出会えたら、今日はそこに賭けてみるといいだろう。",
  "リールの飛び方をよく見ていれば、案外いいことがあるかもしれんぞ。",
  "朝一のボーナス落ちがあった台は、据え置きの可能性を疑ってみるといいぞ。",
  "今日はAT機よりART機の気分だ、と思ったら素直に従うのも占いのうちじゃぞ。",
];

const LUCKY_POOL = [
  "ラッキーカラー：赤",
  "ラッキーカラー：ゴールド",
  "ラッキーカラー：紫",
  "ラッキーカラー：白",
  "ラッキーナンバー：7",
  "ラッキーナンバー：3",
  "ラッキーナンバー：1",
  "ラッキーナンバー：8",
  "ラッキータイム：開店直後",
  "ラッキータイム：昼過ぎ",
  "ラッキータイム：夕方16時以降",
  "ラッキータイム：閉店1時間前",
  "ラッキーアクション：席に座る前に一呼吸おく",
  "ラッキーアクション：出目や演出をメモしながら打つ",
  "ラッキーアクション：座る前に台に軽く手を合わせる",
  "ラッキーアクション：財布の向きを揃えておく",
  "ラッキー方角：東側の島",
  "ラッキー方角：出入口に近い島",
  "ラッキーアイテム：普段より少し良い財布",
  "ラッキーアイテム：お気に入りのイヤホン",
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

/* ---------------- 出題ルートのランダム決定 ---------------- */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuizRoute() {
  const pickedPool = shuffleArray(QUESTION_POOL).slice(0, ROUTE_POOL_COUNT);
  return [FIXED_START_QUESTION, ...pickedPool, FIXED_END_QUESTION];
}

/* ---------------- 状態管理 ---------------- */
const state = {
  step: 0,
  answers: {},
  questions: [],
};

const screens = {
  intro: document.getElementById("screen-intro"),
  quiz: document.getElementById("screen-quiz"),
  loading: document.getElementById("screen-loading"),
  result: document.getElementById("screen-result"),
  amida: document.getElementById("screen-amida"),
  gamble: document.getElementById("screen-gamble"),
};

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
}

/* ---------------- 占い中の「溜め」演出 ---------------- */
const LOADING_MESSAGES = [
  "ロトさんが占っています…",
  "水晶玉を覗いています…",
  "カードをめくっています…",
  "今日の運勢を読み取っています…",
];

function startDiagnosis() {
  showScreen("loading");
  const loadingTextEl = document.getElementById("loading-text");
  let msgIndex = 0;
  loadingTextEl.textContent = LOADING_MESSAGES[0];
  const intervalId = setInterval(() => {
    msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
    loadingTextEl.textContent = LOADING_MESSAGES[msgIndex];
  }, 550);
  setTimeout(() => {
    clearInterval(intervalId);
    showResult();
  }, 2000);
}

/* ---------------- クイズ描画 ---------------- */
const quizStepsEl = document.getElementById("quiz-steps");
const progressBar = document.getElementById("progress-bar");

function renderQuiz() {
  quizStepsEl.innerHTML = "";
  state.questions.forEach((q, i) => {
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
        if (i < state.questions.length - 1) {
          state.step = i + 1;
          renderQuiz();
        } else {
          startDiagnosis();
        }
      });
      stepEl.appendChild(btn);
    });

    quizStepsEl.appendChild(stepEl);
  });

  progressBar.style.width = `${((state.step + 1) / state.questions.length) * 100}%`;
}

/* ---------------- 結果算出 ---------------- */
function pickFromPool(pool, seedStr) {
  const h = hashString(seedStr);
  return pool[h % pool.length];
}

// MACHINES の要素は基本は文字列（機種名）だが、口コミ上の実際の評判が
// そのスペック区分の一般的な説明文（SPEC_DESC）と大きく乖離する機種だけ
// { name, desc } の形にして、その台専用の説明文を持たせている。
function machineName(machine) {
  return typeof machine === "string" ? machine : machine.name;
}

function machineDesc(machine, category, specKey) {
  if (typeof machine === "object" && machine.desc) return machine.desc;
  return SPEC_DESC[category][specKey];
}

// 機種名から台情報サイトの検索結果に飛べるリンクHTMLを作る
function machineLinkHTML(machine, extraClass) {
  const name = machineName(machine);
  const query = encodeURIComponent(`${name} 機種情報`);
  const cls = extraClass ? ` class="${extraClass}"` : "";
  return `<a${cls} href="https://www.google.com/search?q=${query}" target="_blank" rel="noopener">${name}</a>`;
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

  const advicePool = isPachinko ? ADVICE_POOL_PACHINKO : ADVICE_POOL_SLOT;
  const advice = advicePool[hash % advicePool.length];
  const lucky = LUCKY_POOL[Math.floor(hash / 7) % LUCKY_POOL.length];

  document.getElementById("result-rank").textContent = rank;
  document.getElementById("result-type").textContent =
    `${isPachinko ? "パチンコ" : "スロット"} ／ ${SPEC_LABELS[category][mainSpec]}`;
  document.getElementById("result-genre").innerHTML = machineLinkHTML(mainMachine);
  document.getElementById("result-desc").textContent = machineDesc(mainMachine, category, mainSpec);
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
    li.innerHTML = `<span class="spec-name">${SPEC_LABELS[category][specKey]}</span><span class="spec-machine">${machineLinkHTML(machine, "spec-machine-link")}</span>`;
    specListEl.appendChild(li);
  });

  showScreen("result");

  // 結果カードの登場アニメーションを毎回リセットして再生する
  const resultCard = document.querySelector("#screen-result .result-card");
  resultCard.classList.remove("reveal-anim");
  void resultCard.offsetWidth;
  resultCard.classList.add("reveal-anim");
}

/* ---------------- あみだくじコーナー ----------------
   「納得いかない方はこちら」用の再診断。占いのスタンスは崩さず、
   パチンコ／スロットとスタート位置だけ選んでもらい、あとはロトさんが
   あみだくじで天に委ねる、という体で結果を出す。結果は真の乱数で決め、
   メインの日替わり診断とは別枠（何度引いても結果が変わってよい）。 */
const AMIDA_ROWS = 10;
const AMIDA_ROW_GAP = 34;
const AMIDA_TOP = 16;
const AMIDA_COL_X = [30, 100, 170, 240];
const AMIDA_SVG_WIDTH = 270;

const amidaState = { category: null, start: null };

function amidaCheckReady() {
  document.getElementById("btn-draw-amida").disabled = !(amidaState.category && amidaState.start !== null);
}

function amidaSetupOptions() {
  document.querySelectorAll("#amida-category-options .option").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#amida-category-options .option").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      amidaState.category = btn.dataset.value;
      amidaCheckReady();
    });
  });
  document.querySelectorAll("#amida-start-options .option").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#amida-start-options .option").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      amidaState.start = Number(btn.dataset.value);
      amidaCheckReady();
    });
  });
}

// 各行、隣り合う横棒（ヨコ線）は同時に立てない（例：0-1と1-2が同じ行で交差するのを防ぐ）
function generateAmidaRungs() {
  const rungs = [];
  for (let row = 0; row < AMIDA_ROWS; row++) {
    const active = [];
    let gap = 0;
    while (gap < AMIDA_COL_X.length - 1) {
      if (Math.random() < 0.5) {
        active.push(gap);
        gap += 2;
      } else {
        gap += 1;
      }
    }
    rungs.push(active);
  }
  return rungs;
}

function traceAmidakuji(rungs, start) {
  let col = start;
  const points = [{ x: AMIDA_COL_X[col], y: AMIDA_TOP }];
  rungs.forEach((active, row) => {
    const rungY = AMIDA_TOP + (row + 0.5) * AMIDA_ROW_GAP;
    const nextY = AMIDA_TOP + (row + 1) * AMIDA_ROW_GAP;
    let newCol = col;
    if (active.includes(col)) newCol = col + 1;
    else if (active.includes(col - 1)) newCol = col - 1;
    if (newCol !== col) {
      points.push({ x: AMIDA_COL_X[col], y: rungY });
      points.push({ x: AMIDA_COL_X[newCol], y: rungY });
      col = newCol;
    }
    points.push({ x: AMIDA_COL_X[col], y: nextY });
  });
  return { end: col, points };
}

function renderAmidakuji(rungs, tracePoints) {
  const bottom = AMIDA_TOP + AMIDA_ROWS * AMIDA_ROW_GAP;
  const height = bottom + 16;

  let svg = `<svg class="amida-svg" viewBox="0 0 ${AMIDA_SVG_WIDTH} ${height}" xmlns="http://www.w3.org/2000/svg">`;

  AMIDA_COL_X.forEach((x) => {
    svg += `<line x1="${x}" y1="${AMIDA_TOP}" x2="${x}" y2="${bottom}" stroke="#e0d4fa" stroke-width="3"/>`;
  });

  rungs.forEach((active, row) => {
    const y = AMIDA_TOP + (row + 0.5) * AMIDA_ROW_GAP;
    active.forEach((gap) => {
      svg += `<line x1="${AMIDA_COL_X[gap]}" y1="${y}" x2="${AMIDA_COL_X[gap + 1]}" y2="${y}" stroke="#e0d4fa" stroke-width="3"/>`;
    });
  });

  const d = tracePoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  svg += `<path id="amida-trace-path" d="${d}" fill="none" stroke="#ff2d78" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;

  AMIDA_COL_X.forEach((x) => {
    svg += `<circle cx="${x}" cy="${AMIDA_TOP}" r="5" fill="#7c3aed"/>`;
  });

  svg += `</svg>`;

  const area = document.getElementById("amida-draw-area");
  area.innerHTML = svg;

  const path = document.getElementById("amida-trace-path");
  const length = path.getTotalLength();
  const durationSec = Math.min(1.6, 0.15 * AMIDA_ROWS);
  path.style.strokeDasharray = String(length);
  path.style.strokeDashoffset = String(length);
  void path.getBoundingClientRect();
  path.style.transition = `stroke-dashoffset ${durationSec}s ease-in-out`;
  path.style.strokeDashoffset = "0";

  return { animMs: durationSec * 1000 };
}

document.getElementById("btn-draw-amida").addEventListener("click", () => {
  const btn = document.getElementById("btn-draw-amida");
  btn.disabled = true;
  document.getElementById("amida-result").innerHTML = "";

  const rungs = generateAmidaRungs();
  const { end, points } = traceAmidakuji(rungs, amidaState.start);
  const { animMs } = renderAmidakuji(rungs, points);

  const category = amidaState.category;
  const specKeys = Object.keys(MACHINES[category]);
  const specKey = specKeys[end];
  const pool = MACHINES[category][specKey];
  const machine = pool[Math.floor(Math.random() * pool.length)];

  setTimeout(() => {
    document.getElementById("amida-result").innerHTML = `
      <div class="result-block">
        <h3>あみだくじの結果</h3>
        <p><strong>${SPEC_LABELS[category][specKey]}</strong>／${machineLinkHTML(machine)}</p>
        <p>${machineDesc(machine, category, specKey)}</p>
      </div>
      <div class="character-intro character-intro-result">
        <div class="character-avatar"><img src="images/roto-san.webp" alt="占い師ロトさん"></div>
        <div class="character-bubble">
          <p class="character-name">占い師 ロトさん</p>
          <p class="character-line">くじが決めたことじゃ。これも天の采配、今日はこれで腹を括ってみるのも一興じゃぞ。</p>
        </div>
      </div>
    `;
    btn.disabled = false;
    btn.textContent = "もう一度引く";
  }, animMs + 150);
});

document.getElementById("amida-back").addEventListener("click", () => {
  showScreen("intro");
});

document.getElementById("btn-goto-amida").addEventListener("click", () => {
  amidaState.category = null;
  amidaState.start = null;
  document.querySelectorAll("#screen-amida .option").forEach((b) => b.classList.remove("selected"));
  document.getElementById("amida-draw-area").innerHTML = "";
  document.getElementById("amida-result").innerHTML = "";
  const btn = document.getElementById("btn-draw-amida");
  btn.disabled = true;
  btn.textContent = "あみだくじを引く！";
  showScreen("amida");
});

amidaSetupOptions();

/* ---------------- 今日が勝負の方はこちら（ギャンブル占い） ----------------
   日本に実在する公営競技・くじを中心に、低確率で違法・グレーな選択肢
  （賭け花札・賭けポーカー・オンラインカジノ・賭けバカラ・賭け麻雀）も
   ネタ枠として交ぜてある。出た場合は「（捕まるけどな）」と表示し、
   賭博罪など実際の法的リスクを明記する。誕生日・名前などから毎日決まる
   結果になるが、あくまで占い・エンタメであり特定の賭け事の推奨ではない。 */
const GAMBLE_LEGAL = [
  { name: "中央競馬（JRA）", desc: "パドックでの馬の気配、そして直感を信じるんじゃぞ。レース前の腹ごしらえも大事にな。" },
  { name: "地方競馬", desc: "ナイター開催の独特な空気がお前さんを呼んでおる。人気薄の一発に賭けてみたい日じゃな。" },
  { name: "競輪", desc: "選手の脚質とラインの動きをよく読むんじゃぞ。今日は先行選手に目をかけてみるといい。" },
  { name: "ボートレース（競艇）", desc: "スタートのタイミングと進入コースが全てじゃ。イン逃げの堅い舟に注目じゃな。" },
  { name: "オートレース", desc: "バンクの荒れ具合と実力者のスタートダッシュがカギじゃぞ。" },
  { name: "toto・BIG（サッカーくじ）", desc: "一攫千金を狙うなら今日じゃな。直感で選んだ組み合わせが案外強いぞ。" },
  { name: "宝くじ（ジャンボ宝くじ等）", desc: "売り場選びから運試しじゃ。今日はいつもと違う売り場で買ってみるといいだろう。" },
  { name: "ロト6・ロト7・ナンバーズ", desc: "数字選びに直感を信じるんじゃぞ。誕生日の数字を絡めてみるのも悪くない。" },
  { name: "パチンコ・スロット", desc: "結局ここに戻ってくるんじゃな。今日はホールでじっくり勝負してみるといいぞ。" },
];

const GAMBLE_JOKE = [
  { name: "賭け花札", desc: "懐かしの手役で盛り上がりそうな日じゃが……" },
  { name: "賭けポーカー", desc: "ブラフの読み合いで盛り上がりそうな日じゃが……" },
  { name: "オンラインカジノ", desc: "画面の向こうのディーラーに呼ばれておる気がするが……" },
  { name: "賭けバカラ", desc: "シンプルな駆け引きに吸い込まれそうな日じゃが……" },
  { name: "賭け麻雀（レート有り）", desc: "牌の音に誘われそうな日じゃが……" },
];

function buildGamblePool() {
  const pool = [];
  GAMBLE_LEGAL.forEach((item) => {
    for (let i = 0; i < 20; i++) pool.push(item);
  });
  GAMBLE_JOKE.forEach((item) => {
    for (let i = 0; i < 2; i++) pool.push({ ...item, joke: true });
  });
  return pool;
}
const GAMBLE_POOL = buildGamblePool();

document.getElementById("btn-goto-gamble").addEventListener("click", () => {
  showScreen("gamble");
});

document.getElementById("gamble-back").addEventListener("click", () => {
  showScreen("intro");
});

document.getElementById("gamble-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const birthdate = document.getElementById("gamble-birthdate").value;
  const name = document.getElementById("gamble-name").value.trim();
  const age = document.getElementById("gamble-age").value;
  const gender = document.getElementById("gamble-gender").value;

  const seedStr = `${todayKey()}-${birthdate}-${name}-${age}-${gender}`;
  const hash = hashString(seedStr);
  const pick = GAMBLE_POOL[hash % GAMBLE_POOL.length];

  let html = `
    <div class="character-intro character-intro-result">
      <div class="character-avatar"><img src="images/roto-san.webp" alt="占い師ロトさん"></div>
      <div class="character-bubble">
        <p class="character-name">占い師 ロトさん</p>
        <p class="character-line">${name}さんや、今日のお前さんに向いておるのは「${pick.name}」じゃ。${pick.desc}</p>
      </div>
    </div>
    <div class="result-block">
      <h3>🎲 今日の一手</h3>
      <p>${pick.name}</p>
    </div>
  `;

  if (pick.joke) {
    html += `
      <p class="joke-disclaimer">
        （捕まるけどな）<br>
        ${pick.name}を含む賭博は、賭博場を開いた側だけでなく参加者自身も刑法185〜187条の賭博罪の対象になり、単純賭博でも50万円以下の罰金、常習と判断されれば3年以下の懲役が科されうる。オンラインカジノは運営元が海外で合法な業者でも、日本国内からアクセスして遊べば違法という扱いは変わらず、近年は摘発件数も急増している（2025年の法改正では広告そのものも規制対象になった）。この結果はあくまで占いの余興であり、これらの行為を勧めるものでは一切ない。
      </p>
    `;
  }

  html += `<p class="note">※この診断は占い・エンタメ目的であり、特定の賭け事の実施や結果を推奨・保証するものではありません。公営競技・宝くじ等は20歳未満は購入できません。オンラインカジノ等の違法な賭博への参加は法律で禁止されています。</p>`;

  document.getElementById("gamble-result").innerHTML = html;
});

/* ---------------- イベント ---------------- */
document.getElementById("btn-start").addEventListener("click", () => {
  state.step = 0;
  state.questions = buildQuizRoute();
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
