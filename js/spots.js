/**
 * spots.js — 延岡発 旅行スポットデータベース
 * 幼児連れ家族向けの詳細情報を含むスポット一覧
 */

const SPOTS_DB = [
  // ─── 延岡市内・周辺（出発エリア） ───────────────────────────────────
  {
    id: "nobeoka_dept",
    name: "延岡市若葉町（出発地）",
    type: "departure",
    lat: 32.5827, lng: 131.6638,
    distanceFromNobeoka: 0, drivingMinutes: 0,
    tags: ["出発地"],
    hasRestroom: true, hasDiaperStation: false, hasKidsPlay: false,
    isIndoor: false, kidsFriendlyFood: false,
    estimatedStayMinutes: 0,
    openHours: "終日",
    area: "延岡",
    notes: "固定出発地点"
  },

  // ─── 休憩スポット（SA / PA / 道の駅） ───────────────────────────────
  {
    id: "roadside_hayuma",
    name: "道の駅 北川はゆま",
    type: "rest_stop",
    lat: 32.636, lng: 131.700,
    distanceFromNobeoka: 25, drivingMinutes: 30,
    tags: ["トイレ", "おむつ替え", "川遊び", "売店"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: true,
    isIndoor: false, kidsFriendlyFood: true,
    estimatedStayMinutes: 25,
    openHours: "09:00-18:00",
    area: "北川",
    notes: "川沿いの公園が子供に人気。お土産・軽食あり。"
  },
  {
    id: "roadside_takachiho",
    name: "道の駅 高千穂",
    type: "rest_stop",
    lat: 32.7064, lng: 131.3046,
    distanceFromNobeoka: 45, drivingMinutes: 60,
    tags: ["トイレ", "おむつ替え", "売店", "レストラン"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: false,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 30,
    openHours: "08:30-18:00",
    area: "高千穂",
    notes: "高千穂エリアの拠点。神話グッズのお土産充実。"
  },
  {
    id: "kijima_sa",
    name: "由布院SA（下り）",
    type: "rest_stop",
    lat: 33.2426, lng: 131.3568,
    distanceFromNobeoka: 115, drivingMinutes: 105,
    tags: ["トイレ", "おむつ替え", "レストラン", "売店", "授乳室"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: true,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 30,
    openHours: "06:00-22:00",
    area: "由布院",
    notes: "大型SA。授乳室完備。キッズコーナーあり。"
  },
  {
    id: "roadside_misato",
    name: "道の駅 美郷",
    type: "rest_stop",
    lat: 32.4811, lng: 131.4569,
    distanceFromNobeoka: 38, drivingMinutes: 45,
    tags: ["トイレ", "おむつ替え", "公園", "売店"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: true,
    isIndoor: false, kidsFriendlyFood: false,
    estimatedStayMinutes: 20,
    openHours: "09:00-18:00",
    area: "美郷",
    notes: "芝生広場で子供が走り回れる。"
  },
  {
    id: "roadside_tsunagi",
    name: "道の駅 つなぎ",
    type: "rest_stop",
    lat: 32.6389, lng: 130.7928,
    distanceFromNobeoka: 130, drivingMinutes: 125,
    tags: ["トイレ", "おむつ替え", "温泉", "売店"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: false,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 25,
    openHours: "09:00-21:00",
    area: "熊本",
    notes: "足湯あり。疲れた子供と親の休憩に最適。"
  },
  {
    id: "kochi_pa",
    name: "別府IC周辺休憩スポット",
    type: "rest_stop",
    lat: 33.2793, lng: 131.4917,
    distanceFromNobeoka: 125, drivingMinutes: 110,
    tags: ["トイレ", "おむつ替え", "コンビニ"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: false,
    isIndoor: false, kidsFriendlyFood: false,
    estimatedStayMinutes: 15,
    openHours: "24時間",
    area: "別府",
    notes: "別府エリア到着前の最終休憩ポイント。"
  },

  // ─── 観光スポット ──────────────────────────────────────────────────
  {
    id: "takachiho_gorge",
    name: "高千穂峡",
    type: "sightseeing",
    lat: 32.7028, lng: 131.3003,
    distanceFromNobeoka: 50, drivingMinutes: 65,
    tags: ["絶景", "ボート", "滝", "自然"],
    hasRestroom: true, hasDiaperStation: false, hasKidsPlay: false,
    isIndoor: false, kidsFriendlyFood: false,
    estimatedStayMinutes: 90,
    openHours: "終日（ボートは08:30-17:00）",
    area: "高千穂",
    notes: "ボートは4歳以下は料金不要。遊歩道は舗装済みでベビーカー可（一部段差あり）。"
  },
  {
    id: "beppu_uminotamago",
    name: "うみたまご（大分マリーンパレス水族館）",
    type: "theme_park",
    lat: 33.2837, lng: 131.5024,
    distanceFromNobeoka: 130, drivingMinutes: 115,
    tags: ["水族館", "イルカ", "子供", "屋内"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: true,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 120,
    openHours: "10:00-18:00",
    area: "別府",
    notes: "2歳以下無料。授乳室・おむつ替え完備。雨天OK。"
  },
  {
    id: "aso_farm_village",
    name: "阿蘇ファームランド",
    type: "theme_park",
    lat: 32.8947, lng: 131.1258,
    distanceFromNobeoka: 100, drivingMinutes: 100,
    tags: ["遊園地", "動物", "屋外", "宿泊"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: true,
    isIndoor: false, kidsFriendlyFood: true,
    estimatedStayMinutes: 180,
    openHours: "09:00-18:00",
    area: "阿蘇",
    notes: "幼児向けアトラクション多数。ドーム型ホテルで宿泊も可能。"
  },
  {
    id: "miyazaki_phoenix",
    name: "フェニックス・シーガイア・リゾート周辺（宮崎）",
    type: "sightseeing",
    lat: 31.9403, lng: 131.4276,
    distanceFromNobeoka: 70, drivingMinutes: 75,
    tags: ["海", "砂浜", "公園", "リゾート"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: true,
    isIndoor: false, kidsFriendlyFood: true,
    estimatedStayMinutes: 120,
    openHours: "終日",
    area: "宮崎市",
    notes: "広い砂浜で子供が安全に遊べる。近くにキッズエリアあり。"
  },
  {
    id: "yufuin_floral",
    name: "由布院フローラル・ビレッジ",
    type: "sightseeing",
    lat: 33.2637, lng: 131.3645,
    distanceFromNobeoka: 120, drivingMinutes: 110,
    tags: ["散策", "フォトスポット", "ショッピング", "可愛い"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: false,
    isIndoor: false, kidsFriendlyFood: true,
    estimatedStayMinutes: 60,
    openHours: "09:30-17:30",
    area: "由布院",
    notes: "ヨーロッパ風の可愛い街並み。子供が飽きないようソフトクリームやプリンが食べ歩きできる。"
  },
  {
    id: "yufuin_kinrinko",
    name: "金鱗湖（由布院）",
    type: "sightseeing",
    lat: 33.2549, lng: 131.3682,
    distanceFromNobeoka: 118, drivingMinutes: 108,
    tags: ["湖", "散策", "絶景", "朝霧", "自然"],
    hasRestroom: true, hasDiaperStation: false, hasKidsPlay: false,
    isIndoor: false, kidsFriendlyFood: false,
    estimatedStayMinutes: 45,
    openHours: "終日",
    area: "由布院",
    notes: "由布院のシンボル的な湖。朝霧が幻想的で早朝の散策がおすすめ。小さい子でも easy に周回できる。"
  },
  {
    id: "yufuin_yufudake_park",
    name: "由布岳登山口周辺公園",
    type: "sightseeing",
    lat: 33.2879, lng: 131.3910,
    distanceFromNobeoka: 122, drivingMinutes: 112,
    tags: ["自然", "草原", "絶景", "ピクニック"],
    hasRestroom: true, hasDiaperStation: false, hasKidsPlay: true,
    isIndoor: false, kidsFriendlyFood: false,
    estimatedStayMinutes: 50,
    openHours: "終日",
    area: "由布院",
    notes: "由布岳を背景に広大な草原が広がる。子供が自由に走り回れる開放的なスポット。"
  },
  {
    id: "kumamoto_castle",
    name: "熊本城周辺・城彩苑",
    type: "sightseeing",
    lat: 32.8032, lng: 130.7059,
    distanceFromNobeoka: 145, drivingMinutes: 130,
    tags: ["城", "歴史", "公園", "お土産"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: false,
    isIndoor: false, kidsFriendlyFood: true,
    estimatedStayMinutes: 90,
    openHours: "09:00-17:00",
    area: "熊本市",
    notes: "城彩苑に授乳コーナーあり。城址公園は芝生で子供が走り回れる。"
  },
  {
    id: "aso_kusasenri",
    name: "草千里ヶ浜（阿蘇）",
    type: "sightseeing",
    lat: 32.8821, lng: 131.0645,
    distanceFromNobeoka: 95, drivingMinutes: 95,
    tags: ["草原", "馬", "絶景", "自然"],
    hasRestroom: true, hasDiaperStation: false, hasKidsPlay: true,
    isIndoor: false, kidsFriendlyFood: false,
    estimatedStayMinutes: 60,
    openHours: "終日",
    area: "阿蘇",
    notes: "馬の乗馬体験あり（要身長確認）。広大な草原が子供の解放感を演出。"
  },
  {
    id: "beppu_hell_circuit",
    name: "別府地獄めぐり",
    type: "sightseeing",
    lat: 33.3063, lng: 131.4944,
    distanceFromNobeoka: 135, drivingMinutes: 115,
    tags: ["温泉", "観光", "地獄", "ユニーク"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: false,
    isIndoor: false, kidsFriendlyFood: false,
    estimatedStayMinutes: 90,
    openHours: "08:00-17:00",
    area: "別府",
    notes: "「海地獄」は色がきれいで子供も喜ぶ。回り方によって2〜3か所が現実的。"
  },

  // ─── 飲食店（キッズフレンドリー） ─────────────────────────────────────
  {
    id: "food_takachiho_soba",
    name: "高千穂夜神楽の里 そば処",
    type: "restaurant",
    lat: 32.7055, lng: 131.3011,
    distanceFromNobeoka: 50, drivingMinutes: 65,
    tags: ["そば", "定食", "子連れOK", "座敷"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: false,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 60,
    openHours: "11:00-15:00",
    area: "高千穂",
    notes: "座敷席あり。子供用食器・取り分けOK。"
  },
  {
    id: "food_beppu_kaiten",
    name: "回転寿司 豊丸水産 別府店",
    type: "restaurant",
    lat: 33.2832, lng: 131.4913,
    distanceFromNobeoka: 130, drivingMinutes: 115,
    tags: ["寿司", "回転寿司", "子連れOK", "キッズメニュー"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: false,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 60,
    openHours: "11:00-22:00",
    area: "別府",
    notes: "子供が喜ぶ回転寿司。ファミリー席あり。"
  },
  {
    id: "food_yufuin_lunch",
    name: "由布院 湯布院牛喰い絶叫大会（ゆふの家）",
    type: "restaurant",
    lat: 33.261, lng: 131.363,
    distanceFromNobeoka: 118, drivingMinutes: 108,
    tags: ["ランチ", "和食", "子連れOK", "座敷"],
    hasRestroom: true, hasDiaperStation: false, hasKidsPlay: false,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 60,
    openHours: "11:00-15:00",
    area: "由布院",
    notes: "子供用メニューあり。由布院中心部から徒歩圏内。"
  },
  {
    id: "food_aso_bbq",
    name: "阿蘇 バーベキューランド（阿蘇ファームランド内）",
    type: "restaurant",
    lat: 32.8947, lng: 131.1261,
    distanceFromNobeoka: 100, drivingMinutes: 100,
    tags: ["BBQ", "庭付き", "子連れOK", "外食"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: false,
    isIndoor: false, kidsFriendlyFood: true,
    estimatedStayMinutes: 75,
    openHours: "11:00-16:00",
    area: "阿蘇",
    notes: "ファームランド内。野外で子供のびのび食事できる。"
  },
  {
    id: "food_miyazaki_chicken",
    name: "炭火焼き処 鶏八 宮崎店",
    type: "restaurant",
    lat: 31.9085, lng: 131.4180,
    distanceFromNobeoka: 68, drivingMinutes: 72,
    tags: ["地鶏", "炭火焼き", "宮崎名物", "子連れOK"],
    hasRestroom: true, hasDiaperStation: false, hasKidsPlay: false,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 60,
    openHours: "11:30-14:30 / 17:00-22:00",
    area: "宮崎市",
    notes: "宮崎地鶏の名店。ランチセットあり。子供用椅子完備。"
  },
  {
    id: "food_kumamoto_ramen",
    name: "味千ラーメン 熊本総本店",
    type: "restaurant",
    lat: 32.7859, lng: 130.7414,
    distanceFromNobeoka: 143, drivingMinutes: 128,
    tags: ["ラーメン", "子連れOK", "熊本名物"],
    hasRestroom: true, hasDiaperStation: false, hasKidsPlay: false,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 45,
    openHours: "11:00-21:00",
    area: "熊本市",
    notes: "子供用ラーメンあり。熊本の定番。"
  },

  // ─── ホテル・宿泊施設 ─────────────────────────────────────────────
  {
    id: "hotel_beppu_kannawa",
    name: "別府 鉄輪温泉エリア 家族旅館",
    type: "hotel",
    lat: 33.3045, lng: 131.4945,
    distanceFromNobeoka: 134, drivingMinutes: 115,
    tags: ["温泉", "和室", "家族向け", "夕食付き"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: false,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 720,
    openHours: "チェックイン15:00 / チェックアウト11:00",
    area: "別府",
    notes: "和室で子供が動き回れる。温泉は子供OKの貸切あり。"
  },
  {
    id: "hotel_yufuin",
    name: "由布院温泉 家族湯付き旅館",
    type: "hotel",
    lat: 33.2613, lng: 131.3625,
    distanceFromNobeoka: 118, drivingMinutes: 108,
    tags: ["温泉", "家族湯", "和室", "夕食付き"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: false,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 720,
    openHours: "チェックイン15:00 / チェックアウト11:00",
    area: "由布院",
    notes: "家族湯があり幼児連れでも安心。由布岳を望む絶景露天。"
  },
  {
    id: "hotel_aso_farm",
    name: "阿蘇ファームランド ドームホテル",
    type: "hotel",
    lat: 32.8947, lng: 131.1258,
    distanceFromNobeoka: 100, drivingMinutes: 100,
    tags: ["ユニーク", "ドーム型", "子供喜ぶ", "温泉"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: true,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 720,
    openHours: "チェックイン15:00 / チェックアウト11:00",
    area: "阿蘇",
    notes: "ドーム型客室が個性的。子連れに大人気。翌朝もファームランドで遊べる。"
  },
  {
    id: "hotel_miyazaki_sheraton",
    name: "シェラトン・グランデ・オーシャンリゾート（宮崎）",
    type: "hotel",
    lat: 31.9403, lng: 131.4277,
    distanceFromNobeoka: 70, drivingMinutes: 75,
    tags: ["リゾート", "プール", "海", "高級"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: true,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 720,
    openHours: "チェックイン15:00 / チェックアウト11:00",
    area: "宮崎市",
    notes: "子供向けプールあり。ベビーベッド無料レンタル。"
  },

  // ─── 実在の有名旅館（指定宿泊先として使用可能） ───────────────────────
  {
    id: "hotel_yufuin_tachibanaya",
    name: "泰葉（由布院）",
    nameAlt: ["たちばなや", "タチバナヤ", "泰葉"],
    type: "hotel",
    lat: 33.2601, lng: 131.3619,
    distanceFromNobeoka: 118, drivingMinutes: 108,
    tags: ["温泉", "家族湯", "和室", "露天風呂", "由布院", "高級旅館"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: false,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 720,
    openHours: "チェックイン15:00 / チェックアウト11:00",
    area: "由布院",
    notes: "由布院を代表する高級旅館。由布岳を望む露天風呂、家族湯あり。お食事は地元食材を活かした会席料理。"
  },
  {
    id: "hotel_beppu_yamanoi",
    name: "杉乃井ホテル（別府）",
    nameAlt: ["杉乃井", "すぎのい", "スギノイ"],
    type: "hotel",
    lat: 33.3107, lng: 131.4984,
    distanceFromNobeoka: 134, drivingMinutes: 115,
    tags: ["温泉", "プール", "子供向け", "大型ホテル", "別府"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: true,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 720,
    openHours: "チェックイン15:00 / チェックアウト11:00",
    area: "別府",
    notes: "別府の大型リゾートホテル。屋内外温泉プール「スパビーチ」が子供に大人気。"
  },
  {
    id: "hotel_yufuin_sanso_murata",
    name: "山荘 無量塔（由布院）",
    nameAlt: ["無量塔", "むらた", "ムラタ", "sanso murata"],
    type: "hotel",
    lat: 33.2648, lng: 131.3672,
    distanceFromNobeoka: 118, drivingMinutes: 108,
    tags: ["温泉", "高級", "露天風呂", "由布院"],
    hasRestroom: true, hasDiaperStation: false, hasKidsPlay: false,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 720,
    openHours: "チェックイン15:00 / チェックアウト11:00",
    area: "由布院",
    notes: "全室離れの高級旅館。静かな環境で贅沢なひとときを。"
  },
  {
    id: "hotel_aso_itokazu",
    name: "阿蘇 白水温泉 瑠璃",
    nameAlt: ["白水温泉", "瑠璃", "るり"],
    type: "hotel",
    lat: 32.9147, lng: 131.0584,
    distanceFromNobeoka: 98, drivingMinutes: 98,
    tags: ["温泉", "家族向け", "和室", "阿蘇"],
    hasRestroom: true, hasDiaperStation: true, hasKidsPlay: false,
    isIndoor: true, kidsFriendlyFood: true,
    estimatedStayMinutes: 720,
    openHours: "チェックイン15:00 / チェックアウト11:00",
    area: "阿蘇",
    notes: "阿蘇の大自然に囲まれた温泉旅館。家族風呂完備。"
  }
];


/**
 * エリア別フィルタリング
 * @param {string} area - エリア名
 * @returns {Array} フィルタ済みスポット
 */
function getSpotsByArea(area) {
  return SPOTS_DB.filter(s => s.area === area);
}

/**
 * タイプ別フィルタリング
 * @param {string} type - スポットタイプ
 * @returns {Array} フィルタ済みスポット
 */
function getSpotsByType(type) {
  return SPOTS_DB.filter(s => s.type === type);
}

/**
 * 距離範囲でフィルタリング
 * @param {number} minKm - 最小距離
 * @param {number} maxKm - 最大距離
 * @returns {Array} フィルタ済みスポット
 */
function getSpotsByDistance(minKm, maxKm) {
  return SPOTS_DB.filter(s => s.distanceFromNobeoka >= minKm && s.distanceFromNobeoka <= maxKm);
}

/**
 * スポットスコアリング（幼児優先度）
 * @param {Object} spot - スポットオブジェクト
 * @param {Object} prefs - ユーザー設定
 * @returns {number} スコア
 */
function scoreSpot(spot, prefs = {}) {
  let score = 0;
  if (spot.hasKidsPlay) score += 30;
  if (spot.hasDiaperStation) score += 25;
  if (spot.hasRestroom) score += 20;
  if (spot.isIndoor) score += 10;
  if (spot.kidsFriendlyFood) score += 15;

  // ユーザー好み加点
  if (prefs.nature && spot.tags.some(t => ["自然", "草原", "川遊び", "絶景"].includes(t))) score += 20;
  if (prefs.gourmet && spot.kidsFriendlyFood) score += 15;
  if (prefs.themepark && spot.type === "theme_park") score += 25;
  if (prefs.onsen && spot.tags.some(t => ["温泉", "家族湯"].includes(t))) score += 20;

  return score;
}
