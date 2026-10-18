// 「この台どうだった？」投票の保存先（Supabase）。url と key が両方入った時だけ投票欄が表示される。
// key は Supabase の「Publishable key」（ブラウザ公開前提のキー。secret / service_role は絶対に入れない）。
// セットアップ手順は knowledge/votes_setup_supabase.md を参照。
const VOTES_CONFIG = {
  url: "https://haxbkubbgdhezvhbsznq.supabase.co",
  key: "sb_publishable_4w9-WgXuq5XCxBjBQyYSyQ_gChe4fBC",
  // 開発用：localhost で ?votemock=1 を付けたときだけ、ブラウザ内の疑似DBで動作確認できる
  mock: location.hostname === "localhost" && new URLSearchParams(location.search).has("votemock"),
};
