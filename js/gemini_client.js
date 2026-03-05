/**
 * gemini_client.js — Gemini API通信モジュール
 * 入力条件からプロンプトを構築し、Gemini 1.5 Pro等に JSONスキーマでプラン生成を依頼します。
 */

'use strict';

const GeminiClient = {
    /**
     * Gemini APIを呼び出し、3パターンの旅行プランをJSONで取得する
     * @param {Object} input - ユーザー入力データ
     * @param {string} apiKey - Gemini API Key
     * @returns {Promise<Array>} 3パターンのプラン配列
     */
    generatePlansAsync: async (input, apiKey) => {
        if (!apiKey) throw new Error("API Key is missing");

        // 宛先モデル（ここでは高精度なGemini 1.5 Pro あるいは高速なFlashを使用）
        // ※JSON schemaに安定対応している1.5系を利用
        const MODEL_NAME = "gemini-1.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

        // 目的地や条件の文字列化
        const stylesStr = Object.entries(input.travelStyles)
            .filter(([_, val]) => val)
            .map(([key, _]) => {
                const map = { nature: '自然・絶景', gourmet: 'グルメ', themepark: 'テーマパーク', onsen: '温泉' };
                return map[key] || key;
            }).join('・');

        // システムプロンプト作成
        // ※出力形式を既存システム（planner.js）と完全に一致させるためのJSON Schema定義をシステムプロンプトに埋め込む
        const systemInstruction = `
あなたは「幼児連れ家族旅行のプロフェッショナルプランナー」です。
ユーザーから与えられた条件（出発地、目的地、泊数、子供の年齢、旅行の好み）をもとに、最高に楽しく、かつ幼児連れに無理のない現実的な旅行プランを、異なる3つのテーマで作成してください。
テーマの例：「のんびり自然・温泉満喫」「王道グルメ＋観光スポット」「子供大喜びアクティブ」など。

【絶対に守るべき幼児連れ旅行のルール（抜粋）】
1. ドライブは連続90分以内。必ず1時間に1回程度の休憩（道の駅やSA等）を挟むこと。
2. 2歳以下の子供がいる場合、昼（12〜14時など）の車移動でお昼寝できるように配慮すること。
3. 食事スポットや観光地は「実在する場所」を選び、子連れで行ける場所（座敷あり、キッズスペースあり等）にすること。架空の場所は絶対に出力しないこと。
4. 17時までに宿にチェックインし、18時から夕食を食べられるようなゆとりあるスケジュールにすること。

【出発地】
延岡市若葉町2丁目 固定です。

【出力フォーマット】
出力は必ず、以下の構造を持つ JSON 配列（3要素の配列）にしてください。Markdown記法（\`\`\`json など）は使わず、純粋なJSON文字列のみを返してください。必ず既存のUIシステムでバグなくパースできる厳格なJSONにしてください。

[
  {
    "destination": "目的地エリア名",
    "nights": 宿泊数,
    "days": 日数,
    "departureDate": "未定",
    "departureTime": "08:00",
    "childrenAges": [4, 2],
    "destInfo": { "area": "目的地エリア名", "km": 距離数値, "drivingMin": 予想運転時間分数 },
    "variant": {
      "id": "テーマのID(半角英字)",
      "title": "テーマのタイトル（例：🌿 のんびり自然満喫プラン）",
      "desc": "このプランの特徴を短い文章で",
      "color": "テーマカラーのHEXコード（例：#10b981）"
    },
    "dayPlans": [
      [ // 1日目のタイムライン（配列）
        {
          "time": "08:00", "endTime": "08:15",
          "type": "departure", "label": "🏠 出発！延岡市若葉町2丁目", "subLabel": "",
          "duration": 15, "icon": "🚗", "color": "#10b981", "tip": "出発準備のコツなど"
        },
        // ... (driving, rest_stop, restaurant, sightseeing, hotel などを時系列で)
      ],
      [ // 2日目のタイムライン（配列）
        // ...
      ]
    ],
    "summary": {
      "totalSpots": 観光箇所数, "totalRestStops": 休憩箇所数, "totalMeals": 食事回数,
      "destination": "目的地エリア名", "nights": 宿泊数, "estimatedTotalDrivingMin": 合計運転時間
    },
    "tips": [
      "旅行のアドバイス文字列1", "アドバイス文字列2"
    ]
  },
  // ...パターンの2つ目、3つ目
]

タイムラインのイベント種別(type)は、departure, arrival, driving, rest_stop, restaurant, sightseeing, theme_park, hotel, nap, breakfast, lunch, dinner, sleep のいずれかにしてください。
spot 情報は、もし実在の場所なら "spot": {"name": "スポット名", "lat": 緯度(数値), "lng": 経度(数値), "notes": "スポットの補足"} のように含めてもよいですが必須ではありません。必須プロパティは time, endTime, type, label, duration, icon, color, subLabel, tip(任意) です。
`.trim();

        const userPrompt = `
【旅行条件】
- 目的地: ${input.destination}
- 泊数: ${input.nights}泊
- 出発時刻: ${input.departureTime}
- 子供の年齢: ${input.childrenAges.join('歳, ')}歳
- 旅行スタイルの希望: ${stylesStr || '特になし'}
- 予算レベル: ${input.budgetLevel}
- 宿泊先（指定があれば）: ${input.hotelName || 'AIにおまかせ'}
- 特記事項: ${input.specialNotes || '特になし'}

この条件で、AIが厳選した実在のスポット・お店・ルートを用いた、3つの異なるパターンの旅行プラン（JSON配列）を生成してください。
`;

        const requestBody = {
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
            }
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errData = await response.text();
                throw new Error(`Gemini API Error: ${response.status} ${errData}`);
            }

            const data = await response.json();

            // 応答からJSONテキストを抽出
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                let jsonText = data.candidates[0].content.parts[0].text;
                // JSONパース（Markdownの残骸があれば除去）
                jsonText = jsonText.replace(/^\s*```json/i, '').replace(/```\s*$/i, '').trim();
                const plans = JSON.parse(jsonText);

                // バリデーション
                if (!Array.isArray(plans) || plans.length === 0) {
                    throw new Error("Invalid format: expected array of plans");
                }

                // 旧timeline互換処理を追加
                plans.forEach(p => { p.timeline = p.dayPlans; });
                return plans;
            } else {
                throw new Error("Unexpected API response structure");
            }
        } catch (err) {
            console.error("[Gemini API] Failed to generate plans:", err);
            throw err;
        }
    }
};
