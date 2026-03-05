/**
 * api_settings.js — Gemini APIキー等の設定管理
 * LocalStorageを使用してブラウザ内にセキュアに保存します。
 */

'use strict';

const API_KEY_STORAGE_KEY = 'kosodate_planner_gemini_api_key';

// ─── 設定管理用オブジェクト ──────────────────────────────────────────────────
const SettingsManager = {
    /** APIキーを取得する */
    getApiKey: () => {
        return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
    },

    /** APIキーを保存する */
    saveApiKey: (key) => {
        if (!key || key.trim() === '') {
            localStorage.removeItem(API_KEY_STORAGE_KEY);
        } else {
            localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
        }
    },

    /** APIキーが設定されているかチェックする */
    hasApiKey: () => {
        const key = SettingsManager.getApiKey();
        return key.length > 10;
    }
};

// ─── UIイベント定義 ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const apiKeyInput = document.getElementById('geminiApiKeyInput');

    // 設定ボタンクリックでモーダル表示
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            apiKeyInput.value = SettingsManager.getApiKey(); // 現在のキーをセット
            settingsModal.classList.add('show');
        });
    }

    // 閉じるボタンでモーダル非表示
    if (closeSettingsBtn && settingsModal) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.remove('show');
        });
    }

    // 保存ボタンクリック
    if (saveSettingsBtn && apiKeyInput && settingsModal) {
        saveSettingsBtn.addEventListener('click', () => {
            const newKey = apiKeyInput.value;
            SettingsManager.saveApiKey(newKey);

            // モーダルを閉じてトースト表示
            settingsModal.classList.remove('show');
            if (typeof showToast === 'function') {
                if (SettingsManager.hasApiKey()) {
                    showToast('✅ APIキーを保存しました（AI強化モード有効）');
                } else {
                    showToast('ℹ️ APIキーをクリアしました（ローカルモード保護）');
                }
            }
        });
    }

    // モーダル外枠クリックで閉じる
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('show');
            }
        });
    }
});
