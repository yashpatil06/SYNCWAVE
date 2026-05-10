import React, { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SERVER = process.env.REACT_APP_SERVER || 'http://localhost:3001'

/* ─── STYLES ─────────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --bg2: #111118;
    --bg3: #1a1a24;
    --bg4: #222230;
    --accent: #a78bfa;
    --accent2: #7c3aed;
    --accent3: #c4b5fd;
    --green: #34d399;
    --red: #f87171;
    --amber: #fbbf24;
    --text: #f0eeff;
    --text2: #a8a0c4;
    --text3: #6b6488;
    --border: rgba(167,139,250,0.12);
    --border2: rgba(167,139,250,0.25);
    --mono: 'Space Mono', monospace;
    --sans: 'DM Sans', sans-serif;
    --radius: 12px;
    --radius-sm: 6px;
  }

  html, body, #root { height: 100%; }
  body { background: var(--bg); color: var(--text); font-family: var(--sans); font-size: 14px; line-height: 1.5; overflow: hidden; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }

  /* ── LANDING ── */
  .landing {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    background: radial-gradient(circle at top, rgba(124,58,237,0.24), transparent 34%),
                linear-gradient(180deg, rgba(10,10,15,0.98), rgba(15,18,29,1));
    position: relative;
    overflow: hidden;
  }
  .landing::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle at 20% 10%, rgba(124,58,237,0.18) 0%, transparent 28%),
      radial-gradient(circle at 85% 15%, rgba(59,130,246,0.16) 0%, transparent 22%),
      linear-gradient(90deg, rgba(255,255,255,0.03), transparent);
    pointer-events: none;
  }
  .hero-grid {
    width: min(1120px, 100%);
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.9fr);
    gap: 36px;
    align-items: center;
    z-index: 1;
  }
  .hero-copy {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 640px;
  }
  .hero-eyebrow {
    font-family: var(--mono);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent3);
    font-size: 12px;
  }
  .hero-title {
    font-size: clamp(3rem, 5vw, 4.4rem);
    line-height: 0.95;
    letter-spacing: -0.05em;
    font-weight: 800;
    max-width: 12ch;
    color: white;
  }
  .hero-subtitle {
    color: var(--text2);
    font-size: 1.05rem;
    line-height: 1.75;
    max-width: 42rem;
  }
  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    align-items: center;
  }
  .hero-actions .btn {
    min-width: 180px;
  }
  .hero-panel {
    padding: 34px;
    border-radius: 32px;
    background: rgba(10,11,18,0.95);
    border: 1px solid rgba(167,139,250,0.18);
    box-shadow: 0 40px 120px rgba(0,0,0,0.24);
  }
  .hero-panel .card-title {
    margin-bottom: 24px;
  }
  .hero-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-top: 12px;
  }
  .hero-stat {
    padding: 16px 18px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .hero-stat strong {
    font-size: 1.05rem;
    color: white;
  }
  .hero-stat span {
    font-size: 12px;
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .feature-row {
    width: min(1120px, 100%);
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    margin-top: 38px;
    z-index: 1;
  }
  .feature-card {
    background: rgba(17,19,33,0.92);
    border: 1px solid rgba(167,139,250,0.1);
    border-radius: 24px;
    padding: 24px;
    box-shadow: 0 22px 50px rgba(0,0,0,0.18);
    transition: transform 0.24s ease, border-color 0.24s ease;
  }
  .feature-card:hover {
    transform: translateY(-3px);
    border-color: rgba(167,139,250,0.2);
  }
  .feature-card-title {
    font-family: var(--mono);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--accent);
    margin-bottom: 14px;
  }
  .feature-card-text {
    color: var(--text2);
    font-size: 13px;
    line-height: 1.8;
  }
  .feature-card-emoji {
    font-size: 28px;
    margin-bottom: 14px;
  }
  .hero-footnote {
    margin-top: 26px;
    color: var(--text3);
    font-size: 13px;
    text-align: center;
    max-width: 760px;
  }
  @media (max-width: 900px) {
    .hero-grid {
      grid-template-columns: 1fr;
    }
    .feature-row {
      grid-template-columns: 1fr;
    }
    .hero-stats {
      grid-template-columns: 1fr;
    }
    .landing {
      padding: 20px;
    }
  }
  .logo-icon {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, var(--accent2), var(--accent));
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
  }
  .logo-sub { font-family: var(--sans); font-size: 14px; color: var(--text2); font-weight: 300; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
  .card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 32px;
    width: 420px;
    max-width: 90vw;
  }
  .card-title { font-family: var(--mono); font-size: 13px; color: var(--accent); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; }
  .field { margin-bottom: 14px; }
  .field label { display: block; font-size: 12px; color: var(--text2); margin-bottom: 6px; letter-spacing: 0.5px; }
  .field input {
    width: 100%; background: var(--bg3); border: 1px solid var(--border);
    border-radius: var(--radius-sm); color: var(--text); font-family: var(--sans);
    font-size: 14px; padding: 10px 14px; outline: none; transition: border 0.2s;
  }
  .field input:focus { border-color: var(--accent2); }
  .field input::placeholder { color: var(--text3); }
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 11px 20px; border-radius: var(--radius-sm); font-family: var(--sans);
    font-size: 14px; font-weight: 500; cursor: pointer; border: none;
    transition: all 0.15s; white-space: nowrap;
  }
  .btn-primary { background: var(--accent2); color: white; width: 100%; }
  .btn-primary:hover { background: #6d28d9; }
  .btn-outline { background: transparent; color: var(--text2); border: 1px solid var(--border2); width: 100%; margin-top: 10px; }
  .btn-outline:hover { border-color: var(--accent); color: var(--accent3); background: rgba(167,139,250,0.06); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-icon { padding: 8px; background: transparent; color: var(--text2); border: 1px solid var(--border); border-radius: var(--radius-sm); }
  .btn-icon:hover { border-color: var(--border2); color: var(--text); background: var(--bg3); }
  .btn-icon.active { color: var(--accent); border-color: var(--accent2); background: rgba(124,58,237,0.15); }
  .btn-danger { background: rgba(248,113,113,0.12); color: var(--red); border: 1px solid rgba(248,113,113,0.25); }
  .btn-danger:hover { background: rgba(248,113,113,0.2); }
  .btn-green { background: rgba(52,211,153,0.12); color: var(--green); border: 1px solid rgba(52,211,153,0.25); }
  .btn-green:hover { background: rgba(52,211,153,0.2); }
  .divider { display: flex; align-items: center; gap: 12px; margin: 16px 0; color: var(--text3); font-size: 12px; }
  .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .error-msg { color: var(--red); font-size: 12px; margin-top: 6px; }

  /* ── MAIN APP ── */
  .app-shell {
    display: grid;
    grid-template-columns: 280px 1fr 260px;
    grid-template-rows: 56px 1fr 140px;
    height: 100vh;
    overflow: hidden;
  }
  .topbar {
    grid-column: 1 / -1;
    display: flex; align-items: center; gap: 12px;
    padding: 0 20px;
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
  }
  .topbar-logo { font-family: var(--mono); font-size: 15px; font-weight: 700; color: var(--accent); margin-right: 4px; }
  .room-code {
    font-family: var(--mono); font-size: 13px;
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 4px 10px;
    color: var(--accent3); letter-spacing: 2px;
    cursor: pointer; transition: border 0.15s;
  }
  .room-code:hover { border-color: var(--accent2); }
  .live-dot { width: 7px; height: 7px; background: var(--green); border-radius: 50%; box-shadow: 0 0 8px var(--green); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  .host-badge { font-size: 11px; background: rgba(167,139,250,0.15); color: var(--accent3); border: 1px solid rgba(167,139,250,0.25); border-radius: 20px; padding: 3px 10px; }
  .you-name { font-size: 13px; color: var(--text2); }

  /* Sidebar */
  .sidebar-left {
    background: var(--bg2);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .sidebar-section { padding: 16px; border-bottom: 1px solid var(--border); }
  .sidebar-label { font-size: 10px; color: var(--text3); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; font-family: var(--mono); }
  .member-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 0; border-bottom: 1px solid rgba(167,139,250,0.05);
  }
  .member-item:last-child { border-bottom: none; }
  .avatar {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; flex-shrink: 0;
    font-family: var(--mono);
  }
  .avatar-host { background: rgba(124,58,237,0.3); color: var(--accent3); border: 1px solid rgba(167,139,250,0.4); }
  .avatar-member { background: var(--bg4); color: var(--text2); border: 1px solid var(--border); }
  .member-info { flex: 1; min-width: 0; }
  .member-name { font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .member-role { font-size: 11px; color: var(--text3); }
  .perm-btn {
    width: 26px; height: 26px; border-radius: var(--radius-sm);
    border: 1px solid var(--border); background: transparent;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 14px; transition: all 0.15s; flex-shrink: 0;
  }
  .perm-btn.granted { background: rgba(52,211,153,0.12); border-color: rgba(52,211,153,0.4); }
  .perm-btn.denied { background: rgba(248,113,113,0.08); border-color: rgba(248,113,113,0.2); }
  .perm-btn:hover { transform: scale(1.1); }

  /* Chat */
  .chat-panel {
    background: var(--bg2);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .chat-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
  .chat-msg { max-width: 100%; }
  .chat-meta { font-size: 11px; color: var(--text3); margin-bottom: 2px; }
  .chat-meta span { color: var(--accent3); font-weight: 500; }
  .chat-bubble { background: var(--bg3); border-radius: 0 8px 8px 8px; padding: 8px 12px; font-size: 13px; color: var(--text2); border: 1px solid var(--border); word-break: break-word; }
  .chat-bubble.own { background: rgba(124,58,237,0.15); border-color: rgba(167,139,250,0.25); color: var(--text); }
  .chat-input-row { padding: 12px; border-top: 1px solid var(--border); display: flex; gap: 8px; }
  .chat-input {
    flex: 1; background: var(--bg3); border: 1px solid var(--border);
    border-radius: var(--radius-sm); color: var(--text); font-family: var(--sans);
    font-size: 13px; padding: 8px 12px; outline: none;
  }
  .chat-input:focus { border-color: var(--accent2); }

  /* Center: Player area */
  .center-area {
    display: flex; flex-direction: column;
    overflow: hidden;
    background: var(--bg);
  }
  .source-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); padding: 0 20px; }
  .source-tab {
    padding: 14px 18px; font-size: 13px; color: var(--text3);
    cursor: pointer; border-bottom: 2px solid transparent;
    transition: all 0.15s; font-family: var(--mono);
  }
  .source-tab:hover { color: var(--text2); }
  .source-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .source-content { flex: 1; overflow-y: auto; padding: 20px; }

  /* Upload zone */
  .upload-zone {
    border: 2px dashed var(--border2);
    border-radius: var(--radius);
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(167,139,250,0.03);
    margin-bottom: 16px;
  }
  .upload-zone:hover, .upload-zone.drag { border-color: var(--accent); background: rgba(124,58,237,0.08); }
  .upload-icon { font-size: 36px; margin-bottom: 12px; }
  .upload-title { font-size: 15px; font-weight: 500; color: var(--text); margin-bottom: 6px; }
  .upload-sub { font-size: 13px; color: var(--text3); }
  .upload-list { display: flex; flex-direction: column; gap: 8px; }
  .upload-item {
    display: flex; align-items: center; gap: 12px;
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 10px 14px;
  }
  .upload-item-icon { font-size: 18px; }
  .upload-item-info { flex: 1; min-width: 0; }
  .upload-item-name { font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .upload-item-size { font-size: 11px; color: var(--text3); }
  .uploading-bar { height: 3px; background: var(--border); border-radius: 2px; margin-top: 6px; overflow: hidden; }
  .uploading-fill { height: 100%; background: var(--accent); animation: uploading 1s infinite; }
  @keyframes uploading { 0% { width: 0%; } 100% { width: 100%; } }

  /* YouTube search */
  .yt-search-row { display: flex; gap: 8px; margin-bottom: 16px; }
  .yt-search-input {
    flex: 1; background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius-sm); color: var(--text); font-family: var(--sans);
    font-size: 14px; padding: 10px 14px; outline: none;
  }
  .yt-search-input:focus { border-color: var(--accent2); }
  .yt-results { display: flex; flex-direction: column; gap: 8px; }
  .yt-result {
    display: flex; gap: 12px; align-items: center;
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 10px;
    cursor: pointer; transition: all 0.15s;
  }
  .yt-result:hover { border-color: var(--border2); background: var(--bg3); }
  .yt-thumb { width: 80px; height: 45px; border-radius: 4px; object-fit: cover; flex-shrink: 0; background: var(--bg3); }
  .yt-info { flex: 1; min-width: 0; }
  .yt-title { font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .yt-channel { font-size: 11px; color: var(--text3); margin-top: 2px; }
  .yt-url-input { font-family: var(--mono); font-size: 13px; }
  .yt-url-hint { font-size: 12px; color: var(--text3); margin-top: 6px; }

  /* Queue panel */
  .queue-panel {
    background: var(--bg2);
    border-left: 1px solid var(--border);
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .queue-header { padding: 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .queue-list { flex: 1; overflow-y: auto; }
  .queue-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(167,139,250,0.05);
    transition: background 0.15s;
    cursor: default;
  }
  .queue-item:hover { background: var(--bg3); }
  .queue-item.current { background: rgba(124,58,237,0.1); border-left: 2px solid var(--accent); }
  .queue-item-num { font-size: 11px; color: var(--text3); font-family: var(--mono); width: 16px; text-align: center; flex-shrink: 0; }
  .queue-thumb { width: 36px; height: 36px; border-radius: 4px; object-fit: cover; background: var(--bg4); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; }
  .queue-item-info { flex: 1; min-width: 0; }
  .queue-item-name { font-size: 12px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .queue-item-by { font-size: 11px; color: var(--text3); }
  .queue-remove { opacity: 0; background: transparent; border: none; color: var(--text3); cursor: pointer; font-size: 16px; transition: opacity 0.15s; padding: 2px 4px; }
  .queue-item:hover .queue-remove { opacity: 1; }
  .queue-remove:hover { color: var(--red); }

  /* Bottom player bar */
  .player-bar {
    grid-column: 1 / -1;
    background: var(--bg2);
    border-top: 1px solid var(--border);
    display: flex; align-items: center; gap: 20px;
    padding: 0 24px;
  }
  .now-playing { display: flex; align-items: center; gap: 12px; width: 220px; flex-shrink: 0; }
  .np-thumb { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; background: var(--bg4); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 1px solid var(--border); }
  .np-info { min-width: 0; }
  .np-title { font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
  .np-sub { font-size: 11px; color: var(--text3); }
  .player-center { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .controls-row { display: flex; align-items: center; gap: 12px; }
  .ctrl { background: none; border: none; cursor: pointer; color: var(--text2); display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 6px; transition: all 0.15s; }
  .ctrl:hover:not(:disabled) { color: var(--text); background: var(--bg3); }
  .ctrl:disabled { opacity: 0.3; cursor: not-allowed; }
  .ctrl-play {
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--accent); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: white; transition: all 0.15s;
  }
  .ctrl-play:hover:not(:disabled) { background: var(--accent2); transform: scale(1.05); }
  .ctrl-play:disabled { opacity: 0.3; cursor: not-allowed; }
  .progress-row { display: flex; align-items: center; gap: 10px; width: 100%; max-width: 480px; }
  .time-label { font-size: 11px; color: var(--text3); font-family: var(--mono); width: 38px; }
  .time-label.right { text-align: right; }
  .progress-track {
    flex: 1; height: 4px; background: var(--bg4);
    border-radius: 2px; cursor: pointer; position: relative;
  }
  .progress-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.4s linear; }
  .progress-thumb {
    width: 12px; height: 12px; border-radius: 50%; background: white;
    position: absolute; top: -4px; transform: translateX(-50%);
    transition: left 0.4s linear; pointer-events: none;
    box-shadow: 0 0 0 2px var(--accent);
  }
  .player-right { width: 180px; flex-shrink: 0; display: flex; align-items: center; gap: 10px; justify-content: flex-end; }
  .vol-slider { width: 90px; accent-color: var(--accent); }
  .no-control-badge { font-size: 11px; color: var(--text3); font-family: var(--mono); background: var(--bg3); border: 1px solid var(--border); border-radius: 4px; padding: 3px 8px; }

  /* YT Player hidden */
  #yt-player-container { position: fixed; left: -9999px; top: -9999px; width: 1px; height: 1px; }

  /* Notification toast */
  .toast {
    position: fixed; bottom: 160px; right: 20px; z-index: 100;
    background: var(--bg3); border: 1px solid var(--border2);
    border-radius: var(--radius-sm); padding: 10px 16px;
    font-size: 13px; color: var(--text);
    animation: toastIn 0.2s ease;
    max-width: 280px;
  }
  @keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  /* Permission banner */
  .perm-banner {
    background: rgba(52,211,153,0.08);
    border: 1px solid rgba(52,211,153,0.2);
    border-radius: var(--radius-sm);
    padding: 8px 14px;
    font-size: 12px;
    color: var(--green);
    margin: 12px 16px 0;
    text-align: center;
    animation: toastIn 0.2s ease;
  }

  /* Responsive tweaks */
  @media (max-width: 900px) {
    .app-shell { grid-template-columns: 0 1fr 0; }
    .sidebar-left, .queue-panel { display: none; }
  }

  /* Animations */
  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`

/* ─── ICONS ─────────────────────────────────────────────────────────────── */
const Icon = ({ name, size = 20 }) => {
  const paths = {
    play: <polygon points="5,3 19,12 5,21" />,
    pause: (
      <>
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
      </>
    ),
    skip_next: (
      <>
        <polygon points="5,4 15,12 5,20" />
        <line x1="19" y1="4" x2="19" y2="20" />
      </>
    ),
    skip_prev: (
      <>
        <polygon points="19,4 9,12 19,20" />
        <line x1="5" y1="4" x2="5" y2="20" />
      </>
    ),
    upload: (
      <>
        <polyline points="16,16 12,12 8,16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </>
    ),
    youtube: (
      <>
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon
          points="9.75,15.02 15.5,12 9.75,8.98 9.75,15.02"
          fill="white"
        />
      </>
    ),
    volume: (
      <>
        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </>
    ),
    music: (
      <>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </>
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    chat: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </>
    ),
    check: <polyline points="20,6 9,17 4,12" />,
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
    send: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22,2 15,22 11,13 2,9" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </>
    ),
    trash: (
      <>
        <polyline points="3,6 5,6 21,6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    unlock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </>
    ),
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

/* ─── HELPERS ───────────────────────────────────────────────────────────── */
function fmt(secs) {
  if (!secs || isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function initials(name) {
  return (name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

/* ─── YOUTUBE SEARCH via oEmbed (no API key needed) ─────────────────────── */
async function fetchYTInfo(url) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    )
    if (!res.ok) return null
    const data = await res.json()
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return {
      title: data.title,
      youtubeId: match?.[1],
      thumbnail: data.thumbnail_url,
      channel: data.author_name,
    }
  } catch {
    return null
  }
}

/* ─── MAIN APP ──────────────────────────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState('landing') // landing | room
  const [myName, setMyName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [canControl, setCanControl] = useState(false)
  const [members, setMembers] = useState([])
  const [queue, setQueue] = useState([])
  const [currentTrack, setCurrentTrack] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [sourceTab, setSourceTab] = useState('upload')
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [toast, setToast] = useState(null)
  const [permBanner, setPermBanner] = useState(null)
  const [drag, setDrag] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [ytUrl, setYtUrl] = useState('')
  const [ytLoading, setYtLoading] = useState(false)

  const socketRef = useRef(null)
  const audioRef = useRef(null)
  const ytPlayerRef = useRef(null)
  const ytReadyRef = useRef(false)
  const positionRef = useRef(0)
  const playingRef = useRef(false)
  const intervalRef = useRef(null)
  const chatEndRef = useRef(null)

  // Sync refs
  useEffect(() => {
    positionRef.current = position
  }, [position])
  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const showToast = useCallback((msg, duration = 3000) => {
    setToast(msg)
    setTimeout(() => setToast(null), duration)
  }, [])

  /* ── Socket setup ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const socket = io(SERVER, { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('🔗 Socket connected:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
    })

    socket.on('room_created', ({ roomId, room }) => {
      console.log('✅ Room created:', roomId, 'isHost=true, canControl=true')
      setRoomId(roomId)
      setIsHost(true)
      setCanControl(true)
      setMembers(room.members)
      setScreen('room')
    })

    socket.on('room_joined', ({ roomId, room, isHost: h, currentState }) => {
      console.log(`✅ Joined room ${roomId}`, {
        members: room.members.length,
        queueSize: room.queue.length,
        currentTrack: room.state.currentTrack?.name,
        isHost: h,
      })

      setRoomId(roomId)
      setIsHost(h)
      setCanControl(h)
      setMembers(room.members)
      setQueue(room.queue)

      if (room.state.currentTrack) {
        setCurrentTrack(room.state.currentTrack)

        let syncPos = room.state.position
        let shouldPlay = room.state.playing

        if (currentState) {
          const elapsed = (Date.now() - currentState.serverTime) / 1000
          syncPos = currentState.position + (currentState.playing ? elapsed : 0)
          shouldPlay = currentState.playing
          console.log(`📍 Sync adjustment: +${elapsed.toFixed(2)}s latency`, {
            serverPos: currentState.position,
            calculatedPos: syncPos.toFixed(2),
          })
        }

        setPosition(syncPos)
        setPlaying(shouldPlay)

        // CRITICAL: Load the track so audio element has src
        loadTrack(room.state.currentTrack, syncPos, false)
      } else {
        setCurrentTrack(null)
        setPosition(0)
        setPlaying(false)
      }

      setScreen('room')
      showToast(`Connected to room ${roomId}`, 3000)
    })

    socket.on('error', ({ message }) => setError(message))

    socket.on('members_updated', ({ members }) => setMembers(members))

    socket.on('user_joined', ({ name }) => showToast(`${name} joined the room`))
    socket.on('user_left', ({ name }) => showToast(`${name} left`))

    socket.on(
      'sync_state',
      ({ playing: p, position: pos, currentTrack: ct, serverTime }) => {
        console.log('📡 Sync received:', {
          playing: p,
          position: pos.toFixed(2),
          track: ct?.name,
        })
        const elapsed = (Date.now() - serverTime) / 1000
        const syncPos = pos + (p ? elapsed : 0)
        setPlaying(p)
        setPosition(syncPos)
        if (ct) {
          setCurrentTrack(ct)
        } else {
          setCurrentTrack(null)
        }
        applySyncToMedia(p, syncPos, ct)
      },
    )

    socket.on('queue_updated', ({ queue: q, state }) => {
      console.log('📋 Queue updated:', {
        queueSize: q.length,
        currentTrack: state.currentTrack?.name,
      })
      setQueue(q)
      if (state.currentTrack) {
        setCurrentTrack(state.currentTrack)
        setPlaying(state.playing)
        setPosition(state.position)
        loadTrack(state.currentTrack, state.position, state.playing)
      } else {
        setCurrentTrack(null)
        setPlaying(false)
        setPosition(0)
      }
    })

    socket.on('permission_changed', ({ canControl: c }) => {
      console.log('👤 Permission changed:', { canControl: c })
      setCanControl(c)
      setPermBanner(
        c ? 'You now have playback control!' : 'Playback control removed',
      )
      setTimeout(() => setPermBanner(null), 4000)
    })

    socket.on('chat_message', (msg) => {
      setChatMessages((prev) => [...prev, { ...msg, own: msg.from === myName }])
    })

    socket.on('room_dissolved', ({ message }) => {
      showToast(message)
      setTimeout(() => {
        setScreen('landing')
        resetState()
      }, 2000)
    })

    return () => socket.disconnect()
  }, [])

  // Periodic sync every 10 seconds to prevent drift
  useEffect(() => {
    if (!roomId || !playing) return

    const syncTimer = setInterval(() => {
      console.log('📡 Sending periodic sync request (anti-drift)')
      socketRef.current?.emit('request_sync', { roomId })
    }, 10000)

    return () => clearInterval(syncTimer)
  }, [playing, roomId])

  // Position ticker
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (playing) {
      intervalRef.current = setInterval(() => {
        setPosition((p) => p + 0.5)
      }, 500)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing])

  function resetState() {
    setMembers([])
    setQueue([])
    setCurrentTrack(null)
    setPlaying(false)
    setPosition(0)
    setDuration(0)
    setChatMessages([])
    setRoomId('')
  }

  function clearMedia() {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.src = ''
      audio.load()
    }
    if (ytReadyRef.current) {
      try {
        ytPlayerRef.current?.stopVideo()
      } catch (err) {
        console.warn('Could not stop YouTube:', err)
      }
    }
  }

  /* ── Media control helpers ───────────────────────────────────────────── */
  function applySyncToMedia(p, pos, track) {
    if (!track) {
      clearMedia()
      return
    }

    const audio = audioRef.current
    if (audio && track?.type !== 'youtube') {
      const nextSrc = SERVER + track.url
      if (audio.src !== nextSrc) {
        audio.src = nextSrc
        audio.load()
      }
      const syncAudio = async () => {
        try {
          audio.currentTime = pos
          if (p) {
            const playPromise = audio.play()
            if (playPromise !== undefined) {
              await playPromise
              console.log('✅ Audio playing at position', pos.toFixed(2))
            }
          } else {
            audio.pause()
            console.log('✅ Audio paused')
          }
        } catch (err) {
          console.error('❌ Audio playback failed:', err.name, err.message, {
            readyState: audio.readyState,
            src: audio.src,
            paused: audio.paused,
            currentTime: audio.currentTime,
          })
          if (err.name === 'NotAllowedError') {
            showToast('🔊 Autoplay blocked. Click play to start.', 4000)
          } else if (err.name === 'NotSupportedError') {
            showToast('⚠️ Audio format not supported', 4000)
          }
        }
      }

      if (audio.readyState >= 2) {
        syncAudio()
      } else {
        const handler = () => {
          audio.removeEventListener('canplay', handler)
          syncAudio()
        }
        audio.addEventListener('canplay', handler, { once: true })
        const timeout = setTimeout(() => {
          audio.removeEventListener('canplay', handler)
          console.warn('⚠️ Audio load timeout')
        }, 5000)
      }
    }

    if (ytReadyRef.current && track?.type === 'youtube') {
      try {
        const player = ytPlayerRef.current
        if (!player) {
          console.error('❌ YouTube player not initialized')
          showToast('YouTube player not ready', 4000)
          return
        }
        player.seekTo(pos, true)
        if (p) {
          player.playVideo()
          console.log('✅ YouTube playing')
        } else {
          player.pauseVideo()
          console.log('✅ YouTube paused')
        }
      } catch (err) {
        console.error('❌ YouTube control failed:', err, {
          playerReady: ytReadyRef.current,
          playerExists: !!ytPlayerRef.current,
        })
      }
    }
  }

  function loadTrack(track, pos = 0, autoPlay = false) {
    if (!track) {
      console.warn('⚠️ loadTrack called with null track')
      return
    }

    console.log(`📍 Loading track: ${track.name} (type: ${track.type})`)

    if (track.type === 'youtube') {
      if (!ytReadyRef.current) {
        console.error('❌ YouTube player not ready yet')
        showToast('YouTube player initializing...', 3000)
        return
      }

      try {
        const player = ytPlayerRef.current
        if (!player) {
          console.error('❌ YouTube player ref is null')
          return
        }

        player.loadVideoById({
          videoId: track.youtubeId,
          startSeconds: Math.max(0, pos),
        })
        console.log(`✅ YouTube loaded: ${track.youtubeId}`)

        if (!autoPlay) {
          setTimeout(() => {
            try {
              player.pauseVideo()
            } catch (err) {
              console.warn('Could not pause YouTube:', err)
            }
          }, 300)
        }
      } catch (err) {
        console.error('❌ Failed to load YouTube video:', err, {
          youtubeId: track.youtubeId,
          playerReady: ytReadyRef.current,
        })
        showToast('Failed to load YouTube video', 4000)
      }

      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.src = ''
      }
    } else {
      const audio = audioRef.current
      if (!audio) {
        console.error('❌ Audio ref not available')
        return
      }

      const nextSrc = SERVER + track.url
      const sourceChanged = audio.src !== nextSrc

      if (sourceChanged) {
        console.log(`🔊 Setting audio source: ${nextSrc}`)
        audio.src = nextSrc
        audio.load()
      }

      const startPlayback = async () => {
        try {
          audio.currentTime = pos
          if (autoPlay) {
            console.log(`▶️ Starting autoplay at ${pos.toFixed(2)}s`)
            const playPromise = audio.play()
            if (playPromise !== undefined) {
              await playPromise
              console.log('✅ Audio auto-playing')
            }
          } else {
            console.log(`⏸️ Loaded, paused at ${pos.toFixed(2)}s`)
          }
        } catch (err) {
          console.error('❌ Playback error:', err.name, err.message)
          if (err.name === 'NotAllowedError') {
            showToast('🔊 Click play to start audio', 5000)
          }
        }
      }

      if (audio.readyState >= 2) {
        startPlayback()
      } else {
        console.log('⏳ Waiting for audio metadata...')
        const handler = () => {
          audio.removeEventListener('canplay', handler)
          startPlayback()
        }
        audio.addEventListener('canplay', handler, { once: true })
        const timeout = setTimeout(() => {
          audio.removeEventListener('canplay', handler)
          console.warn('⚠️ Audio load timeout')
        }, 8000)
      }

      if (ytReadyRef.current) {
        try {
          ytPlayerRef.current?.stopVideo()
        } catch (err) {
          console.warn('Could not stop YouTube:', err)
        }
      }
    }
  }

  /* ── YouTube IFrame API ─────────────────────────────────────────────── */
  useEffect(() => {
    const initYTPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        console.warn('⏳ Waiting for YouTube API...')
        setTimeout(initYTPlayer, 500)
        return
      }

      console.log('🎬 Initializing YouTube player')
      ytPlayerRef.current = new window.YT.Player('yt-player', {
        height: '1',
        width: '1',
        events: {
          onReady: () => {
            console.log('✅ YouTube player ready')
            ytReadyRef.current = true
            try {
              ytPlayerRef.current.setVolume(volume)
            } catch (err) {
              console.warn('Could not set YT volume:', err)
            }
          },
          onStateChange: (e) => {
            const stateNames = {
              '-1': 'UNSTARTED',
              0: 'ENDED',
              1: 'PLAYING',
              2: 'PAUSED',
              3: 'BUFFERING',
              5: 'CUED',
            }
            console.log(`📺 YouTube state: ${stateNames[e.data] || e.data}`)

            if (e.data === window.YT?.PlayerState?.ENDED) {
              if (isHost || canControl) {
                console.log('⏭️ Auto-skipping to next track')
                socketRef.current?.emit('next_track', { roomId })
              }
            }
          },
          onError: (e) => {
            const errorCodes = {
              2: 'Invalid parameter',
              5: 'HTML5 player error',
              100: 'Video not found',
              101: 'Video cannot be played',
              150: 'Same as 151',
              151: 'Video cannot be played',
            }
            console.error(
              '❌ YouTube player error:',
              e.data,
              errorCodes[e.data] || 'Unknown',
            )
            showToast('YouTube playback error. Try another video.', 5000)
          },
        },
      })
    }

    window.onYouTubeIframeAPIReady = initYTPlayer
    initYTPlayer()
  }, [isHost, canControl, roomId, volume])

  // Volume control
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100
    if (ytReadyRef.current) {
      try {
        ytPlayerRef.current?.setVolume(volume)
      } catch {}
    }
  }, [volume])

  /* ── Actions ─────────────────────────────────────────────────────────── */
  function createRoom() {
    if (!myName.trim()) {
      setError('Enter your name')
      return
    }
    socketRef.current?.emit('create_room', { name: myName.trim() })
  }

  function joinRoom() {
    if (!myName.trim()) {
      setError('Enter your name')
      return
    }
    if (!joinCode.trim()) {
      setError('Enter room code')
      return
    }
    socketRef.current?.emit('join_room', {
      roomId: joinCode.trim().toUpperCase(),
      name: myName.trim(),
    })
  }

  async function togglePlayPause() {
    console.log('🎵 PLAY/PAUSE clicked', {
      isHost,
      canControl,
      currentTrack: currentTrack?.name,
    })
    if (!canControl && !isHost) {
      showToast('Only host can control playback', 2000)
      console.warn('❌ Permission denied - not host and no control')
      return
    }
    if (!currentTrack) {
      showToast('No track loaded', 2000)
      console.warn('❌ No current track')
      return
    }

    const requestedPlaying = !playing
    console.log(
      `${requestedPlaying ? '▶️ PLAY' : '⏸️ PAUSE'} at ${positionRef.current.toFixed(2)}s`,
    )

    const emitPlayState = (playState) => {
      setPlaying(playState)
      socketRef.current?.emit('play_pause', {
        roomId,
        playing: playState,
        position: positionRef.current,
      })
    }

    if (currentTrack.type !== 'youtube') {
      const audio = audioRef.current
      if (!audio) {
        console.error('❌ Audio element not available')
        return
      }

      if (requestedPlaying) {
        try {
          const playPromise = audio.play()
          if (playPromise !== undefined) {
            await playPromise
          }
          console.log('✅ HTML5 audio playing')
          emitPlayState(true)
        } catch (err) {
          console.error('❌ HTML5 play failed:', err.name, err.message)
          if (err.name === 'NotAllowedError') {
            showToast('🔊 Autoplay blocked. Click play button.', 4000)
          } else {
            showToast('Failed to play audio', 4000)
          }
        }
      } else {
        audio.pause()
        console.log('✅ HTML5 audio paused')
        emitPlayState(false)
      }
      return
    }

    if (!ytReadyRef.current) {
      console.error('❌ YouTube player not ready')
      showToast('YouTube player not ready', 3000)
      return
    }

    try {
      const player = ytPlayerRef.current
      if (!player) {
        throw new Error('YouTube player ref is null')
      }

      if (requestedPlaying) {
        player.playVideo()
      } else {
        player.pauseVideo()
      }

      console.log(`✅ YouTube ${requestedPlaying ? 'playing' : 'paused'}`)
      emitPlayState(requestedPlaying)
    } catch (err) {
      console.error('❌ YouTube control failed:', err)
      showToast('Failed to control YouTube playback', 3000)
    }
  }

  function seek(e) {
    if (!canControl && !isHost) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const newPos = pct * duration
    setPosition(newPos)
    socketRef.current?.emit('seek', { roomId, position: newPos })
    if (audioRef.current && currentTrack?.type !== 'youtube')
      audioRef.current.currentTime = newPos
    if (currentTrack?.type === 'youtube' && ytReadyRef.current) {
      try {
        ytPlayerRef.current?.seekTo(newPos, true)
      } catch {}
    }
  }

  function skipNext() {
    console.log('⏭️ NEXT clicked', {
      isHost,
      canControl,
      roomId,
      queueSize: queue.length,
    })
    if (!canControl && !isHost) {
      console.warn('❌ Permission denied for next_track')
      return
    }
    socketRef.current?.emit('next_track', { roomId })
  }

  function skipPrev() {
    console.log('⏮️ PREV clicked', {
      isHost,
      canControl,
      roomId,
      queueSize: queue.length,
    })
    if (!canControl && !isHost) {
      console.warn('❌ Permission denied for prev_track')
      return
    }
    socketRef.current?.emit('prev_track', { roomId })
  }

  function togglePermission(memberId) {
    if (!isHost) return
    socketRef.current?.emit('toggle_permission', { roomId, memberId })
  }

  function sendChat() {
    if (!chatInput.trim()) return
    socketRef.current?.emit('chat_message', { roomId, text: chatInput.trim() })
    setChatInput('')
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(roomId)
    showToast('Room code copied!')
  }

  function removeFromQueue(trackId) {
    socketRef.current?.emit('remove_from_queue', { roomId, trackId })
  }

  /* ── Upload handler ─────────────────────────────────────────────────── */
  async function handleFiles(files) {
    console.log('📤 Files selected for upload:', {
      count: files.length,
      files: files.map((f) => f.name),
    })
    if (!canControl && !isHost) {
      showToast('You do not have control permissions')
      console.warn('❌ Upload denied - not host and no control')
      return
    }
    for (const file of files) {
      if (!file.type.startsWith('audio/')) {
        showToast('Only audio files supported')
        console.warn('⚠️ Skipping non-audio file:', file.name, file.type)
        continue
      }
      console.log(`📤 Uploading: ${file.name}`)
      setUploading(true)
      const fd = new FormData()
      fd.append('audio', file)
      fd.append('name', file.name)
      try {
        const res = await fetch(`${SERVER}/upload`, {
          method: 'POST',
          body: fd,
        })
        const data = await res.json()
        console.log(`✅ Upload response for ${file.name}:`, data)
        if (data.url) {
          console.log(`📡 Emitting add_to_queue for ${file.name}`)
          socketRef.current?.emit('add_to_queue', {
            roomId,
            track: {
              name: file.name.replace(/\.[^.]+$/, ''),
              url: data.url,
              type: 'upload',
              thumbnail: null,
            },
          })
          showToast(`Added: ${file.name}`)
        } else {
          console.error('❌ No URL in upload response:', data)
          showToast('Upload failed: no URL returned')
        }
      } catch (e) {
        console.error('❌ Upload error:', e)
        showToast('Upload failed')
      } finally {
        setUploading(false)
      }
    }
  }

  /* ── YouTube URL handler ────────────────────────────────────────────── */
  async function handleYtUrl() {
    if (!ytUrl.trim()) return
    if (!canControl && !isHost) {
      showToast('No control permissions')
      return
    }
    setYtLoading(true)
    const info = await fetchYTInfo(ytUrl.trim())
    setYtLoading(false)
    if (!info || !info.youtubeId) {
      showToast('Could not load video info. Check the URL.')
      return
    }
    socketRef.current?.emit('stream_track', {
      roomId,
      youtubeId: info.youtubeId,
      title: info.title,
      thumbnail: info.thumbnail,
    })
    setYtUrl('')
    showToast(`Added: ${info.title}`)
  }

  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0

  /* ── Audio element event listeners ─────────────────────────────────── */
  function onAudioLoaded(e) {
    setDuration(e.target.duration)
  }
  function onAudioEnded() {
    if (isHost || canControl) socketRef.current?.emit('next_track', { roomId })
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /* LANDING SCREEN */
  /* ─────────────────────────────────────────────────────────────────── */
  if (screen === 'landing')
    return (
      <>
        <style>{css}</style>
        <div className="landing">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="hero-eyebrow">Shared listening rooms</div>
              <h1 className="hero-title">
                Bring everyone together with synchronized audio sessions.
              </h1>
              <p className="hero-subtitle">
                SyncWave makes it effortless to host private music rooms with
                real-time playback, upload your own tracks or stream from
                YouTube, and keep listeners connected through chat and control
                permissions.
              </p>
              <div className="hero-actions">
                <button className="btn btn-primary" onClick={createRoom}>
                  <Icon name="music" size={16} /> Create room
                </button>
                <button
                  className="btn btn-outline"
                  style={{ width: 'auto', padding: '10px 20px' }}
                  onClick={joinRoom}
                >
                  Join with code
                </button>
              </div>
              <div className="hero-stats">
                <div className="hero-stat">
                  <strong>Instant sync</strong>
                  <span>All listeners play together</span>
                </div>
                <div className="hero-stat">
                  <strong>Secure rooms</strong>
                  <span>Private codes for every session</span>
                </div>
                <div className="hero-stat">
                  <strong>Live chat</strong>
                  <span>Discuss tracks without leaving the room</span>
                </div>
              </div>
            </div>

            <div className="hero-panel card fade-in">
              <div className="card-title">Launch your next session</div>
              <div className="field">
                <label>Your name</label>
                <input
                  placeholder="How should we call you?"
                  value={myName}
                  onChange={(e) => {
                    setMyName(e.target.value)
                    setError('')
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && createRoom()}
                />
              </div>
              {error && <div className="error-msg">{error}</div>}
              <button className="btn btn-primary" onClick={createRoom}>
                <Icon name="music" size={16} /> Create a Room
              </button>
              <div className="divider">or join an existing room</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <input
                    className="field"
                    style={{
                      width: '100%',
                      background: 'var(--bg3)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)',
                      fontFamily: 'var(--mono)',
                      fontSize: 16,
                      padding: '10px 14px',
                      letterSpacing: 4,
                      outline: 'none',
                      textTransform: 'uppercase',
                    }}
                    placeholder="ROOM CODE"
                    value={joinCode}
                    maxLength={6}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase())
                      setError('')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                  />
                </div>
                <button
                  className="btn btn-outline"
                  style={{ width: 'auto', margin: 0, padding: '10px 20px' }}
                  onClick={joinRoom}
                >
                  Join
                </button>
              </div>
            </div>
          </div>

          <div className="feature-row">
            <div className="feature-card">
              <div className="feature-card-emoji">🎧</div>
              <div className="feature-card-title">Synchronized playback</div>
              <div className="feature-card-text">
                Keep everyone on the same beat with shared play, pause, seek,
                and track transitions.
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-card-emoji">📁</div>
              <div className="feature-card-title">Upload your library</div>
              <div className="feature-card-text">
                Drag and drop audio files into the queue, or stream any
                supported YouTube link instantly.
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-card-emoji">💬</div>
              <div className="feature-card-title">Live room chat</div>
              <div className="feature-card-text">
                Share thoughts, coordinate song choices, and keep room members
                engaged while listening.
              </div>
            </div>
          </div>
        </div>
      </>
    )

  /* ─────────────────────────────────────────────────────────────────── */
  /* ROOM SCREEN */
  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{css}</style>

      {/* Hidden audio + YouTube container */}
      <audio
        ref={audioRef}
        preload="metadata"
        muted={false}
        onLoadedMetadata={onAudioLoaded}
        onEnded={onAudioEnded}
        onError={(e) => {
          const errorMsg = e.target.error?.message || 'Unknown error'
          console.error('🔊 Audio error:', e.target.error?.code, errorMsg)
        }}
        style={{ display: 'none' }}
      />
      <div id="yt-player-container">
        <div id="yt-player" />
      </div>

      {toast && <div className="toast">{toast}</div>}

      <div className="app-shell">
        {/* ── Topbar ── */}
        <div className="topbar">
          <div className="topbar-logo">〜 SyncWave</div>
          <div className="live-dot" />
          <div
            className="room-code"
            onClick={copyRoomCode}
            title="Click to copy"
          >
            <Icon name="copy" size={12} style={{ marginRight: 4 }} />
            {roomId}
          </div>
          <div className="topbar-right">
            <span className="you-name">{myName}</span>
            {isHost && <span className="host-badge">HOST</span>}
          </div>
        </div>

        {/* ── Left sidebar: Members ── */}
        <div className="sidebar-left">
          <div className="sidebar-section">
            <div className="sidebar-label">
              <Icon name="users" size={12} /> Listeners ({members.length})
            </div>
            {members.map((m) => (
              <div className="member-item" key={m.id}>
                <div
                  className={`avatar ${m.isHost ? 'avatar-host' : 'avatar-member'}`}
                >
                  {initials(m.name)}
                </div>
                <div className="member-info">
                  <div className="member-name">{m.name}</div>
                  <div className="member-role">
                    {m.isHost
                      ? 'Host'
                      : m.canControl
                        ? 'Can control'
                        : 'Listener'}
                  </div>
                </div>
                {isHost && !m.isHost && (
                  <button
                    className={`perm-btn ${m.canControl ? 'granted' : 'denied'}`}
                    onClick={() => togglePermission(m.id)}
                    title={m.canControl ? 'Revoke control' : 'Grant control'}
                  >
                    {m.canControl ? '🔓' : '🔒'}
                  </button>
                )}
              </div>
            ))}
          </div>
          {permBanner && <div className="perm-banner">{permBanner}</div>}
          {isHost && (
            <div style={{ padding: '12px 16px' }}>
              <div
                style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}
              >
                🔓 Grant playback control to any listener by clicking their lock
                icon.
              </div>
            </div>
          )}
        </div>

        {/* ── Center: Source & Add tracks ── */}
        <div className="center-area">
          {canControl || isHost ? (
            <>
              <div className="source-tabs">
                <div
                  className={`source-tab ${sourceTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setSourceTab('upload')}
                >
                  <Icon name="upload" size={14} /> Upload File
                </div>
                <div
                  className={`source-tab ${sourceTab === 'youtube' ? 'active' : ''}`}
                  onClick={() => setSourceTab('youtube')}
                >
                  <Icon name="youtube" size={14} /> YouTube Stream
                </div>
              </div>
              <div className="source-content">
                {sourceTab === 'upload' && (
                  <div className="fade-in">
                    <div
                      className={`upload-zone ${drag ? 'drag' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDrag(true)
                      }}
                      onDragLeave={() => setDrag(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDrag(false)
                        handleFiles(Array.from(e.dataTransfer.files))
                      }}
                      onClick={() =>
                        document.getElementById('file-input').click()
                      }
                    >
                      <div className="upload-icon">🎧</div>
                      <div className="upload-title">Drop audio files here</div>
                      <div className="upload-sub">
                        MP3, WAV, FLAC, OGG, M4A · up to 50MB each
                      </div>
                      <input
                        id="file-input"
                        type="file"
                        accept="audio/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          handleFiles(Array.from(e.target.files))
                        }
                      />
                    </div>
                    {uploading && (
                      <div className="upload-item">
                        <div className="upload-item-icon">⏳</div>
                        <div className="upload-item-info">
                          <div className="upload-item-name">Uploading...</div>
                          <div className="uploading-bar">
                            <div className="uploading-fill" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {sourceTab === 'youtube' && (
                  <div className="fade-in">
                    <div
                      style={{
                        marginBottom: 16,
                        fontSize: 13,
                        color: 'var(--text2)',
                      }}
                    >
                      Paste a YouTube URL to add it to the queue. All listeners
                      will hear it via YouTube's embedded player.
                    </div>
                    <div className="yt-search-row">
                      <input
                        className="yt-search-input yt-url-input"
                        placeholder="https://youtube.com/watch?v=..."
                        value={ytUrl}
                        onChange={(e) => setYtUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleYtUrl()}
                      />
                      <button
                        className="btn btn-primary"
                        style={{ width: 'auto', padding: '10px 18px' }}
                        onClick={handleYtUrl}
                        disabled={ytLoading}
                      >
                        {ytLoading ? (
                          <span
                            className="spin"
                            style={{ display: 'inline-block' }}
                          >
                            ⟳
                          </span>
                        ) : (
                          <Icon name="search" size={16} />
                        )}
                        {ytLoading ? 'Loading...' : 'Add'}
                      </button>
                    </div>
                    <div className="yt-url-hint">
                      Supports: youtube.com/watch?v=... · youtu.be/... · shorts,
                      playlists won't work
                    </div>
                    <div
                      style={{
                        marginTop: 24,
                        padding: 16,
                        background: 'var(--bg2)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text3)',
                          marginBottom: 12,
                        }}
                      >
                        QUICK PASTE EXAMPLES
                      </div>
                      {[
                        {
                          label: 'Lofi Hip Hop Radio',
                          url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
                        },
                        {
                          label: 'Classical Chill',
                          url: 'https://www.youtube.com/watch?v=4oStw0r33so',
                        },
                      ].map((ex) => (
                        <div
                          key={ex.url}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              color: 'var(--text2)',
                              flex: 1,
                            }}
                          >
                            {ex.label}
                          </span>
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ width: 'auto' }}
                            onClick={() => {
                              setYtUrl(ex.url)
                            }}
                          >
                            Use this
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: 16,
                color: 'var(--text3)',
              }}
            >
              <div style={{ fontSize: 40 }}>🎧</div>
              <div style={{ fontSize: 15, color: 'var(--text2)' }}>
                Listening in sync
              </div>
              <div style={{ fontSize: 13 }}>
                The host controls playback in this room
              </div>
              <div className="no-control-badge">view-only mode</div>
            </div>
          )}
        </div>

        {/* ── Right: Queue ── */}
        <div className="queue-panel">
          <div className="queue-header">
            <div className="sidebar-label" style={{ marginBottom: 0 }}>
              Queue ({queue.length})
            </div>
          </div>
          <div className="queue-list">
            {queue.length === 0 && (
              <div
                style={{
                  padding: 20,
                  fontSize: 13,
                  color: 'var(--text3)',
                  textAlign: 'center',
                }}
              >
                No tracks yet.
                <br />
                Add from the left panel.
              </div>
            )}
            {queue.map((track, i) => (
              <div
                key={track.id}
                className={`queue-item ${track.id === currentTrack?.id ? 'current' : ''}`}
              >
                <span className="queue-item-num">
                  {track.id === currentTrack?.id ? '▶' : i + 1}
                </span>
                <div className="queue-thumb">
                  {track.thumbnail ? (
                    <img
                      src={track.thumbnail}
                      alt=""
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 4,
                        objectFit: 'cover',
                      }}
                    />
                  ) : track.type === 'youtube' ? (
                    '▶'
                  ) : (
                    '♫'
                  )}
                </div>
                <div className="queue-item-info">
                  <div className="queue-item-name">{track.name}</div>
                  <div className="queue-item-by">by {track.addedBy}</div>
                </div>
                {(isHost || canControl) && track.id !== currentTrack?.id && (
                  <button
                    className="queue-remove"
                    onClick={() => removeFromQueue(track.id)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Chat panel spans center+queue col via grid ── */}
        {/* Chat is embedded below queue */}
        {/* Actually let's put chat inside right sidebar under queue — we rearrange */}
        {/* This is a side panel, appended. We'll render it as overlay-like via flex */}

        {/* ── Bottom player bar ── */}
        <div className="player-bar">
          {/* Now playing */}
          <div className="now-playing">
            <div className="np-thumb">
              {currentTrack?.thumbnail ? (
                <img
                  src={currentTrack.thumbnail}
                  alt=""
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 6,
                    objectFit: 'cover',
                  }}
                />
              ) : currentTrack ? (
                currentTrack.type === 'youtube' ? (
                  '▶'
                ) : (
                  '♫'
                )
              ) : (
                '—'
              )}
            </div>
            <div className="np-info">
              <div className="np-title">
                {currentTrack?.name || 'No track loaded'}
              </div>
              <div className="np-sub">
                {currentTrack
                  ? currentTrack.type === 'youtube'
                    ? 'YouTube Stream'
                    : 'Uploaded File'
                  : 'Add tracks to start'}
              </div>
            </div>
          </div>

          {/* Center: controls + progress */}
          <div className="player-center">
            <div className="controls-row">
              <button
                className="ctrl"
                onClick={skipPrev}
                disabled={!canControl && !isHost}
                title="Previous"
              >
                <Icon name="skip_prev" size={20} />
              </button>
              <button
                className="ctrl-play"
                onClick={togglePlayPause}
                disabled={!currentTrack}
                title={playing ? 'Pause' : 'Play'}
              >
                <Icon name={playing ? 'pause' : 'play'} size={18} />
              </button>
              <button
                className="ctrl"
                onClick={skipNext}
                disabled={!canControl && !isHost}
                title="Next"
              >
                <Icon name="skip_next" size={20} />
              </button>
            </div>
            <div className="progress-row">
              <span className="time-label">{fmt(position)}</span>
              <div
                className="progress-track"
                onClick={canControl || isHost ? seek : undefined}
                style={{ cursor: canControl || isHost ? 'pointer' : 'default' }}
              >
                <div className="progress-fill" style={{ width: `${pct}%` }} />
                <div className="progress-thumb" style={{ left: `${pct}%` }} />
              </div>
              <span className="time-label right">{fmt(duration)}</span>
            </div>
            {!canControl && !isHost && (
              <div className="no-control-badge">🔒 host controls playback</div>
            )}
          </div>

          {/* Volume */}
          <div className="player-right">
            <Icon name="volume" size={16} style={{ color: 'var(--text3)' }} />
            <input
              type="range"
              className="vol-slider"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(+e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Floating Chat ── */}
      <FloatingChat
        messages={chatMessages}
        input={chatInput}
        setInput={setChatInput}
        onSend={sendChat}
        myName={myName}
        chatEndRef={chatEndRef}
      />
    </>
  )
}

/* ─── FLOATING CHAT ─────────────────────────────────────────────────────── */
function FloatingChat({
  messages,
  input,
  setInput,
  onSend,
  myName,
  chatEndRef,
}) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const prevLen = useRef(0)

  useEffect(() => {
    if (!open && messages.length > prevLen.current)
      setUnread((u) => u + (messages.length - prevLen.current))
    prevLen.current = messages.length
  }, [messages, open])

  function toggle() {
    setOpen((o) => !o)
    setUnread(0)
  }

  return (
    <div style={{ position: 'fixed', bottom: 156, right: 20, zIndex: 50 }}>
      {open && (
        <div
          style={{
            width: 300,
            height: 400,
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 10,
            animation: 'toastIn 0.2s ease',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--border)',
              fontSize: 13,
              fontFamily: 'var(--mono)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            CHAT
            <button
              onClick={toggle}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text3)',
              }}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  color: 'var(--text3)',
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: 20,
                }}
              >
                No messages yet
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className="chat-msg"
                style={{
                  alignSelf: m.own ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                }}
              >
                <div className="chat-meta">
                  <span>{m.from}</span>
                </div>
                <div className={`chat-bubble${m.own ? ' own' : ''}`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Say something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
            />
            <button
              className="btn btn-icon"
              onClick={onSend}
              style={{ padding: '8px 10px', color: 'var(--accent)' }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22,2 15,22 11,13 2,9" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <button
        onClick={toggle}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: open ? 'var(--bg4)' : 'var(--accent2)',
          border: '1px solid var(--border2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 20,
          position: 'relative',
          boxShadow: open ? 'none' : '0 4px 20px rgba(124,58,237,0.4)',
          transition: 'all 0.2s',
        }}
      >
        💬
        {unread > 0 && !open && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              background: 'var(--red)',
              borderRadius: '50%',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            {unread}
          </span>
        )}
      </button>
    </div>
  )
}
