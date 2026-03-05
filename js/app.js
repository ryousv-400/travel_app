/**
 * app.js — UIコントローラー
 * 入力受取 → プラン生成 → タイムライン表示
 */

'use strict';

// ─── DOM参照 ─────────────────────────────────────────────────────────────
const formEl = document.getElementById('planForm');
const resultEl = document.getElementById('result');
const loadingEl = document.getElementById('loading');
const tabsEl = document.getElementById('dayTabs');
const timelineEl = document.getElementById('timeline');
const summaryEl = document.getElementById('summary');
const tipsEl = document.getElementById('tipsSection');
const printBtn = document.getElementById('printBtn');
const shareBtn = document.getElementById('shareBtn');
const mapEl = document.getElementById('map');
const childrenContainer = document.getElementById('childrenAges');

// ─── グローバル状態 ────────────────────────────────────────────────────────
let currentPlan = null;
let currentPlans = [];
let currentDay = 0;     // 0-indexed
let leafletMap = null;
let routeLayer = null;

// ─── 初期化 ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initChildrenInputs();
  setDefaultDate();
  formEl.addEventListener('submit', onFormSubmit);
  printBtn.addEventListener('click', () => window.print());
  shareBtn.addEventListener('click', onShare);

  // URLパラメータからプラン復元
  restorePlanFromUrl();
});

/** 子供の年齢入力を初期化（デフォルト: 4歳・2歳） */
function initChildrenInputs() {
  const initialAges = [4, 2];
  renderChildrenInputs(initialAges);

  document.getElementById('childCount').addEventListener('input', (e) => {
    const count = parseInt(e.target.value) || 2;
    const currentInputs = [...childrenContainer.querySelectorAll('input')].map(i => parseInt(i.value) || 3);
    const newAges = Array.from({ length: count }, (_, i) => currentInputs[i] ?? 3);
    renderChildrenInputs(newAges);
  });
}

function renderChildrenInputs(ages) {
  childrenContainer.innerHTML = ages.map((age, i) => `
    <div class="age-input-group">
      <label for="childAge${i}">子供 ${i + 1}</label>
      <input type="number" id="childAge${i}" name="childAge" min="0" max="12" value="${age}" required>
      <span class="age-unit">歳</span>
    </div>
  `).join('');
}

/** 出発日に今日の日付をデフォルト設定 */
function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('departureDate').value = today;
}

// ─── フォーム送信 ─────────────────────────────────────────────────────────
async function onFormSubmit(e) {
  e.preventDefault();

  // バリデーション: 目的地が選択されているか確認
  const destSelect = document.getElementById('destination');
  if (!destSelect.value) {
    destSelect.style.borderColor = '#ef4444';
    destSelect.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.3)';
    destSelect.focus();
    showToast('⚠️ 目的地を選択してください');
    setTimeout(() => {
      destSelect.style.borderColor = '';
      destSelect.style.boxShadow = '';
    }, 2000);
    return;
  }

  // ローディング表示
  resultEl.classList.add('hidden');
  loadingEl.classList.remove('hidden');

  try {
    // 少し遅延を入れてUIを滑らかに
    await new Promise(r => setTimeout(r, 800));

    const input = collectFormData();
    currentPlans = generateTravelPlans(input);

    renderPlanVariants(currentPlans);

  } catch (err) {
    console.error('[TravelPlanner] プラン生成中にエラーが発生しました:', err);
    showToast('⚠️ プランの生成に失敗しました。再度お試しください。');
  } finally {
    // エラーが起きても必ずローディングを解除する
    loadingEl.classList.add('hidden');
  }
}


/** フォームデータを収集してinputオブジェクトを返す */
function collectFormData() {
  const data = new FormData(formEl);
  const childAgeInputs = [...childrenContainer.querySelectorAll('input[name="childAge"]')];
  const childrenAges = childAgeInputs.map(i => parseInt(i.value) || 0);

  return {
    destination: data.get('destination'),
    nights: parseInt(data.get('nights')) || 1,
    departureDate: data.get('departureDate'),
    departureTime: data.get('departureTime') || '08:00',
    hotelName: (data.get('hotelName') || '').trim(),
    childrenAges,
    travelStyles: {
      nature: data.get('style_nature') === 'on',
      gourmet: data.get('style_gourmet') === 'on',
      themepark: data.get('style_themepark') === 'on',
      onsen: data.get('style_onsen') === 'on',
    },
    budgetLevel: data.get('budgetLevel') || 'standard',
    specialNotes: data.get('specialNotes') || '',
  };
}

// ─── パターン選択UI ──────────────────────────────────────────────────────
function renderPlanVariants(plans) {
  resultEl.classList.add('hidden');
  const container = document.getElementById('planVariants');
  container.classList.remove('hidden');

  container.innerHTML = `
      <h2 class="section-title">✨ プランを選んでください</h2>
      <div class="plan-variants-scroll">
        ${plans.map((p, idx) => `
          <div class="variant-card" onclick="selectPlanVariant(${idx})" style="--theme-color: ${p.variant.color}">
              <div class="variant-header">
                  <h3>${p.variant.title}</h3>
              </div>
              <div class="variant-body">
                  <p class="variant-desc">${p.variant.desc}</p>
                  <ul class="variant-highlights">
                      <li>🎯 スポット: ${p.summary.totalSpots}ヶ所</li>
                      <li>🍽️ お食事: ${p.summary.totalMeals}回</li>
                      <li>🚗 移動: 約${formatDuration(p.summary.estimatedTotalDrivingMin)}</li>
                  </ul>
                  <button class="variant-select-btn" onclick="event.stopPropagation(); selectPlanVariant(${idx})">
                      このプランを見る ⇒
                  </button>
              </div>
          </div>
        `).join('')}
      </div>
    `;

  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function selectPlanVariant(idx) {
  currentPlan = currentPlans[idx];

  const cards = document.querySelectorAll('.variant-card');
  cards.forEach((c, i) => {
    if (i === idx) c.classList.add('selected');
    else c.classList.remove('selected');
  });

  resultEl.classList.remove('hidden');
  renderPlan(currentPlan);

  setTimeout(() => {
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ─── プラン描画 ───────────────────────────────────────────────────────────
function renderPlan(plan) {
  currentDay = 0;
  renderDayTabs(plan);
  renderSummary(plan);
  renderTimeline(plan, 0);
  renderTips(plan);
  renderMap(plan);
}

/** デイタブを描画 */
function renderDayTabs(plan) {
  tabsEl.innerHTML = plan.dayPlans.map((_, i) => `
    <button
      class="day-tab ${i === 0 ? 'active' : ''}"
      data-day="${i}"
      onclick="switchDay(${i})"
      id="tab-day${i}"
    >
      ${i === 0 ? '🚗 1日目' : i === plan.dayPlans.length - 1 ? `🏠 ${i + 1}日目` : `⭐ ${i + 1}日目`}
    </button>
  `).join('');
}

/** デイを切替 */
function switchDay(dayIndex) {
  currentDay = dayIndex;
  document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-day${dayIndex}`).classList.add('active');
  renderTimeline(currentPlan, dayIndex);
}

/** タイムラインを描画 */
function renderTimeline(plan, dayIndex) {
  const items = plan.dayPlans[dayIndex] || [];
  timelineEl.innerHTML = '';

  items.forEach((item, idx) => {
    const card = createTimelineCard(item, idx);
    timelineEl.appendChild(card);
  });

  // カード出現アニメーション
  setTimeout(() => {
    timelineEl.querySelectorAll('.timeline-card').forEach((card, i) => {
      setTimeout(() => card.classList.add('visible'), i * 80);
    });
  }, 50);
}

/** タイムラインカードDOMを生成 */
function createTimelineCard(item, idx) {
  const card = document.createElement('div');
  card.className = `timeline-card type-${item.type}`;

  const spotInfo = item.spot ? `
    <div class="spot-detail">
      ${item.spot.hasRestroom ? '<span class="tag">🚻 トイレ</span>' : ''}
      ${item.spot.hasDiaperStation ? '<span class="tag tag-diaper">🍼 おむつ替え</span>' : ''}
      ${item.spot.hasKidsPlay ? '<span class="tag tag-play">🎠 遊び場</span>' : ''}
      ${item.spot.kidsFriendlyFood ? '<span class="tag tag-food">👶 キッズメニュー</span>' : ''}
      ${item.spot.isIndoor ? '<span class="tag tag-indoor">🏠 屋内</span>' : ''}
    </div>
  ` : '';

  const tipHtml = item.tip ? `<div class="item-tip">💡 ${item.tip}</div>` : '';

  card.innerHTML = `
    <div class="timeline-connector">
      <div class="timeline-dot" style="background: ${item.color}">
        <span class="dot-icon">${item.icon}</span>
      </div>
      ${idx < 100 ? '<div class="connector-line"></div>' : ''}
    </div>
    <div class="timeline-content" style="border-left: 3px solid ${item.color}">
      <div class="item-header">
        <div class="item-time">
          <span class="time-start">${item.time}</span>
          <span class="time-arrow">→</span>
          <span class="time-end">${item.endTime}</span>
        </div>
        <div class="item-duration">${formatDuration(item.duration)}</div>
      </div>
      <h3 class="item-label">${item.label}</h3>
      ${item.subLabel ? `<p class="item-sublabel">${item.subLabel}</p>` : ''}
      ${spotInfo}
      ${tipHtml}
    </div>
  `;

  return card;
}

/** サマリー描画 */
function renderSummary(plan) {
  const s = plan.summary;
  const destDate = plan.departureDate ? new Date(plan.departureDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' }) : '';
  summaryEl.innerHTML = `
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-icon">📍</div>
        <div class="summary-label">目的地</div>
        <div class="summary-value">${s.destination}</div>
      </div>
      <div class="summary-item">
        <div class="summary-icon">🗓️</div>
        <div class="summary-label">日程</div>
        <div class="summary-value">${destDate ? destDate + '〜' : ''} ${s.nights}泊${s.nights + 1}日</div>
      </div>
      <div class="summary-item">
        <div class="summary-icon">⭐</div>
        <div class="summary-label">観光スポット</div>
        <div class="summary-value">${s.totalSpots} か所</div>
      </div>
      <div class="summary-item">
        <div class="summary-icon">🅿️</div>
        <div class="summary-label">休憩スポット</div>
        <div class="summary-value">${s.totalRestStops} か所</div>
      </div>
      <div class="summary-item">
        <div class="summary-icon">🍽️</div>
        <div class="summary-label">お食事</div>
        <div class="summary-value">${s.totalMeals} 回</div>
      </div>
      <div class="summary-item">
        <div class="summary-icon">🚗</div>
        <div class="summary-label">総移動時間</div>
        <div class="summary-value">約 ${formatDuration(s.estimatedTotalDrivingMin)}</div>
      </div>
    </div>
  `;
}

/** Tips描画 */
function renderTips(plan) {
  tipsEl.innerHTML = `
    <h2 class="section-title">🌟 幼児連れ旅行のアドバイス</h2>
    <div class="tips-grid">
      ${plan.tips.map(tip => `<div class="tip-card">${tip}</div>`).join('')}
    </div>
  `;
}

// ─── マップ描画（Leaflet.js） ──────────────────────────────────────────────
function renderMap(plan) {
  if (!plan.destInfo) return;

  // 前の地図を破棄
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
  }

  mapEl.innerHTML = '';

  try {
    leafletMap = L.map('map').setView([32.582, 131.664], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);

    // ルートポイントを収集
    const routePoints = [[32.5827, 131.6638]]; // 延岡出発点
    const allItems = plan.dayPlans.flat();

    allItems.forEach(item => {
      if (item.spot && item.spot.lat && item.spot.lng) {
        routePoints.push([item.spot.lat, item.spot.lng]);
        // マーカー追加
        const iconHtml = `<div class="map-marker-icon" style="background:${item.color}">${item.icon}</div>`;
        const icon = L.divIcon({ html: iconHtml, className: 'map-marker', iconSize: [36, 36] });
        L.marker([item.spot.lat, item.spot.lng], { icon })
          .addTo(leafletMap)
          .bindPopup(`<b>${item.spot.name}</b><br>${item.spot.notes}`);
      }
    });

    // ルートを折れ線で描画
    if (routePoints.length > 1) {
      L.polyline(routePoints, { color: '#6366f1', weight: 3, opacity: 0.7, dashArray: '8, 4' })
        .addTo(leafletMap);
      leafletMap.fitBounds(routePoints);
    }

    // 出発点マーカー
    L.marker([32.5827, 131.6638])
      .addTo(leafletMap)
      .bindPopup('<b>🏠 出発地: 延岡市若葉町2丁目</b>')
      .openPopup();

  } catch (err) {
    mapEl.innerHTML = '<div class="map-error">地図の読み込みに失敗しました。インターネット接続を確認してください。</div>';
  }
}

// ─── シェア機能 ───────────────────────────────────────────────────────────
function onShare() {
  if (!currentPlan) return;
  const params = new URLSearchParams({
    dest: currentPlan.destination,
    nights: currentPlan.nights,
    date: currentPlan.departureDate,
    time: currentPlan.departureTime,
    ages: currentPlan.childrenAges.join(','),
    hotel: currentPlan.hotelName || '',
  });
  const url = `${location.origin}${location.pathname}?${params.toString()}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('URLをコピーしました！');
  }).catch(() => {
    prompt('このURLをコピーしてください:', url);
  });
}

function restorePlanFromUrl() {
  const params = new URLSearchParams(location.search);
  if (!params.get('dest')) return;
  document.getElementById('destination').value = params.get('dest') || '';
  document.getElementById('nights').value = params.get('nights') || '1';
  document.getElementById('departureDate').value = params.get('date') || '';
  document.getElementById('departureTime').value = params.get('time') || '08:00';
  document.getElementById('hotelName').value = params.get('hotel') || '';
  const ages = (params.get('ages') || '4,2').split(',').map(Number);
  document.getElementById('childCount').value = ages.length;
  renderChildrenInputs(ages);
}

// ─── トースト通知 ─────────────────────────────────────────────────────────
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
