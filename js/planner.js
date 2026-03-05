/**
 * planner.js — 幼児連れ家族旅行 タイムライン生成エンジン
 * コアアルゴリズム: 移動・休憩・観光・食事を幼児制約に基づき自動配置
 */

'use strict';

// ─── 幼児制約パラメータ ─────────────────────────────────────────────────
const TODDLER_CONSTRAINTS = {
    maxDrivingMinutes: 90,        // 1回の連続移動上限（分）
    breakIntervalMinutes: 60,     // この時間ドライブしたら必ず休憩挿入
    breakDurationMinutes: 20,     // 最小休憩時間（分）
    mealDurationMinutes: 60,      // 食事所要時間（余裕をもって設定）
    napWindowStart: 12,           // 昼寝タイム開始（時）
    napWindowEnd: 14,             // 昼寝タイム終了（時）
    napDurationMinutes: 60,       // 昼寝推奨時間（分）車中昼寝TIP発動
    spotDurationMin: 30,          // スポット最短滞在（分）
    spotDurationMax: 120,         // スポット最長滞在（分）
    requiresDiaperStation: true,  // おむつ替えスペース必須
    requiresKidsFriendly: true,   // キッズフレンドリー飲食店必須
    dayStartHour: 8,              // 初日出発時刻
    nextDayStartHour: 9,          // 2日目以降出発時刻（Hotel出発）
    dayEndHour: 17,               // この時刻以降は観光終了・夕食・宿泊へ
    hotelCheckIn: 15,             // ホテルチェックイン目標時刻
    lunchStartWindow: 11,         // ランチ開始ウィンドウ（時）
    lunchEndWindow: 13,           // ランチ終了ウィンドウ（時）
};

// ─── 目的地エリアマッピング ─────────────────────────────────────────────
const DESTINATION_AREAS = {
    "別府": { area: "別府", km: 130, drivingMin: 115, via: ["北川", "阿蘇"] },
    "由布院": { area: "由布院", km: 118, drivingMin: 108, via: ["高千穂", "日田"] },
    "阿蘇": { area: "阿蘇", km: 95, drivingMin: 95, via: ["高千穂"] },
    "熊本市": { area: "熊本市", km: 145, drivingMin: 130, via: ["北川", "阿蘇"] },
    "宮崎市": { area: "宮崎市", km: 70, drivingMin: 75, via: ["日向", "都農"] },
    "高千穂": { area: "高千穂", km: 50, drivingMin: 65, via: [] },
};

// ─── ユーティリティ ──────────────────────────────────────────────────────
/**
 * 時刻文字列 "HH:MM" → 分数値
 */
function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
}

/**
 * 分数値 → 時刻文字列 "HH:MM"
 */
function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * 分 → "X時間Y分" 形式
 */
function formatDuration(minutes) {
    if (minutes < 60) return `${minutes}分`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}時間${m}分` : `${h}時間`;
}

// ─── スポット選択ロジック ────────────────────────────────────────────────
/**
 * 候補スポットから最適なものを選択
 * @param {Array} candidates - 候補スポット一覧
 * @param {string} type - スポットタイプ
 * @param {Object} prefs - ユーザー好み
 * @param {Array} usedIds - 使用済みスポットID
 * @returns {Object|null} 選択されたスポット
 */
function pickBestSpot(candidates, type, prefs, usedIds) {
    const filtered = candidates
        .filter(s => s.type === type && !usedIds.includes(s.id))
        .map(s => ({ ...s, _score: scoreSpot(s, prefs) }))
        .sort((a, b) => b._score - a._score);
    return filtered.length > 0 ? filtered[0] : null;
}

/**
 * 休憩スポットを指定距離近辺から取得
 */
function findRestStopNear(distanceKm, usedIds) {
    const candidates = SPOTS_DB
        .filter(s => s.type === "rest_stop"
            && Math.abs(s.distanceFromNobeoka - distanceKm) < 30
            && !usedIds.includes(s.id))
        .sort((a, b) => Math.abs(a.distanceFromNobeoka - distanceKm) - Math.abs(b.distanceFromNobeoka - distanceKm));
    return candidates[0] || null;
}

// ─── 宿泊先解決関数 ──────────────────────────────────────────────────────
/**
 * 宿泊先名称からSPOTS_DBを検索（ファジーマッチ）し、
 * 見つからない場合は動的にオブジェクトを生成して返す
 * @param {string} name - ユーザー入力の宿泊先名
 * @param {Object} destInfo - 目的地情報
 * @returns {Object} ホテルスポットオブジェクト
 */
function resolveHotel(name, destInfo) {
    const lowerName = name.toLowerCase();

    // SPOTS_DBから名前マッチで検索
    const found = SPOTS_DB.find(s => {
        if (s.type !== "hotel") return false;
        // name本体のマッチ
        if (s.name.includes(name) || name.includes(s.name.replace(/（.*?）/g, "").trim())) return true;
        // nameAlt（別名配列）のマッチ
        if (Array.isArray(s.nameAlt)) {
            return s.nameAlt.some(alt => lowerName.includes(alt.toLowerCase()) || alt.toLowerCase().includes(lowerName));
        }
        return false;
    });

    if (found) return found;

    // 見つからない場合: 目的地エリアのデフォルト座標でカスタムオブジェクトを生成
    // 目的地エリアの既存ホテルから座標ヒント取得
    const areaHotel = SPOTS_DB.find(s => s.type === "hotel" && s.area === destInfo.area);
    return {
        id: `hotel_custom_${Date.now()}`,
        name: name,
        nameAlt: [],
        type: "hotel",
        lat: areaHotel ? areaHotel.lat : 33.2613,
        lng: areaHotel ? areaHotel.lng : 131.3625,
        distanceFromNobeoka: destInfo.km,
        drivingMinutes: destInfo.drivingMin,
        tags: ["温泉", "旅館"],
        hasRestroom: true, hasDiaperStation: true, hasKidsPlay: false,
        isIndoor: true, kidsFriendlyFood: true,
        estimatedStayMinutes: 720,
        openHours: "チェックイン15:00 / チェックアウト11:00",
        area: destInfo.area,
        notes: `${name} — ご指定の宿泊先です。`
    };
}

// ─── イベントアイテム生成 ────────────────────────────────────────────────
/**
 * タイムラインアイテムオブジェクトを生成
 */
function createTimelineItem({
    time, endTime, type, label, subLabel = "", duration, icon, spot = null, tip = "", color = "#6366f1"
}) {
    return { time, endTime, type, label, subLabel, duration, icon, spot, tip, color };
}

// ─── メインプランニング関数 ──────────────────────────────────────────────
/**
 * 旅行プランを自動生成する
 * @param {Object} input - ユーザー入力
 * @returns {Object} 生成されたプラン
 */
function generateTravelPlan(input) {
    const {
        destination,          // 目的地文字列
        nights = 1,           // 泊数
        departureDate,        // 出発日
        departureTime = "08:00",
        travelStyles = {},    // { nature, gourmet, themepark, onsen }
        budgetLevel = "standard",
        childrenAges = [4, 2],
        specialNotes = "",
        hotelName = ""        // 宿泊先（任意）
    } = input;

    const destInfo = DESTINATION_AREAS[destination] || {
        area: destination, km: 100, drivingMin: 100, via: []
    };

    const days = nights + 1;  // 宿泊日数 + 1 = 総日数
    const prefs = travelStyles;
    const usedIds = ["nobeoka_dept"];  // 使用済みスポット

    // 昼寝対象児がいるか（2歳以下）
    const hasNapper = childrenAges.some(age => age <= 2);
    // おむつ世代がいるか（3歳以下）
    const hasDiaper = childrenAges.some(age => age <= 3);

    const plan = {
        destination,
        nights,
        days,
        departureDate,
        departureTime,
        childrenAges,
        destInfo,
        timeline: [],       // 全日まとめた配列
        dayPlans: [],       // day別配列 [[], [], ...]
        summary: {},
        tips: [],
        generatedAt: new Date().toISOString()
    };

    // ── 初日タイムライン ──────────────────────────────────────────
    let currentMinutes = timeToMinutes(departureTime);
    let drivenMinutes = 0;    // 前回休憩からの走行時間
    let totalDrivenKm = 0;    // 累積走行距離
    const day1 = [];

    // 出発イベント
    day1.push(createTimelineItem({
        time: minutesToTime(currentMinutes),
        endTime: minutesToTime(currentMinutes + 10),
        type: "departure",
        label: "🏠 出発！延岡市若葉町2丁目",
        subLabel: "準備OK？飲み物・おむつ・おやつは忘れずに！",
        duration: 10, icon: "🚗", color: "#10b981",
        tip: "出発前チェック: チャイルドシート・おむつ袋・着替え・お気に入りのおもちゃ"
    }));
    currentMinutes += 10;

    // ── 目的地への道中（往路）──────────────────────────────────────
    const totalDriveMin = destInfo.drivingMin;
    const segmentTarget = Math.min(TODDLER_CONSTRAINTS.breakIntervalMinutes, totalDriveMin);

    // 第1走行セグメント
    const seg1Min = Math.min(segmentTarget, TODDLER_CONSTRAINTS.maxDrivingMinutes);
    day1.push(createTimelineItem({
        time: minutesToTime(currentMinutes),
        endTime: minutesToTime(currentMinutes + seg1Min),
        type: "driving",
        label: `🚗 ドライブ（${seg1Min}分）`,
        subLabel: seg1Min > 60
            ? `⚠️ 少し長め。童謡CDや絵本テープで飽き対策を！`
            : `子供向けの音楽や手遊びで楽しく！`,
        duration: seg1Min, icon: "🚗", color: "#6366f1",
        tip: hasNapper ? "2歳児が眠くなる時間帯なら、このドライブ中に昼寝させよう" : ""
    }));
    currentMinutes += seg1Min;
    drivenMinutes += seg1Min;
    totalDrivenKm = Math.round(destInfo.km * (seg1Min / totalDriveMin));

    // 休憩挿入（必要な場合）
    if (drivenMinutes >= TODDLER_CONSTRAINTS.breakIntervalMinutes || seg1Min >= 60) {
        const restStop = findRestStopNear(totalDrivenKm, usedIds);
        if (restStop) {
            usedIds.push(restStop.id);
            const restDur = Math.max(TODDLER_CONSTRAINTS.breakDurationMinutes, restStop.estimatedStayMinutes);
            day1.push(createTimelineItem({
                time: minutesToTime(currentMinutes),
                endTime: minutesToTime(currentMinutes + restDur),
                type: "rest_stop",
                label: `🅿️ 休憩: ${restStop.name}`,
                subLabel: restStop.notes,
                duration: restDur, icon: "🅿️", spot: restStop, color: "#f59e0b",
                tip: hasDiaper ? "おむつ替えタイム！" + (restStop.hasDiaperStation ? "✅ おむつ替えスペースあり" : "⚠️ 車内での対応を") : ""
            }));
            currentMinutes += restDur;
            drivenMinutes = 0;
        }
    }

    // ランチチェック
    const lunchHour = Math.floor(currentMinutes / 60);
    if (lunchHour >= TODDLER_CONSTRAINTS.lunchStartWindow && lunchHour <= TODDLER_CONSTRAINTS.lunchEndWindow) {
        const lunchSpot = pickBestSpot(SPOTS_DB, "restaurant", prefs, usedIds);
        if (lunchSpot) {
            usedIds.push(lunchSpot.id);
            const lunchDur = TODDLER_CONSTRAINTS.mealDurationMinutes;
            day1.push(createTimelineItem({
                time: minutesToTime(currentMinutes),
                endTime: minutesToTime(currentMinutes + lunchDur),
                type: "restaurant",
                label: `🍽️ ランチ: ${lunchSpot.name}`,
                subLabel: lunchSpot.notes,
                duration: lunchDur, icon: "🍽️", spot: lunchSpot, color: "#ef4444",
                tip: "子供が食べ慣れたものも持参すると安心。食後は少し休ませてから出発しよう。"
            }));
            currentMinutes += lunchDur;
        }
    }

    // 昼寝タイムウィンドウ
    const napHour = Math.floor(currentMinutes / 60);
    if (hasNapper && napHour >= TODDLER_CONSTRAINTS.napWindowStart
        && napHour <= TODDLER_CONSTRAINTS.napWindowEnd) {
        day1.push(createTimelineItem({
            time: minutesToTime(currentMinutes),
            endTime: minutesToTime(currentMinutes + TODDLER_CONSTRAINTS.napDurationMinutes),
            type: "nap",
            label: "💤 お昼寝タイム（ドライブ中）",
            subLabel: "このまま目的地方向へ。眠っている間に移動するのが理想！",
            duration: TODDLER_CONSTRAINTS.napDurationMinutes, icon: "💤", color: "#8b5cf6",
            tip: "2歳児は昼寝なしだと夕方にグズりやすい。12〜14時台の移動と合わせると◎"
        }));
        currentMinutes += TODDLER_CONSTRAINTS.napDurationMinutes;
        drivenMinutes += TODDLER_CONSTRAINTS.napDurationMinutes;
    }

    // 第2走行（目的地への残り）
    const remainingDriveMin = totalDriveMin - seg1Min;
    if (remainingDriveMin > 0) {
        const seg2Min = Math.min(remainingDriveMin, TODDLER_CONSTRAINTS.maxDrivingMinutes);
        day1.push(createTimelineItem({
            time: minutesToTime(currentMinutes),
            endTime: minutesToTime(currentMinutes + seg2Min),
            type: "driving",
            label: `🚗 ドライブ（${seg2Min}分）〜${destination || '目的地'}へ`,
            subLabel: "あと少し！目的地が近づいてきた！",
            duration: seg2Min, icon: "🚗", color: "#6366f1"
        }));
        currentMinutes += seg2Min;
    }

    // 午後の観光スポット
    const afternoonHour = Math.floor(currentMinutes / 60);
    if (afternoonHour < TODDLER_CONSTRAINTS.dayEndHour) {
        const sightseeingOptions = SPOTS_DB.filter(s =>
            (s.type === "sightseeing" || s.type === "theme_park")
            && s.area === destInfo.area
            && !usedIds.includes(s.id)
        ).sort((a, b) => scoreSpot(b, prefs) - scoreSpot(a, prefs));

        if (sightseeingOptions.length > 0) {
            const spot = sightseeingOptions[0];
            usedIds.push(spot.id);
            const stayDur = Math.min(spot.estimatedStayMinutes, TODDLER_CONSTRAINTS.spotDurationMax);
            day1.push(createTimelineItem({
                time: minutesToTime(currentMinutes),
                endTime: minutesToTime(currentMinutes + stayDur),
                type: spot.type,
                label: `⭐ ${spot.name}`,
                subLabel: spot.notes,
                duration: stayDur, icon: spot.type === "theme_park" ? "🎡" : "🗺️",
                spot, color: "#10b981",
                tip: `開場時間: ${spot.openHours}`
            }));
            currentMinutes += stayDur;
        }
    }

    // ホテルチェックイン（夕方）
    const checkInHour = Math.floor(currentMinutes / 60);
    if (checkInHour < 20) {
        const targetCheckIn = Math.max(currentMinutes, TODDLER_CONSTRAINTS.hotelCheckIn * 60);

        // 宿泊先を解決: 指定あり → 検索 or 動的生成、指定なし → 自動選択
        let hotelSpot = null;
        if (hotelName && hotelName.trim() !== "") {
            hotelSpot = resolveHotel(hotelName.trim(), destInfo);
        } else {
            hotelSpot = pickBestSpot(SPOTS_DB, "hotel", prefs, usedIds);
        }

        if (hotelSpot) {
            usedIds.push(hotelSpot.id);
            day1.push(createTimelineItem({
                time: minutesToTime(targetCheckIn),
                endTime: minutesToTime(targetCheckIn + 60),
                type: "hotel",
                label: `🏨 チェックイン: ${hotelSpot.name}`,
                subLabel: hotelSpot.notes,
                duration: 60, icon: "🏨", spot: hotelSpot, color: "#0ea5e9",
                tip: "チェックイン後は温泉でリフレッシュ！子供は入浴後に夕食が食べやすい。"
            }));
            currentMinutes = targetCheckIn + 60;
        }
    }

    // 夕食
    const dinnerHour = Math.floor(currentMinutes / 60);
    if (dinnerHour >= 17 && dinnerHour < 20) {
        day1.push(createTimelineItem({
            time: minutesToTime(currentMinutes),
            endTime: minutesToTime(currentMinutes + TODDLER_CONSTRAINTS.mealDurationMinutes),
            type: "dinner",
            label: `🌙 夕食`,
            subLabel: "ホテルの夕食 or 近くの飲食店で",
            duration: TODDLER_CONSTRAINTS.mealDurationMinutes, icon: "🌙", color: "#f59e0b",
            tip: "幼児は夕食を18:00〜19:00の間に済ませると就寝リズムが整う。"
        }));
        currentMinutes += TODDLER_CONSTRAINTS.mealDurationMinutes;
    }

    // 就寝
    day1.push(createTimelineItem({
        time: minutesToTime(Math.max(currentMinutes, 19 * 60)),
        endTime: minutesToTime(Math.max(currentMinutes, 19 * 60) + 60),
        type: "sleep",
        label: "🌛 就寝 & フリータイム",
        subLabel: "子供就寝後は大人の温泉タイム♨️",
        duration: 60, icon: "🌛", color: "#64748b",
        tip: "幼児は21時までには就寝させると翌日機嫌よく過ごせる！"
    }));

    plan.dayPlans.push(day1);

    // ── 2日目以降タイムライン ──────────────────────────────────────
    for (let day = 2; day <= days; day++) {
        const isLastDay = (day === days);
        const dayItems = [];
        let cMin = TODDLER_CONSTRAINTS.nextDayStartHour * 60;

        // 朝食
        dayItems.push(createTimelineItem({
            time: minutesToTime(cMin),
            endTime: minutesToTime(cMin + 45),
            type: "breakfast",
            label: "☀️ 朝食",
            subLabel: "ゆっくり準備。子供のペースに合わせて。",
            duration: 45, icon: "☀️", color: "#f59e0b",
            tip: "朝のチェックアウトは混雑前の早い時間が吉。貴重品を忘れずに！"
        }));
        cMin += 45;

        if (!isLastDay) {
            // 中間日: 観光メイン
            const daySights = SPOTS_DB.filter(s =>
                (s.type === "sightseeing" || s.type === "theme_park")
                && s.area === destInfo.area
                && !usedIds.includes(s.id)
            ).sort((a, b) => scoreSpot(b, prefs) - scoreSpot(a, prefs));

            for (const spot of daySights.slice(0, 2)) {
                usedIds.push(spot.id);
                const stayDur = Math.min(spot.estimatedStayMinutes, TODDLER_CONSTRAINTS.spotDurationMax);
                dayItems.push(createTimelineItem({
                    time: minutesToTime(cMin),
                    endTime: minutesToTime(cMin + stayDur),
                    type: spot.type,
                    label: `⭐ ${spot.name}`,
                    subLabel: spot.notes,
                    duration: stayDur, icon: "🗺️", spot, color: "#10b981"
                }));
                cMin += stayDur + 30; // 移動バッファ
            }
        } else {
            // 最終日: 軽い観光 + 帰路
            // エリア優先で絞り込み、なければ全エリアから選択
            const lastSightAreaFirst = SPOTS_DB.filter(s =>
                s.type === "sightseeing"
                && s.area === destInfo.area
                && !usedIds.includes(s.id)
            ).sort((a, b) => scoreSpot(b, prefs) - scoreSpot(a, prefs));

            const lastSightFallback = SPOTS_DB.filter(s =>
                s.type === "sightseeing"
                && !usedIds.includes(s.id)
            ).sort((a, b) => scoreSpot(b, prefs) - scoreSpot(a, prefs));

            const lastSight = lastSightAreaFirst[0] || lastSightFallback[0];

            if (lastSight) {
                usedIds.push(lastSight.id);
                const stayDur = Math.min(lastSight.estimatedStayMinutes, 60); // 最終日は短め
                dayItems.push(createTimelineItem({
                    time: minutesToTime(cMin),
                    endTime: minutesToTime(cMin + stayDur),
                    type: "sightseeing",
                    label: `⭐ ${lastSight.name}（最終日のお楽しみ）`,
                    subLabel: lastSight.notes,
                    duration: stayDur, icon: "🗺️", spot: lastSight, color: "#10b981"
                }));
                cMin += stayDur;
            }

            // ランチ（帰路）
            dayItems.push(createTimelineItem({
                time: minutesToTime(Math.max(cMin, 11 * 60 + 30)),
                endTime: minutesToTime(Math.max(cMin, 11 * 60 + 30) + TODDLER_CONSTRAINTS.mealDurationMinutes),
                type: "restaurant",
                label: `🍽️ 帰路ランチ`,
                subLabel: "お気に入りのお店でゆっくり食事してから出発！",
                duration: TODDLER_CONSTRAINTS.mealDurationMinutes, icon: "🍽️", color: "#ef4444"
            }));
            cMin = Math.max(cMin, 11 * 60 + 30) + TODDLER_CONSTRAINTS.mealDurationMinutes;

            // 帰路ドライブ
            const returnCheck = findRestStopNear(destInfo.km / 2, usedIds);
            dayItems.push(createTimelineItem({
                time: minutesToTime(cMin),
                endTime: minutesToTime(cMin + Math.min(totalDriveMin, TODDLER_CONSTRAINTS.maxDrivingMinutes)),
                type: "driving",
                label: `🚗 帰路ドライブ`,
                subLabel: `延岡市へ向けて出発！`,
                duration: Math.min(totalDriveMin, TODDLER_CONSTRAINTS.maxDrivingMinutes),
                icon: "🚗", color: "#6366f1"
            }));
            cMin += Math.min(totalDriveMin, TODDLER_CONSTRAINTS.maxDrivingMinutes);

            // 帰路休憩
            if (totalDriveMin > TODDLER_CONSTRAINTS.breakIntervalMinutes && returnCheck) {
                usedIds.push(returnCheck.id);
                dayItems.push(createTimelineItem({
                    time: minutesToTime(cMin),
                    endTime: minutesToTime(cMin + TODDLER_CONSTRAINTS.breakDurationMinutes),
                    type: "rest_stop",
                    label: `🅿️ 帰路休憩: ${returnCheck.name}`,
                    subLabel: returnCheck.notes,
                    duration: TODDLER_CONSTRAINTS.breakDurationMinutes, icon: "🅿️",
                    spot: returnCheck, color: "#f59e0b"
                }));
                cMin += TODDLER_CONSTRAINTS.breakDurationMinutes + (totalDriveMin - Math.min(totalDriveMin, TODDLER_CONSTRAINTS.maxDrivingMinutes));
            }

            // 帰着
            dayItems.push(createTimelineItem({
                time: minutesToTime(cMin),
                endTime: minutesToTime(cMin + 15),
                type: "arrival",
                label: "🏠 帰宅！お疲れさまでした✨",
                subLabel: "楽しい旅行でしたか？また来よう！",
                duration: 15, icon: "🏠", color: "#10b981",
                tip: "帰宅後は荷物を片付ける前に子供を先に休ませよう。洗濯は翌日でもOK！"
            }));
        }

        plan.dayPlans.push(dayItems);
    }

    // ── サマリー生成 ──────────────────────────────────────────────
    const allItems = plan.dayPlans.flat();
    plan.summary = {
        totalSpots: allItems.filter(i => i.type === "sightseeing" || i.type === "theme_park").length,
        totalRestStops: allItems.filter(i => i.type === "rest_stop").length,
        totalMeals: allItems.filter(i => ["restaurant", "dinner", "breakfast"].includes(i.type)).length,
        destination,
        nights,
        estimatedTotalDrivingMin: totalDriveMin * 2, // 往路+復路
    };

    // ── 旅行アドバイスTips ────────────────────────────────────────
    plan.tips = [
        hasDiaper ? "🍼 おむつは+5枚余分に持参。道の駅や大型SA・テーマパークにおむつ替えスペースあり。" : "",
        "🚽 子供に「トイレ大丈夫？」を定期的に確認。高速SA・道の駅の位置を事前チェック！",
        "🧃 飲み物は多めに準備。子供はちょうど良いタイミングで「のどかわいた」と言いがち。",
        "🎵 ドライブ中は子供が好きな音楽・オーディオブックで飽き対策を。",
        "🌧️ 雨天時は室内スポット優先に変更する柔軟さが大切。",
        "💊 子供の常用薬・熱冷ましは必携。旅先での急な発熱に備えて。",
        hasNapper ? "💤 2歳児の昼寝は移動中に。12〜14時台のドライブに合わせるのがベスト！" : "",
    ].filter(Boolean);

    // dayPlansをtimelineにも格納（互換性のため）
    plan.timeline = plan.dayPlans;

    return plan;
}
