/**
 * ESP32 Pinout Explorer — Interactive SVG Renderer & Inspector Controller
 */

(function () {
  'use strict';

  const TAG_COLORS = {
    power: '#ef4444',
    gnd: '#475569',
    control: '#d97706',
    safe: '#059669',
    adc1: '#0891b2',
    adc2: '#4f46e5',
    i2c: '#9333ea',
    spi: '#0d9488',
    uart: '#2563eb',
    pwm: '#16a34a',
    touch: '#db2777',
    dac: '#e11d48',
    rtc: '#ca8a04',
    strap: '#ea580c',
    warn: '#d97706',
    danger: '#dc2626',
    usb: '#65a30d',
    inputOnly: '#7c3aed',
  };

  const SAFETY_DOT_COLORS = {
    safe: '#10b981',
    caution: '#f97316',
    danger: '#dc2626',
    power: '#ef4444',
  };

  const state = {
    boardId: ESP32_BOARDS[0].id,
    activeFilter: 'all',
    searchQuery: '',
    hoveredPinKey: null,
    selectedPinKey: null, // ghim (locked) khi click
    inspectorTab: 'pin', // 'pin' | 'overview'
    zoom: 1,
    showFloatingTooltip: true,
    pinMap: new Map(), // pinKey -> { pin, side, index, physicalNum }
  };

  // DOM References
  const elBoardTabs = document.getElementById('boardTabs');
  const elFilterChips = document.getElementById('filterChips');
  const elFilterStats = document.getElementById('filterStats');
  const elCanvasInner = document.getElementById('canvasInner');
  const elBoardChipBadge = document.getElementById('boardChipBadge');
  const elBoardOrientationNote = document.getElementById('boardOrientationNote');
  const elInspectorBody = document.getElementById('inspectorBody');
  const elTabPinDetail = document.getElementById('tabPinDetail');
  const elTabBoardOverview = document.getElementById('tabBoardOverview');
  const elLockIndicator = document.getElementById('lockIndicator');
  const elFloatingTooltip = document.getElementById('floatingTooltip');
  const elSearchInput = document.getElementById('pinSearchInput');
  const elClearSearchBtn = document.getElementById('clearSearchBtn');
  const elTooltipToggle = document.getElementById('floatingTooltipToggle');
  const elThemeToggle = document.getElementById('themeToggleBtn');
  const elZoomIn = document.getElementById('zoomInBtn');
  const elZoomOut = document.getElementById('zoomOutBtn');
  const elZoomReset = document.getElementById('zoomResetBtn');
  const elZoomLevel = document.getElementById('zoomLevelText');
  const elToast = document.getElementById('toast');

  function getCurrentBoard() {
    return ESP32_BOARDS.find((b) => b.id === state.boardId) || ESP32_BOARDS[0];
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatRichText(str) {
    return escapeHtml(str)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+?)`/g, '<code class="inline-code">$1</code>');
  }

  function truncateLabel(str, maxLen) {
    const s = String(str || '');
    return s.length <= maxLen ? s : s.slice(0, maxLen - 1).trimEnd() + '…';
  }

  function getPrimaryColor(pin) {
    if (pin.safety === 'danger') return TAG_COLORS.danger;
    if (pin.primaryType === 'gnd') return TAG_COLORS.gnd;
    if (pin.primaryType === 'power') return TAG_COLORS.power;
    if (pin.primaryType === 'control') return TAG_COLORS.control;
    return TAG_COLORS[pin.primaryType] || TAG_COLORS.safe;
  }

  // =========================================================================
  // BOARD TABS
  // =========================================================================
  function renderBoardTabs() {
    elBoardTabs.innerHTML = ESP32_BOARDS.map((b) => {
      const active = b.id === state.boardId ? 'active' : '';
      return `
        <button class="board-tab ${active}" data-board-id="${b.id}">
          <span>${escapeHtml(b.name)}</span>
          <span class="board-tab-badge">${escapeHtml(b.badge)}</span>
        </button>
      `;
    }).join('');

    elBoardTabs.querySelectorAll('.board-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextId = btn.getAttribute('data-board-id');
        if (nextId !== state.boardId) {
          state.boardId = nextId;
          state.activeFilter = 'all';
          state.hoveredPinKey = null;
          state.selectedPinKey = null;
          state.inspectorTab = 'pin';
          hideTooltip();
          renderAll();
        }
      });
    });
  }

  // =========================================================================
  // FILTER CHIPS
  // =========================================================================
  function getAllPinsOfBoard(board) {
    const list = [];
    board.leftPins.forEach((pin, idx) => {
      list.push({
        key: `L-${idx}`,
        side: 'left',
        index: idx,
        physicalNum: idx + 1,
        pin,
      });
    });
    board.rightPins.forEach((pin, idx) => {
      list.push({
        key: `R-${idx}`,
        side: 'right',
        index: idx,
        physicalNum: board.leftPins.length + board.rightPins.length - idx,
        pin,
      });
    });
    return list;
  }

  function renderFilterChips() {
    const board = getCurrentBoard();
    const allEntries = getAllPinsOfBoard(board);
    const counts = {};

    allEntries.forEach(({ pin }) => {
      (pin.categories || []).forEach((cat) => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });

    const orderedKeys = [
      'safe',
      'adc1',
      'adc2',
      'i2c',
      'spi',
      'uart',
      'pwm',
      'touch',
      'dac',
      'usb',
      'rtc',
      'inputOnly',
      'strapping',
      'danger',
      'power',
    ];

    let html = `
      <button class="filter-chip ${state.activeFilter === 'all' ? 'active' : ''}" data-filter="all" style="--chip-color: #38bdf8;">
        <span>Tất cả</span>
        <span class="filter-chip-count">${allEntries.length}</span>
      </button>
    `;

    orderedKeys.forEach((key) => {
      const cnt = counts[key] || 0;
      if (cnt === 0) return;
      const meta = PIN_CATEGORIES[key];
      const active = state.activeFilter === key ? 'active' : '';
      html += `
        <button class="filter-chip ${active}" data-filter="${key}" style="--chip-color: ${meta.color};">
          <span class="filter-chip-dot"></span>
          <span>${escapeHtml(meta.label)}</span>
          <span class="filter-chip-count">${cnt}</span>
        </button>
      `;
    });

    elFilterChips.innerHTML = html;

    elFilterChips.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const filter = chip.getAttribute('data-filter');
        state.activeFilter = state.activeFilter === filter && filter !== 'all' ? 'all' : filter;
        renderFilterChips();
        applyPinHighlights();
      });
    });
  }

  function doesPinMatch(entry) {
    const { pin } = entry;
    const filterOk =
      state.activeFilter === 'all' || (pin.categories || []).includes(state.activeFilter);

    const q = state.searchQuery.trim().toLowerCase();
    if (!q) return filterOk;

    const haystack = [
      pin.silk,
      pin.gpio !== null ? `gpio${pin.gpio}` : '',
      pin.gpio !== null ? `io${pin.gpio}` : '',
      pin.gpio !== null ? `${pin.gpio}` : '',
      pin.name,
      pin.shortDesc,
      pin.detailDesc,
      ...(pin.tags || []).map((t) => t.text),
      ...(pin.warnings || []),
      ...Object.values(pin.specs || {}),
    ]
      .join(' ')
      .toLowerCase();

    return filterOk && haystack.includes(q);
  }

  function applyPinHighlights() {
    const isFiltering = state.activeFilter !== 'all' || state.searchQuery.trim().length > 0;
    let matchedCount = 0;
    const total = state.pinMap.size;

    state.pinMap.forEach((entry, key) => {
      const groupEl = elCanvasInner.querySelector(`[data-pin-key="${key}"]`);
      if (!groupEl) return;
      const matched = doesPinMatch(entry);
      if (matched) matchedCount++;

      groupEl.classList.toggle('dimmed', isFiltering && !matched);
      groupEl.classList.toggle('matched', isFiltering && matched);
      groupEl.classList.toggle('is-selected', state.selectedPinKey === key);
      groupEl.classList.toggle('is-hovered', state.hoveredPinKey === key);
    });

    if (isFiltering) {
      elFilterStats.textContent = `Khớp ${matchedCount} / ${total} chân`;
    } else {
      elFilterStats.textContent = `${total} chân vật lý`;
    }
  }

  // =========================================================================
  // INTERACTIVE SVG BOARD RENDERER
  // =========================================================================
  function estimatePillWidth(text) {
    return Math.max(44, Math.round(text.length * 6.9 + 14));
  }

  function renderBoardSVG() {
    const board = getCurrentBoard();
    state.pinMap.clear();

    elBoardChipBadge.textContent = board.chip;
    elBoardOrientationNote.textContent = board.style.orientationNote;

    const rows = Math.max(board.leftPins.length, board.rightPins.length);
    const rowStep = rows >= 20 ? 31 : rows >= 15 ? 34 : 40;

    const labelZoneWidth = 315;
    const boardW = board.style.boardWidth;
    const svgW = labelZoneWidth * 2 + boardW;

    const antennaH = board.style.antennaType === 'ceramic' ? 30 : 48;
    const topMargin = 20;
    const pcbTop = topMargin + antennaH - 6;
    const headerStartY = pcbTop + (rows <= 8 ? 64 : 58);
    const pcbBottomPad = board.style.usbType === 'none' ? 42 : 76;
    const pcbBottom = headerStartY + (rows - 1) * rowStep + pcbBottomPad;
    const pcbH = pcbBottom - pcbTop;
    const svgH = pcbBottom + 36;

    const boardX = labelZoneWidth;
    const boardCenterX = boardX + boardW / 2;

    // Build SVG defs & PCB chassis
    let svg = `
      <svg class="board-svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pcbGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${board.style.pcbAccent}" />
            <stop offset="100%" stop-color="${board.style.pcbColor}" />
          </linearGradient>
          <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#cbd5e1" />
            <stop offset="45%" stop-color="#94a3b8" />
            <stop offset="100%" stop-color="#64748b" />
          </linearGradient>
          <linearGradient id="usbMetal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e2e8f0" />
            <stop offset="50%" stop-color="#94a3b8" />
            <stop offset="100%" stop-color="#64748b" />
          </linearGradient>
          <radialGradient id="rgbGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.95" />
            <stop offset="55%" stop-color="#a855f7" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#a855f7" stop-opacity="0" />
          </radialGradient>
          <filter id="boardShadow" x="-15%" y="-10%" width="130%" height="125%">
            <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000000" flood-opacity="0.45" />
          </filter>
          <filter id="padGlowFilter" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
    `;

    // 1. ANTENNA (TOP)
    if (board.style.antennaType === 'ceramic') {
      const antW = 54;
      const antX = boardCenterX - antW / 2;
      svg += `
        <g>
          <rect x="${antX}" y="${topMargin + 4}" width="${antW}" height="24" rx="4" fill="#b91c1c" stroke="#ef4444" stroke-width="1.2" />
          <rect x="${antX + 6}" y="${topMargin + 10}" width="${antW - 12}" height="10" rx="2" fill="#dc2626" opacity="0.8" />
          <text x="${boardCenterX}" y="${topMargin + 19}" text-anchor="middle" fill="#fecaca" font-family="JetBrains Mono" font-size="8" font-weight="700">2.4G ANT</text>
        </g>
      `;
    } else {
      const antW = boardW - 64;
      const antX = boardCenterX - antW / 2;
      svg += `
        <g>
          <rect x="${antX}" y="${topMargin}" width="${antW}" height="${antennaH}" rx="5" fill="#0d1117" stroke="#334155" stroke-width="1.5" />
          <!-- Gold PCB Meander Wi-Fi Trace -->
          <path d="M ${antX + 16} ${topMargin + antennaH - 6}
                   V ${topMargin + 10} H ${antX + 34} V ${topMargin + 30} H ${antX + 52}
                   V ${topMargin + 10} H ${antX + 70} V ${topMargin + 30} H ${antX + 88}
                   V ${topMargin + 10} H ${antX + antW - 18} V ${topMargin + 30}"
                fill="none" stroke="#d97706" stroke-width="3.2" stroke-linecap="square" stroke-linejoin="miter" opacity="0.9" />
        </g>
      `;
    }

    // 2. MAIN PCB BODY
    svg += `
      <g filter="url(#boardShadow)">
        <rect x="${boardX}" y="${pcbTop}" width="${boardW}" height="${pcbH}" rx="12" fill="url(#pcbGrad)" stroke="#334155" stroke-width="2" />
        <rect x="${boardX + 4}" y="${pcbTop + 4}" width="${boardW - 8}" height="${pcbH - 8}" rx="9" fill="none" stroke="rgba(148,163,184,0.14)" stroke-width="1" />
      </g>
    `;

    // Corner mounting holes (for DevKit boards)
    if (rows >= 15) {
      const holes = [
        [boardX + 14, pcbTop + 14],
        [boardX + boardW - 14, pcbTop + 14],
        [boardX + 14, pcbBottom - 14],
        [boardX + boardW - 14, pcbBottom - 14],
      ];
      holes.forEach(([hx, hy]) => {
        svg += `
          <circle cx="${hx}" cy="${hy}" r="5.2" fill="#090d14" stroke="#b45309" stroke-width="2" />
        `;
      });
    }

    // 3. RF METAL SHIELD (WROOM / ESP32-S / C3 IC)
    const shieldW = Math.max(108, boardW - 130);
    const shieldH = rows <= 8 ? 124 : 150;
    const shieldX = boardCenterX - shieldW / 2;
    const shieldY = pcbTop + 26;

    if (board.id === 'esp32-c3-supermini') {
      // Compact QFN IC chip for SuperMini
      const icSize = 68;
      const icX = boardCenterX - icSize / 2;
      const icY = pcbTop + 76;
      svg += `
        <g>
          <rect x="${icX}" y="${icY}" width="${icSize}" height="${icSize}" rx="5" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
          <circle cx="${icX + 10}" cy="${icY + 10}" r="2.5" fill="#64748b" />
          <text x="${boardCenterX}" y="${icY + 33}" text-anchor="middle" fill="#e2e8f0" font-family="JetBrains Mono" font-size="9.5" font-weight="700">ESP32-C3</text>
          <text x="${boardCenterX}" y="${icY + 46}" text-anchor="middle" fill="#94a3b8" font-family="JetBrains Mono" font-size="7.5">FH4 RISC-V</text>
          <!-- Onboard Blue LED indicator -->
          <rect x="${boardCenterX - 18}" y="${icY + icSize + 18}" width="10" height="6" rx="1.5" fill="#38bdf8" />
          <text x="${boardCenterX - 3}" y="${icY + icSize + 24}" fill="#7dd3fc" font-family="JetBrains Mono" font-size="7.5">LED(8)</text>
        </g>
      `;
    } else {
      const emblemY = shieldY + (rows <= 8 ? 34 : 38);
      const labelY1 = shieldY + (rows <= 8 ? 72 : 78);
      const labelY2 = shieldY + (rows <= 8 ? 88 : 96);
      const labelY3 = shieldY + shieldH - 14;
      svg += `
        <g>
          <rect x="${shieldX}" y="${shieldY}" width="${shieldW}" height="${shieldH}" rx="6" fill="url(#shieldGrad)" stroke="#e2e8f0" stroke-width="1.2" opacity="0.94" />
          <rect x="${shieldX + 5}" y="${shieldY + 5}" width="${shieldW - 10}" height="${shieldH - 10}" rx="3" fill="none" stroke="rgba(15,23,42,0.22)" stroke-width="1" />
          <!-- Stylized Wi-Fi / Espressif Emblem -->
          <circle cx="${boardCenterX}" cy="${emblemY}" r="14" fill="none" stroke="#1e293b" stroke-width="2" opacity="0.7" />
          <path d="M ${boardCenterX - 7.5} ${emblemY} A 7.5 7.5 0 0 1 ${boardCenterX + 7.5} ${emblemY}" fill="none" stroke="#1e293b" stroke-width="2" opacity="0.7" />
          <circle cx="${boardCenterX}" cy="${emblemY + 3}" r="2.3" fill="#1e293b" opacity="0.75" />
          <text x="${boardCenterX}" y="${labelY1}" text-anchor="middle" fill="#0f172a" font-family="JetBrains Mono" font-size="9.6" font-weight="800">${escapeHtml(board.style.moduleLabel)}</text>
          <text x="${boardCenterX}" y="${labelY2}" text-anchor="middle" fill="#1e293b" font-family="JetBrains Mono" font-size="7.8" font-weight="600">${escapeHtml(board.style.subLabel)}</text>
          <text x="${boardCenterX}" y="${labelY3}" text-anchor="middle" fill="#334155" font-family="JetBrains Mono" font-size="7.2">Wi-Fi • BLE • 3.3V</text>
        </g>
      `;
    }

    // 4. INTERIOR COMPONENTS (RGB LED, CP2102 IC, Tactile Buttons)
    const midY = shieldY + shieldH + 24;

    if (board.style.hasRgbLed) {
      svg += `
        <g>
          <circle cx="${boardCenterX}" cy="${midY + 20}" r="18" fill="url(#rgbGlow)" />
          <rect x="${boardCenterX - 9}" y="${midY + 11}" width="18" height="18" rx="3" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2" />
          <circle cx="${boardCenterX}" cy="${midY + 20}" r="5" fill="#38bdf8" />
          <text x="${boardCenterX}" y="${midY + 42}" text-anchor="middle" fill="#cbd5e1" font-family="JetBrains Mono" font-size="7.5" font-weight="700">RGB WS2812</text>
        </g>
      `;
    }

    // USB-UART chip (CP2102) on full DevKit boards
    if (rows >= 15) {
      const chipY = pcbBottom - 165;
      svg += `
        <g>
          <rect x="${boardCenterX - 20}" y="${chipY}" width="40" height="40" rx="4" fill="#0f172a" stroke="#475569" stroke-width="1.2" />
          <text x="${boardCenterX}" y="${chipY + 19}" text-anchor="middle" fill="#94a3b8" font-family="JetBrains Mono" font-size="7.2" font-weight="700">CP2102</text>
          <text x="${boardCenterX}" y="${chipY + 30}" text-anchor="middle" fill="#64748b" font-family="JetBrains Mono" font-size="6.5">USB-UART</text>
        </g>
      `;
    }

    // Tactile Buttons
    const btnY = pcbBottom - (board.style.usbType === 'none' ? 56 : 96);
    if (board.style.buttons.length === 2) {
      const [bLeft, bRight] = board.style.buttons;
      const offset = rows <= 8 ? 28 : 34;
      [
        { x: boardCenterX - offset, label: bLeft },
        { x: boardCenterX + offset, label: bRight },
      ].forEach((b) => {
        svg += `
          <g>
            <rect x="${b.x - 13}" y="${btnY}" width="26" height="22" rx="4" fill="#cbd5e1" stroke="#475569" stroke-width="1.2" />
            <circle cx="${b.x}" cy="${btnY + 11}" r="6" fill="#1e293b" />
            <text x="${b.x}" y="${btnY - 5}" text-anchor="middle" fill="#cbd5e1" font-family="JetBrains Mono" font-size="8" font-weight="700">${escapeHtml(b.label)}</text>
          </g>
        `;
      });
    } else if (board.style.buttons.length === 1) {
      svg += `
        <g>
          <rect x="${boardCenterX - 14}" y="${btnY}" width="28" height="22" rx="4" fill="#cbd5e1" stroke="#475569" stroke-width="1.2" />
          <circle cx="${boardCenterX}" cy="${btnY + 11}" r="6" fill="#1e293b" />
          <text x="${boardCenterX}" y="${btnY - 5}" text-anchor="middle" fill="#cbd5e1" font-family="JetBrains Mono" font-size="8" font-weight="700">${escapeHtml(board.style.buttons[0])}</text>
        </g>
      `;
    }

    // 5. USB CONNECTORS (BOTTOM)
    if (board.style.usbType === 'micro') {
      svg += `
        <g>
          <rect x="${boardCenterX - 24}" y="${pcbBottom - 20}" width="48" height="28" rx="4" fill="url(#usbMetal)" stroke="#475569" stroke-width="1.4" />
          <rect x="${boardCenterX - 17}" y="${pcbBottom - 10}" width="34" height="10" rx="2" fill="#1e293b" />
          <text x="${boardCenterX}" y="${pcbBottom + 22}" text-anchor="middle" fill="#94a3b8" font-family="JetBrains Mono" font-size="9" font-weight="700">MICRO-USB</text>
        </g>
      `;
    } else if (board.style.usbType === 'usbc') {
      svg += `
        <g>
          <rect x="${boardCenterX - 24}" y="${pcbBottom - 20}" width="48" height="28" rx="7" fill="url(#usbMetal)" stroke="#475569" stroke-width="1.4" />
          <rect x="${boardCenterX - 15}" y="${pcbBottom - 9}" width="30" height="9" rx="4" fill="#1e293b" />
          <text x="${boardCenterX}" y="${pcbBottom + 22}" text-anchor="middle" fill="#94a3b8" font-family="JetBrains Mono" font-size="9" font-weight="700">USB-C (NATIVE)</text>
        </g>
      `;
    } else if (board.style.usbType === 'dual-usbc') {
      const leftUsbX = boardCenterX - 58;
      const rightUsbX = boardCenterX + 12;
      svg += `
        <g>
          <rect x="${leftUsbX}" y="${pcbBottom - 22}" width="46" height="30" rx="7" fill="url(#usbMetal)" stroke="#475569" stroke-width="1.4" />
          <text x="${leftUsbX + 23}" y="${pcbBottom - 4}" text-anchor="middle" fill="#0f172a" font-family="JetBrains Mono" font-size="8" font-weight="800">UART</text>
          <text x="${leftUsbX + 23}" y="${pcbBottom + 22}" text-anchor="middle" fill="#94a3b8" font-family="JetBrains Mono" font-size="8.5" font-weight="700">USB-C UART</text>

          <rect x="${rightUsbX}" y="${pcbBottom - 22}" width="46" height="30" rx="7" fill="url(#usbMetal)" stroke="#475569" stroke-width="1.4" />
          <text x="${rightUsbX + 23}" y="${pcbBottom - 4}" text-anchor="middle" fill="#0f172a" font-family="JetBrains Mono" font-size="8" font-weight="800">USB</text>
          <text x="${rightUsbX + 23}" y="${pcbBottom + 22}" text-anchor="middle" fill="#94a3b8" font-family="JetBrains Mono" font-size="8.5" font-weight="700">USB-C OTG</text>
        </g>
      `;
    } else if (board.id === 'esp32-cam-aithinker') {
      svg += `
        <g>
          <text x="${boardCenterX}" y="${pcbBottom + 18}" text-anchor="middle" fill="#94a3b8" font-family="JetBrains Mono" font-size="8.8" font-weight="700">KHÔNG CÓ USB — NẠP QUA U0R / U0T / IO0</text>
        </g>
      `;
    }

    // 6. RENDER LEFT & RIGHT PINS
    function renderPinRow(pin, side, index) {
      const isLeft = side === 'left';
      const key = `${isLeft ? 'L' : 'R'}-${index}`;
      const physicalNum = isLeft
        ? index + 1
        : board.leftPins.length + board.rightPins.length - index;

      state.pinMap.set(key, { key, side, index, physicalNum, pin });

      const cy = headerStartY + index * rowStep;
      const padX = isLeft ? boardX + 16 : boardX + boardW - 16;
      const silkX = isLeft ? padX + 14 : padX - 14;
      const edgeX = isLeft ? boardX : boardX + boardW;

      const primaryColor = getPrimaryColor(pin);
      const safetyColor = SAFETY_DOT_COLORS[pin.safety] || '#10b981';

      // Build ordered pills outside the board:
      // First pill (closest to board): GPIO number or Silkscreen name
      const pills = [];
      if (pin.gpio !== null) {
        pills.push({
          text: `GPIO${pin.gpio}`,
          color: primaryColor,
          isPrimary: true,
        });
      } else {
        pills.push({
          text: pin.silk,
          color: primaryColor,
          isPrimary: true,
        });
      }

      // Add up to 2 concise function tags so lines stay ultra clean & readable
      (pin.tags || []).slice(0, 2).forEach((t) => {
        if (t.text === pin.silk) return;
        pills.push({
          text: t.text,
          color: TAG_COLORS[t.kind] || '#475569',
          isPrimary: false,
        });
      });

      const traceLen = 22;
      const pillGap = 5;
      const pillH = 22;
      const pillY = cy - pillH / 2;

      let cursorX = isLeft ? edgeX - traceLen : edgeX + traceLen;
      let pillsSvg = '';
      let farthestX = cursorX;

      pills.forEach((pill) => {
        const w = estimatePillWidth(pill.text);
        const rx = isLeft ? cursorX - w : cursorX;
        const textX = rx + w / 2;

        pillsSvg += `
          <rect x="${rx}" y="${pillY}" width="${w}" height="${pillH}" rx="5"
                fill="${pill.color}" opacity="${pill.isPrimary ? '0.96' : '0.88'}" />
          <text x="${textX}" y="${cy + 3.8}" text-anchor="middle" fill="#ffffff"
                font-family="JetBrains Mono" font-size="10" font-weight="${pill.isPrimary ? '800' : '700'}">${escapeHtml(pill.text)}</text>
        `;

        if (isLeft) {
          cursorX = rx - pillGap;
          farthestX = rx;
        } else {
          cursorX = rx + w + pillGap;
          farthestX = rx + w;
        }
      });

      const hitX = isLeft ? Math.max(6, farthestX - 8) : padX - 28;
      const hitW = isLeft ? padX + 34 - hitX : Math.min(svgW - 6, farthestX + 8) - hitX;
      const hitH = rowStep - 4;
      const hitY = cy - hitH / 2;

      const traceStartX = isLeft ? padX - 7 : padX + 7;
      const traceEndX = isLeft ? edgeX - traceLen : edgeX + traceLen;

      return `
        <g class="pin-group" data-pin-key="${key}" tabindex="0" role="button" aria-label="${escapeHtml(pin.name)}">
          <!-- Full-row interactive hit zone & hover backdrop -->
          <rect class="pin-row-bg" x="${hitX}" y="${hitY}" width="${hitW}" height="${hitH}" rx="7" />

          <!-- Connecting trace line -->
          <line class="pin-trace" x1="${traceStartX}" y1="${cy}" x2="${traceEndX}" y2="${cy}"
                stroke="${primaryColor}" stroke-width="1.8" stroke-opacity="0.72" />

          <!-- Glow & Pulse ring -->
          <circle class="pin-pad-glow" cx="${padX}" cy="${cy}" r="10.5" fill="none"
                  stroke="${safetyColor}" stroke-width="2.2" filter="url(#padGlowFilter)" />
          <circle class="pin-pad-pulse" cx="${padX}" cy="${cy}" r="8" fill="none"
                  stroke="#38bdf8" stroke-width="1.8" opacity="0" />

          <!-- Gold copper via pad -->
          <circle class="pin-pad-outer" cx="${padX}" cy="${cy}" r="6.8" fill="#f59e0b" stroke="#92400e" stroke-width="1.2" />
          <circle cx="${padX}" cy="${cy}" r="3.1" fill="#090d14" />

          <!-- Safety tiny indicator dot next to pad -->
          <circle cx="${isLeft ? edgeX - 6 : edgeX + 6}" cy="${cy}" r="2.7" fill="${safetyColor}" />

          <!-- Silkscreen text on PCB -->
          <text x="${silkX}" y="${cy + 3.5}" text-anchor="${isLeft ? 'start' : 'end'}"
                fill="#e2e8f0" font-family="JetBrains Mono" font-size="9.5" font-weight="700">${escapeHtml(pin.silk)}</text>

          <!-- Function Pills -->
          ${pillsSvg}
        </g>
      `;
    }

    board.leftPins.forEach((pin, i) => {
      svg += renderPinRow(pin, 'left', i);
    });

    board.rightPins.forEach((pin, i) => {
      svg += renderPinRow(pin, 'right', i);
    });

    svg += `</svg>`;
    elCanvasInner.innerHTML = svg;

    // Bind events on every pin group
    elCanvasInner.querySelectorAll('.pin-group').forEach((groupEl) => {
      const key = groupEl.getAttribute('data-pin-key');

      groupEl.addEventListener('mouseenter', (e) => {
        state.hoveredPinKey = key;
        applyPinHighlights();

        // Nếu chưa ghim chân nào, tự động cập nhật Inspector ngay khi trỏ chuột!
        if (!state.selectedPinKey) {
          if (state.inspectorTab !== 'pin') {
            state.inspectorTab = 'pin';
            updateInspectorTabUI();
          }
          renderInspector();
        }
        showTooltip(key, e);
      });

      groupEl.addEventListener('mousemove', (e) => {
        if (state.showFloatingTooltip && state.hoveredPinKey === key) {
          positionTooltip(e);
        }
      });

      groupEl.addEventListener('mouseleave', () => {
        if (state.hoveredPinKey === key) {
          state.hoveredPinKey = null;
          applyPinHighlights();
          hideTooltip();
        }
      });

      groupEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.selectedPinKey === key) {
          // Click lại chân đang ghim -> bỏ ghim
          state.selectedPinKey = null;
        } else {
          state.selectedPinKey = key;
          state.inspectorTab = 'pin';
          updateInspectorTabUI();
        }
        applyPinHighlights();
        renderInspector();
      });

      groupEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          groupEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      });
    });

    applyPinHighlights();
    applyZoom();
  }

  // =========================================================================
  // FLOATING SMART TOOLTIP
  // =========================================================================
  function showTooltip(key, mouseEvent) {
    if (!state.showFloatingTooltip) return;
    const entry = state.pinMap.get(key);
    if (!entry) return;
    const { pin } = entry;
    const safety = SAFETY_META[pin.safety] || SAFETY_META.safe;
    const primaryColor = getPrimaryColor(pin);

    const firstWarn =
      pin.safety === 'danger' || pin.safety === 'caution'
        ? pin.warnings && pin.warnings[0]
        : null;

    elFloatingTooltip.innerHTML = `
      <div class="ft-head">
        <div class="ft-title">
          <span class="ft-silk" style="background: ${primaryColor};">${escapeHtml(pin.silk)}</span>
          <span>${pin.gpio !== null ? `GPIO${pin.gpio}` : escapeHtml(pin.name)}</span>
        </div>
        <span class="ft-safety ${safety.badgeClass}">${safety.icon} ${escapeHtml(safety.shortLabel)}</span>
      </div>
      <div class="ft-desc">${escapeHtml(pin.shortDesc)}</div>
      ${
        firstWarn
          ? `<div class="ft-warn ${pin.safety === 'danger' ? 'is-danger' : ''}">⚠️ ${escapeHtml(firstWarn)}</div>`
          : ''
      }
      <div class="ft-foot">
        <span>${escapeHtml(pin.specs.io || '')}</span>
        <span>${state.selectedPinKey === key ? 'Click để bỏ ghim' : 'Click để ghim & xem code'}</span>
      </div>
    `;

    elFloatingTooltip.classList.remove('hidden');
    elFloatingTooltip.setAttribute('aria-hidden', 'false');
    positionTooltip(mouseEvent);
  }

  function positionTooltip(e) {
    const pad = 16;
    const rect = elFloatingTooltip.getBoundingClientRect();
    let x = e.clientX + 18;
    let y = e.clientY + 18;

    if (x + rect.width + pad > window.innerWidth) {
      x = e.clientX - rect.width - 18;
    }
    if (y + rect.height + pad > window.innerHeight) {
      y = e.clientY - rect.height - 16;
    }

    x = Math.max(pad, Math.min(x, window.innerWidth - rect.width - pad));
    y = Math.max(pad, Math.min(y, window.innerHeight - rect.height - pad));

    elFloatingTooltip.style.left = `${x}px`;
    elFloatingTooltip.style.top = `${y}px`;
  }

  function hideTooltip() {
    elFloatingTooltip.classList.add('hidden');
    elFloatingTooltip.setAttribute('aria-hidden', 'true');
  }

  // =========================================================================
  // RIGHT INSPECTOR & BOARD GUIDE
  // =========================================================================
  function updateInspectorTabUI() {
    elTabPinDetail.classList.toggle('active', state.inspectorTab === 'pin');
    elTabBoardOverview.classList.toggle('active', state.inspectorTab === 'overview');
    elLockIndicator.classList.toggle('hidden', !state.selectedPinKey);
  }

  function renderInspector() {
    updateInspectorTabUI();
    const board = getCurrentBoard();

    if (state.inspectorTab === 'overview') {
      renderBoardOverview(board);
      return;
    }

    const activeKey = state.selectedPinKey || state.hoveredPinKey;
    const entry = activeKey ? state.pinMap.get(activeKey) : null;

    if (!entry) {
      renderEmptyInspector(board);
      return;
    }

    const { pin, side, physicalNum } = entry;
    const isPinned = state.selectedPinKey === entry.key;
    const safety = SAFETY_META[pin.safety] || SAFETY_META.safe;
    const primaryColor = getPrimaryColor(pin);

    const tagsHtml = (pin.tags || [])
      .map((t) => {
        const bg = TAG_COLORS[t.kind] || '#475569';
        return `<span class="signal-pill" style="background: ${bg};">${escapeHtml(t.text)}</span>`;
      })
      .join('');

    const warningsHtml = (pin.warnings || [])
      .map((w) => {
        const cls =
          pin.safety === 'danger'
            ? 'is-danger'
            : pin.safety === 'safe'
            ? 'is-safe-note'
            : '';
        const icon = pin.safety === 'danger' ? '🚫' : pin.safety === 'safe' ? '💡' : '⚠️';
        return `
          <div class="warning-item ${cls}">
            <span class="warning-bullet">${icon}</span>
            <span>${escapeHtml(w)}</span>
          </div>
        `;
      })
      .join('');

    const useCasesHtml = (pin.useCases || [])
      .map((u) => `<div class="usecase-item">${escapeHtml(u)}</div>`)
      .join('');

    const specRows = [
      ['Chiều I/O', pin.specs.io],
      ['Điện áp', pin.specs.voltage],
      ['Pull-up / Down', pin.specs.pullup],
      ['Bộ đọc ADC', pin.specs.adc],
      ['Xuất xung PWM', pin.specs.pwm],
      ['RTC / Cảm ứng', pin.specs.rtc],
      ['Giao tiếp', pin.specs.comm],
      ['Trạng thái Boot', pin.specs.bootState],
    ]
      .filter(([, v]) => v)
      .map(
        ([k, v]) => `
        <div class="spec-row">
          <div class="spec-key">${escapeHtml(k)}</div>
          <div class="spec-val">${escapeHtml(v)}</div>
        </div>
      `
      )
      .join('');

    elInspectorBody.innerHTML = `
      <div class="pin-header-card">
        <div class="pin-header-top">
          <div class="pin-identity">
            <div class="pin-silk-badge" style="background: ${primaryColor};">${escapeHtml(pin.silk)}</div>
            <div class="pin-title-block">
              <h2>${escapeHtml(pin.name)}</h2>
              <div class="pin-submeta">
                <span>${pin.gpio !== null ? `GPIO ${pin.gpio}` : 'Không phải GPIO'}</span>
                <span>•</span>
                <span>Hàng ${side === 'left' ? 'Trái' : 'Phải'} (Chân #${physicalNum})</span>
              </div>
            </div>
          </div>
          <button id="togglePinLockBtn" class="unpin-btn ${isPinned ? 'pinned' : ''}" title="${isPinned ? 'Bỏ ghim chân này' : 'Ghim chân này để đọc kỹ'}">
            ${isPinned ? '📌 Bỏ ghim' : '📌 Ghim'}
          </button>
        </div>

        <div class="safety-banner ${safety.badgeClass}">
          <span class="safety-icon">${safety.icon}</span>
          <span>${escapeHtml(safety.label)}</span>
        </div>

        ${tagsHtml ? `<div class="tag-row">${tagsHtml}</div>` : ''}
      </div>

      <div class="detail-section">
        <div class="section-title">Tác dụng &amp; Giải thích chi tiết</div>
        <div class="detail-prose">
          <p class="detail-short">${escapeHtml(pin.shortDesc)}</p>
          <p class="detail-long">${escapeHtml(pin.detailDesc)}</p>
        </div>
      </div>

      ${
        warningsHtml
          ? `
        <div class="detail-section">
          <div class="section-title">${pin.safety === 'safe' ? 'Ghi chú thực chiến' : '⚠️ Lưu ý quan trọng &amp; Bẫy phần cứng'}</div>
          <div class="warning-list">${warningsHtml}</div>
        </div>
      `
          : ''
      }

      <div class="detail-section">
        <div class="section-title">Thông số kỹ thuật của chân</div>
        <div class="spec-grid">${specRows}</div>
      </div>

      ${
        useCasesHtml
          ? `
        <div class="detail-section">
          <div class="section-title">Ứng dụng thực tế phổ biến</div>
          <div class="usecase-list">${useCasesHtml}</div>
        </div>
      `
          : ''
      }

      ${
        pin.codeSnippet
          ? `
        <div class="detail-section">
          <div class="section-title">
            <span>Code mẫu Arduino / PlatformIO</span>
            <button id="copyCodeBtn" class="copy-code-btn">📋 Sao chép</button>
          </div>
          <div class="code-box">
            <pre><code>${escapeHtml(pin.codeSnippet)}</code></pre>
          </div>
        </div>
      `
          : ''
      }
    `;

    const lockBtn = document.getElementById('togglePinLockBtn');
    if (lockBtn) {
      lockBtn.addEventListener('click', () => {
        state.selectedPinKey = isPinned ? null : entry.key;
        applyPinHighlights();
        renderInspector();
      });
    }

    const copyBtn = document.getElementById('copyCodeBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        copyToClipboard(pin.codeSnippet);
      });
    }
  }

  function renderEmptyInspector(board) {
    elInspectorBody.innerHTML = `
      <div class="empty-inspector">
        <div class="empty-icon">👆</div>
        <h3>Di chuột vào bất kỳ chân nào trên sơ đồ</h3>
        <p>
          Thông tin chi tiết về chức năng, mức độ an toàn, cảnh báo Strapping/Boot,
          ADC1/ADC2 và code mẫu cho <strong>${escapeHtml(board.name)}</strong> sẽ hiển thị ngay tại đây.
        </p>
      </div>
      ${buildBoardSummaryHtml(board)}
    `;
  }

  function renderBoardOverview(board) {
    elInspectorBody.innerHTML = buildBoardSummaryHtml(board);
  }

  function buildBoardSummaryHtml(board) {
    const s = board.summary;
    const rulesHtml = s.goldenRules
      .map(
        (r) => `
        <div class="warning-item">
          <span class="warning-bullet">⚡</span>
          <span>${escapeHtml(r)}</span>
        </div>
      `
      )
      .join('');

    const defaultsHtml = s.quickDefaults
      .map(
        (d) => `
        <div class="default-row">
          <span>${escapeHtml(d.label)}</span>
          <strong>${escapeHtml(d.value)}</strong>
        </div>
      `
      )
      .join('');

    return `
      <div class="overview-card">
        <h3>🔧 Thông số ${escapeHtml(board.name)}</h3>
        <div class="spec-grid">
          <div class="spec-row"><div class="spec-key">Vi xử lý</div><div class="spec-val">${escapeHtml(s.cpu)}</div></div>
          <div class="spec-row"><div class="spec-key">Bộ nhớ</div><div class="spec-val">${escapeHtml(s.memory)}</div></div>
          <div class="spec-row"><div class="spec-key">Không dây</div><div class="spec-val">${escapeHtml(s.wireless)}</div></div>
          <div class="spec-row"><div class="spec-key">Điện áp</div><div class="spec-val">${escapeHtml(s.voltage)}</div></div>
          <div class="spec-row"><div class="spec-key">Phù hợp</div><div class="spec-val">${escapeHtml(s.bestFor)}</div></div>
        </div>
      </div>

      <div class="overview-card">
        <h3>📌 Các cặp chân mặc định cần nhớ</h3>
        <div class="defaults-list">${defaultsHtml}</div>
      </div>

      <div class="overview-card">
        <h3>🛡️ Quy tắc vàng tránh lỗi &amp; hỏng mạch</h3>
        <div class="warning-list">${rulesHtml}</div>
      </div>
    `;
  }

  // =========================================================================
  // UTILITIES: ZOOM, THEME, SEARCH, CLIPBOARD
  // =========================================================================
  function applyZoom() {
    elCanvasInner.style.transform = `scale(${state.zoom})`;
    elZoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  function fitToViewport() {
    const viewport = document.getElementById('canvasViewport');
    const svgEl = elCanvasInner.querySelector('svg');
    if (!viewport || !svgEl) {
      state.zoom = 1;
      applyZoom();
      return;
    }
    const availW = Math.max(320, viewport.clientWidth - 32);
    const availH = Math.max(320, viewport.clientHeight - 40);
    const svgW = Number(svgEl.getAttribute('width')) || 860;
    const svgH = Number(svgEl.getAttribute('height')) || 650;
    const fitScale = Math.min(1, availW / svgW, availH / svgH);
    state.zoom = Math.max(0.55, Math.min(1, Math.floor(fitScale * 20) / 20));
    applyZoom();
  }

  let toastTimer = null;
  function showToast(msg) {
    elToast.textContent = msg;
    elToast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elToast.classList.add('hidden');
    }, 2000);
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast('✓ Đã sao chép code mẫu!'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('✓ Đã sao chép code mẫu!');
    }
  }

  // =========================================================================
  // EVENT BINDINGS & INIT
  // =========================================================================
  elTabPinDetail.addEventListener('click', () => {
    state.inspectorTab = 'pin';
    renderInspector();
  });

  elTabBoardOverview.addEventListener('click', () => {
    state.inspectorTab = 'overview';
    renderInspector();
  });

  elSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    elClearSearchBtn.classList.toggle('hidden', state.searchQuery.length === 0);
    applyPinHighlights();
  });

  elClearSearchBtn.addEventListener('click', () => {
    state.searchQuery = '';
    elSearchInput.value = '';
    elClearSearchBtn.classList.add('hidden');
    applyPinHighlights();
    elSearchInput.focus();
  });

  elTooltipToggle.addEventListener('change', (e) => {
    state.showFloatingTooltip = e.target.checked;
    if (!state.showFloatingTooltip) hideTooltip();
  });

  elThemeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
  });

  elZoomIn.addEventListener('click', () => {
    state.zoom = Math.min(1.5, Number((state.zoom + 0.1).toFixed(2)));
    applyZoom();
  });

  elZoomOut.addEventListener('click', () => {
    state.zoom = Math.max(0.6, Number((state.zoom - 0.1).toFixed(2)));
    applyZoom();
  });

  elZoomReset.addEventListener('click', () => {
    fitToViewport();
  });

  // Click empty canvas to unpin
  document.getElementById('canvasViewport').addEventListener('click', () => {
    if (state.selectedPinKey) {
      state.selectedPinKey = null;
      applyPinHighlights();
      renderInspector();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.selectedPinKey) {
        state.selectedPinKey = null;
        applyPinHighlights();
        renderInspector();
      } else if (state.searchQuery) {
        state.searchQuery = '';
        elSearchInput.value = '';
        elClearSearchBtn.classList.add('hidden');
        applyPinHighlights();
      }
    }
  });

  function renderAll() {
    renderBoardTabs();
    renderFilterChips();
    renderBoardSVG();
    renderInspector();
    requestAnimationFrame(() => fitToViewport());
  }

  // =========================================================================
  // 3-MODE NAVIGATION CONTROLLER (PINOUT / COMPONENTS 3D / EXERCISES)
  // =========================================================================
  const appMode = {
    current: 'pinout', // 'pinout' | 'components' | 'exercises'
  };

  const elViewPinout = document.getElementById('viewPinout');
  const elViewComponents = document.getElementById('viewComponents');
  const elViewExercises = document.getElementById('viewExercises');
  const elSearchContainer = document.getElementById('pinSearchContainer');
  const elTooltipToggleContainer = document.getElementById('tooltipToggleContainer');

  let viewer3d = null;

  function switchMainMode(nextMode) {
    appMode.current = nextMode;
    hideTooltip();

    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === nextMode);
    });

    elViewPinout.classList.toggle('hidden', nextMode !== 'pinout');
    elViewComponents.classList.toggle('hidden', nextMode !== 'components');
    elViewExercises.classList.toggle('hidden', nextMode !== 'exercises');

    // Search & floating tooltip are specific to Pinout Explorer view
    elSearchContainer.classList.toggle('hidden', nextMode !== 'pinout');
    elTooltipToggleContainer.classList.toggle('hidden', nextMode !== 'pinout');

    if (nextMode === 'pinout') {
      if (viewer3d) viewer3d.stop();
      requestAnimationFrame(() => fitToViewport());
    } else if (nextMode === 'components') {
      ensureViewer3D();
      renderComponentsView();
      if (compState.subView === '3d' && viewer3d) {
        viewer3d.start();
      }
    } else if (nextMode === 'exercises') {
      if (viewer3d) viewer3d.stop();
      renderExercisesView();
    }
  }

  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchMainMode(btn.getAttribute('data-mode'));
    });
  });

  // =========================================================================
  // VIEW 2: VISUAL COMPONENT DATASHEETS & 3D VIEWER
  // =========================================================================
  const compState = {
    category: 'all',
    selectedId: ESP32_COMPONENTS[0].id,
    subView: '3d', // '3d' | '2d'
    hoveredPinId: null,
    selectedPinId: null,
  };

  const elCompCatPills = document.getElementById('compCatPills');
  const elCompList = document.getElementById('compList');
  const elBtnSub3D = document.getElementById('btnSubView3D');
  const elBtnSub2D = document.getElementById('btnSubView2D');
  const elComp3dControls = document.getElementById('comp3dControls');
  const elComp3dWrapper = document.getElementById('comp3dWrapper');
  const elComp2dWrapper = document.getElementById('comp2dWrapper');
  const elCompPinChips = document.getElementById('compPinChips');
  const elCompDatasheet = document.getElementById('compDatasheetPanel');
  const elToggleAutoRotate = document.getElementById('toggleAutoRotate');
  const elToggle3dLabels = document.getElementById('toggle3dLabels');
  const elComp3dHud = document.getElementById('comp3dHud');
  const elComp3dPresets = document.getElementById('comp3dPresets');

  function getSelectedComponent() {
    return ESP32_COMPONENTS.find((c) => c.id === compState.selectedId) || ESP32_COMPONENTS[0];
  }

  function updateComp3dHud() {
    if (!elComp3dHud) return;
    const comp = getSelectedComponent();
    const activePinId = compState.selectedPinId || compState.hoveredPinId;
    const pin = activePinId ? comp.pins.find((p) => p.id === activePinId) : null;

    elComp3dHud.innerHTML = `
      <div class="hud-title">${escapeHtml(comp.shortName)} • <span style="color:var(--accent);">${escapeHtml(comp.badge)}</span></div>
      ${
        pin
          ? `<div class="hud-pin"><span class="hud-pin-dot" style="background:${pin.color};"></span><span><strong>${escapeHtml(pin.shortLabel)}:</strong> ${escapeHtml(truncateLabel(pin.connectTo, 42))}</span></div>`
          : `<div class="hud-pin"><span>Trỏ chuột vào nhãn chân 3D để soi kết nối</span></div>`
      }
    `;
  }

  function ensureViewer3D() {
    if (viewer3d) return;
    const canvas = document.getElementById('comp3dCanvas');
    viewer3d = new Component3DViewer(canvas, {
      onPinHover: (pinId) => {
        compState.hoveredPinId = pinId;
        updateCompPinChipsState();
        updateComp3dHud();
        renderComponentDatasheet();
      },
      onPinSelect: (pinId) => {
        compState.selectedPinId = pinId;
        updateCompPinChipsState();
        updateComp3dHud();
        renderComponentDatasheet();
      },
    });
    viewer3d.setComponent(getSelectedComponent());
    viewer3d.setAutoRotate(elToggleAutoRotate.checked);
    viewer3d.setShowLabels(elToggle3dLabels.checked);
  }

  function selectComponent(compId) {
    compState.selectedId = compId;
    compState.hoveredPinId = null;
    compState.selectedPinId = null;
    if (viewer3d) {
      viewer3d.setComponent(getSelectedComponent());
      viewer3d.setAutoRotate(elToggleAutoRotate.checked);
    }
    renderComponentsView();
  }

  function renderCompCategoriesAndList() {
    elCompCatPills.innerHTML = Object.values(COMPONENT_CATEGORIES)
      .map((cat) => {
        const active = compState.category === cat.id ? 'active' : '';
        return `<button class="cat-pill ${active}" data-cat="${cat.id}">${escapeHtml(cat.label)}</button>`;
      })
      .join('');

    elCompCatPills.querySelectorAll('.cat-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        compState.category = btn.getAttribute('data-cat');
        renderCompCategoriesAndList();
      });
    });

    const filtered = ESP32_COMPONENTS.filter(
      (c) => compState.category === 'all' || c.category === compState.category
    );

    elCompList.innerHTML = filtered
      .map((c) => {
        const active = c.id === compState.selectedId ? 'active' : '';
        return `
          <button class="comp-card-btn ${active}" data-comp-id="${c.id}">
            <div class="comp-card-title">${escapeHtml(c.name)}</div>
            <div class="comp-card-meta">
              <span class="comp-badge">${escapeHtml(c.badge)}</span>
              <span>${c.pins.length} chân</span>
            </div>
          </button>
        `;
      })
      .join('');

    elCompList.querySelectorAll('.comp-card-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectComponent(btn.getAttribute('data-comp-id'));
      });
    });
  }

  function updateCompPinChipsState() {
    const activePinId = compState.selectedPinId || compState.hoveredPinId;
    elCompPinChips.querySelectorAll('.comp-pin-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.getAttribute('data-pin-id') === activePinId);
    });
  }

  function renderCompPinStrip() {
    const comp = getSelectedComponent();
    elCompPinChips.innerHTML = comp.pins
      .map((p) => {
        const active =
          (compState.selectedPinId || compState.hoveredPinId) === p.id ? 'active' : '';
        return `
          <button class="comp-pin-chip ${active}" data-pin-id="${p.id}" style="--pin-c: ${p.color};">
            <span class="comp-pin-dot" style="background: ${p.color};"></span>
            <span>${escapeHtml(p.shortLabel)}</span>
          </button>
        `;
      })
      .join('');

    elCompPinChips.querySelectorAll('.comp-pin-chip').forEach((chip) => {
      const pid = chip.getAttribute('data-pin-id');
      chip.addEventListener('mouseenter', () => {
        compState.hoveredPinId = pid;
        if (viewer3d) viewer3d.setHoveredPin(pid);
        updateCompPinChipsState();
        updateComp3dHud();
        renderComponentDatasheet();
      });
      chip.addEventListener('mouseleave', () => {
        compState.hoveredPinId = null;
        if (viewer3d) viewer3d.setHoveredPin(null);
        updateCompPinChipsState();
        updateComp3dHud();
        renderComponentDatasheet();
      });
      chip.addEventListener('click', () => {
        compState.selectedPinId = compState.selectedPinId === pid ? null : pid;
        if (viewer3d) viewer3d.setSelectedPin(compState.selectedPinId);
        updateCompPinChipsState();
        updateComp3dHud();
        renderComponentDatasheet();
      });
    });
  }

  function renderComponent2DSVG(comp) {
    const w = 740;
    const rowH = 56;
    const h = Math.max(300, 120 + comp.pins.length * rowH);
    const boxX = 24;
    const boxW = 186;
    const boxY = 50;
    const boxH = h - 100;
    const rowRectW = 492;

    let rowsSvg = '';
    comp.pins.forEach((pin, idx) => {
      const y = boxY + 38 + idx * rowH;
      const isActive = (compState.selectedPinId || compState.hoveredPinId) === pin.id;
      const connText = truncateLabel(pin.connectTo, 46);
      const roleText = truncateLabel(pin.role, 54);
      rowsSvg += `
        <g class="comp-2d-pin" data-pin-id="${pin.id}" style="cursor: pointer;">
          <rect x="${boxX + boxW - 10}" y="${y - 20}" width="${rowRectW}" height="40" rx="8"
                fill="${isActive ? 'rgba(56,189,248,0.16)' : 'rgba(148,163,184,0.06)'}"
                stroke="${isActive ? '#38bdf8' : 'rgba(148,163,184,0.18)'}" stroke-width="${isActive ? '1.6' : '1'}" />
          <line x1="${boxX + boxW}" y1="${y}" x2="${boxX + boxW + 18}" y2="${y}"
                stroke="${pin.color}" stroke-width="${isActive ? '3.5' : '2.4'}" />
          <circle cx="${boxX + boxW}" cy="${y}" r="6.5" fill="${pin.color}" stroke="#fff" stroke-width="1.5" />
          <rect x="${boxX + boxW + 14}" y="${y - 12}" width="92" height="24" rx="6" fill="${pin.color}" />
          <text x="${boxX + boxW + 60}" y="${y + 4}" text-anchor="middle" fill="#fff"
                font-family="JetBrains Mono" font-size="10.8" font-weight="800">${escapeHtml(pin.shortLabel)}</text>
          <text x="${boxX + boxW + 116}" y="${y - 2}" fill="#f1f5f9"
                font-family="Be Vietnam Pro" font-size="11.5" font-weight="700">→ ${escapeHtml(connText)}</text>
          <text x="${boxX + boxW + 116}" y="${y + 13}" fill="#94a3b8"
                font-family="Be Vietnam Pro" font-size="10.2">${escapeHtml(roleText)}</text>
        </g>
      `;
    });

    elComp2dWrapper.innerHTML = `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="max-width:100%; height:auto;">
        <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="14"
              fill="#111827" stroke="#334155" stroke-width="2" />
        <text x="${boxX + boxW / 2}" y="${boxY + boxH / 2 - 8}" text-anchor="middle" fill="#f8fafc"
              font-family="Be Vietnam Pro" font-size="14" font-weight="800">${escapeHtml(comp.shortName)}</text>
        <text x="${boxX + boxW / 2}" y="${boxY + boxH / 2 + 14}" text-anchor="middle" fill="#38bdf8"
              font-family="JetBrains Mono" font-size="10.5" font-weight="700">${escapeHtml(comp.badge)}</text>
        <text x="${boxX + boxW + 116}" y="${boxY - 12}" fill="#94a3b8"
              font-family="Be Vietnam Pro" font-size="12" font-weight="700">SƠ ĐỒ NỐI CHÂN CHUẨN VỚI ESP32</text>
        ${rowsSvg}
      </svg>
    `;

    elComp2dWrapper.querySelectorAll('.comp-2d-pin').forEach((g) => {
      const pid = g.getAttribute('data-pin-id');
      g.addEventListener('mouseenter', () => {
        compState.hoveredPinId = pid;
        updateCompPinChipsState();
        renderComponentDatasheet();
      });
      g.addEventListener('click', () => {
        compState.selectedPinId = compState.selectedPinId === pid ? null : pid;
        renderComponent2DSVG(comp);
        updateCompPinChipsState();
        renderComponentDatasheet();
      });
    });
  }

  function renderComponentDatasheet() {
    const comp = getSelectedComponent();
    const activePinId = compState.selectedPinId || compState.hoveredPinId;
    const activePin = comp.pins.find((p) => p.id === activePinId) || comp.pins[0];
    const isPinned = compState.selectedPinId === activePin.id;

    const specsHtml = comp.specs
      .map(
        (s) => `
        <div class="spec-row">
          <div class="spec-key">${escapeHtml(s.key)}</div>
          <div class="spec-val">${escapeHtml(s.value)}</div>
        </div>
      `
      )
      .join('');

    const howHtml = comp.howItWorks
      .map((p) => `<div class="usecase-item">${formatRichText(p)}</div>`)
      .join('');

    const warnHtml = comp.warnings
      .map(
        (w) => `
        <div class="warning-item">
          <span class="warning-bullet">⚠️</span>
          <span>${formatRichText(w)}</span>
        </div>
      `
      )
      .join('');

    const wiringRows = comp.wiringTable
      .map(
        (r) => `
        <tr>
          <td class="ds-mono">${escapeHtml(r.compPin)}</td>
          <td class="ds-mono">${escapeHtml(r.espPin)}</td>
          <td>${escapeHtml(r.note)}</td>
        </tr>
      `
      )
      .join('');

    elCompDatasheet.innerHTML = `
      <div class="pin-header-card">
        <div class="pin-header-top">
          <div>
            <span class="comp-badge">${escapeHtml(comp.badge)}</span>
            <h2 style="font-size:17px; font-weight:800; margin-top:6px;">${escapeHtml(comp.name)}</h2>
          </div>
        </div>
        <p style="font-size:13px; color:var(--text-secondary); line-height:1.55; margin-top:8px;">
          ${escapeHtml(comp.summary)}
        </p>
      </div>

      <div class="ds-pin-spotlight" style="border-color: ${activePin.color};">
        <div class="ds-pin-spotlight-head">
          <span class="ds-pin-badge" style="background: ${activePin.color};">${escapeHtml(activePin.shortLabel)}</span>
          <div style="flex:1;">
            <div style="font-size:14px; font-weight:800;">${escapeHtml(activePin.name)}</div>
            <div class="ds-pin-role">${escapeHtml(activePin.role)}</div>
          </div>
          ${isPinned ? '<span class="lock-indicator">📌 Đang ghim</span>' : ''}
        </div>
        <p style="font-size:12.8px; line-height:1.55; margin-bottom:8px;">${formatRichText(activePin.desc)}</p>
        <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;">
          <strong>Nối với ESP32:</strong> <span class="ds-mono">${escapeHtml(activePin.connectTo)}</span>
        </div>
        <div class="warning-item" style="margin:0;">
          <span class="warning-bullet">💡</span>
          <span>${formatRichText(activePin.warning)}</span>
        </div>
      </div>

      <div class="detail-section">
        <div class="section-title">Thông số Datasheet cốt lõi</div>
        <div class="spec-grid">${specsHtml}</div>
      </div>

      <div class="detail-section">
        <div class="section-title">Bản chất &amp; Nguyên lý hoạt động</div>
        <div class="usecase-list">${howHtml}</div>
      </div>

      <div class="detail-section">
        <div class="section-title">⚠️ Cảnh báo cháy mạch &amp; Kinh nghiệm</div>
        <div class="warning-list">${warnHtml}</div>
      </div>

      <div class="detail-section">
        <div class="section-title">Bảng đấu dây chuẩn với ESP32</div>
        <table class="ds-wiring-table">
          <thead>
            <tr><th>Chân linh kiện</th><th>Chân ESP32</th><th>Ghi chú</th></tr>
          </thead>
          <tbody>${wiringRows}</tbody>
        </table>
      </div>

      <div class="detail-section">
        <div class="section-title">
          <span>Code kiểm tra nhanh (Arduino / PlatformIO)</span>
          <button id="copyCompCodeBtn" class="copy-code-btn">📋 Sao chép</button>
        </div>
        <div class="code-box"><pre><code>${escapeHtml(comp.codeSnippet)}</code></pre></div>
      </div>
    `;

    const copyBtn = document.getElementById('copyCompCodeBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => copyToClipboard(comp.codeSnippet));
    }
  }

  function renderComponentsView() {
    renderCompCategoriesAndList();
    renderCompPinStrip();
    updateComp3dHud();
    renderComponentDatasheet();

    const is3D = compState.subView === '3d';
    elBtnSub3D.classList.toggle('active', is3D);
    elBtnSub2D.classList.toggle('active', !is3D);
    elComp3dControls.classList.toggle('hidden', !is3D);
    elComp3dWrapper.classList.toggle('hidden', !is3D);
    elComp2dWrapper.classList.toggle('hidden', is3D);

    if (is3D) {
      if (viewer3d) {
        viewer3d.setComponent(getSelectedComponent());
        viewer3d.start();
      }
    } else {
      if (viewer3d) viewer3d.stop();
      renderComponent2DSVG(getSelectedComponent());
    }
  }

  elBtnSub3D.addEventListener('click', () => {
    compState.subView = '3d';
    renderComponentsView();
  });

  elBtnSub2D.addEventListener('click', () => {
    compState.subView = '2d';
    renderComponentsView();
  });

  elToggleAutoRotate.addEventListener('change', (e) => {
    if (viewer3d) viewer3d.setAutoRotate(e.target.checked);
  });

  elToggle3dLabels.addEventListener('change', (e) => {
    if (viewer3d) viewer3d.setShowLabels(e.target.checked);
  });

  if (elComp3dPresets) {
    elComp3dPresets.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        elComp3dPresets.querySelectorAll('.preset-btn').forEach((b) => {
          b.classList.toggle('active', b === btn);
        });
        if (viewer3d) {
          viewer3d.setViewPreset(preset);
          elToggleAutoRotate.checked = preset === 'iso';
        }
      });
    });
  }

  document.getElementById('comp3dZoomIn').addEventListener('click', () => {
    if (viewer3d) viewer3d.adjustZoom(0.18);
  });

  document.getElementById('comp3dZoomOut').addEventListener('click', () => {
    if (viewer3d) viewer3d.adjustZoom(-0.18);
  });

  document.getElementById('comp3dReset').addEventListener('click', () => {
    if (viewer3d) {
      viewer3d.setViewPreset('iso');
      elToggleAutoRotate.checked = true;
      if (elComp3dPresets) {
        elComp3dPresets.querySelectorAll('.preset-btn').forEach((b) => {
          b.classList.toggle('active', b.getAttribute('data-preset') === 'iso');
        });
      }
    }
  });

  // =========================================================================
  // VIEW 3: BEGINNER EXERCISES, LIVE SIMULATORS & CORE CONCEPTS
  // =========================================================================
  const STORAGE_KEY_DONE = 'esp32_pinout_completed_labs_v1';
  function loadCompletedLabs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DONE);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (_) {
      return new Set();
    }
  }
  function saveCompletedLabs(set) {
    try {
      localStorage.setItem(STORAGE_KEY_DONE, JSON.stringify([...set]));
    } catch (_) {
      // Ignore storage errors in private mode
    }
  }

  const exState = {
    mode: 'exercise', // 'exercise' | 'concept'
    selectedId: ESP32_EXERCISES[0].id,
    completedIds: loadCompletedLabs(),
    simTimer: null,
  };

  const elExProgressBox = document.getElementById('exProgressBox');
  const elExLabsList = document.getElementById('exLabsList');
  const elExConceptsList = document.getElementById('exConceptsList');
  const elExContentArea = document.getElementById('exContentArea');

  function clearSimulatorTimer() {
    if (exState.simTimer) {
      clearInterval(exState.simTimer);
      exState.simTimer = null;
    }
  }

  function renderExercisesSidebar() {
    const doneCount = ESP32_EXERCISES.filter((e) => exState.completedIds.has(e.id)).length;
    const totalCount = ESP32_EXERCISES.length;
    const pct = Math.round((doneCount / Math.max(1, totalCount)) * 100);

    if (elExProgressBox) {
      elExProgressBox.innerHTML = `
        <div class="ex-progress-head">
          <span>Tiến độ thực hành</span>
          <span style="color:var(--accent); font-family:var(--font-mono);">${doneCount} / ${totalCount} bài (${pct}%)</span>
        </div>
        <div class="ex-progress-track">
          <div class="ex-progress-fill" style="width:${pct}%;"></div>
        </div>
      `;
    }

    elExLabsList.innerHTML = EXERCISE_CHAPTERS.map((chap) => {
      const items = ESP32_EXERCISES.filter((ex) => ex.chapterId === chap.id);
      const chapDone = items.filter((ex) => exState.completedIds.has(ex.id)).length;
      const itemsHtml = items
        .map((ex) => {
          const active = exState.mode === 'exercise' && exState.selectedId === ex.id ? 'active' : '';
          const isDone = exState.completedIds.has(ex.id);
          return `
            <button class="ex-nav-btn ${active}" data-type="exercise" data-id="${ex.id}">
              <div class="ex-nav-row">
                <div class="ex-nav-num">${escapeHtml(ex.number)} • ${escapeHtml(ex.duration)}</div>
                ${isDone ? '<span class="ex-done-check">✓ Xong</span>' : ''}
              </div>
              <div class="ex-nav-title">${escapeHtml(ex.title)}</div>
              <div class="ex-nav-level">${escapeHtml(ex.level)}</div>
            </button>
          `;
        })
        .join('');

      return `
        <div class="ex-chapter-group">
          <div class="ex-chapter-header">
            <span>${escapeHtml(chap.title)}</span>
            <span style="font-family:var(--font-mono); font-size:10.5px;">${chapDone}/${items.length}</span>
          </div>
          <div class="ex-chapter-items">${itemsHtml}</div>
        </div>
      `;
    }).join('');

    elExConceptsList.innerHTML = CORE_CONCEPTS.map((c) => {
      const active = exState.mode === 'concept' && exState.selectedId === c.id ? 'active' : '';
      return `
        <button class="ex-nav-btn ${active}" data-type="concept" data-id="${c.id}">
          <div class="ex-nav-num">${c.icon} ${escapeHtml(c.badge)}</div>
          <div class="ex-nav-title">${escapeHtml(c.title)}</div>
        </button>
      `;
    }).join('');

    document.querySelectorAll('.ex-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        exState.mode = btn.getAttribute('data-type');
        exState.selectedId = btn.getAttribute('data-id');
        renderExercisesView();
        elExContentArea.scrollTop = 0;
      });
    });
  }

  function renderExerciseWiringSVG(ex) {
    const steps = ex.wiringSteps || [];
    const h = Math.max(195, 50 + steps.length * 44);
    let wiresSvg = '';
    const colors = ['#ef4444', '#eab308', '#38bdf8', '#22c55e', '#a855f7'];
    const svgW = 540;

    steps.forEach((st, i) => {
      const y = 44 + i * 44;
      const c = colors[i % colors.length];
      const fromText = truncateLabel(st.from, 28);
      const toText = truncateLabel(st.to, 30);
      wiresSvg += `
        <line x1="216" y1="${y}" x2="294" y2="${y}" stroke="${c}" stroke-width="2.8" stroke-linecap="round" />
        <circle cx="216" cy="${y}" r="4.5" fill="${c}" />
        <circle cx="294" cy="${y}" r="4.5" fill="${c}" />
        <rect x="10" y="${y - 14}" width="206" height="28" rx="6" fill="#1e293b" stroke="${c}" stroke-width="1.2" />
        <text x="113" y="${y + 4}" text-anchor="middle" fill="#f8fafc" font-family="JetBrains Mono" font-size="9.6" font-weight="700">${escapeHtml(fromText)}</text>
        <rect x="294" y="${y - 14}" width="236" height="28" rx="6" fill="#0f172a" stroke="${c}" stroke-width="1.2" />
        <text x="412" y="${y + 4}" text-anchor="middle" fill="#e2e8f0" font-family="JetBrains Mono" font-size="9.6" font-weight="700">${escapeHtml(toText)}</text>
      `;
    });

    return `
      <svg width="${svgW}" height="${h}" viewBox="0 0 ${svgW} ${h}" style="width:100%; height:auto; background:var(--bg-elevated); border-radius:10px; border:1px solid var(--border-subtle);">
        <text x="113" y="18" text-anchor="middle" fill="#94a3b8" font-family="Be Vietnam Pro" font-size="10.5" font-weight="700">NGUỒN / LINH KIỆN</text>
        <text x="412" y="18" text-anchor="middle" fill="#38bdf8" font-family="Be Vietnam Pro" font-size="10.5" font-weight="700">CHÂN ĐẤU NỐI ĐÍCH</text>
        ${wiresSvg}
      </svg>
    `;
  }

  function setupExerciseSimulator(ex, container) {
    clearSimulatorTimer();
    const type = ex.simulatorType;

    if (type === 'led-blink') {
      container.innerHTML = `
        <div class="sim-box">
          <div class="sim-stage">
            <div id="simLedBulb" class="sim-led-bulb on"></div>
            <div class="sim-controls-row">
              <button id="simBlinkToggle" class="sim-btn active">⏸ Đang chạy Blink</button>
              <label style="font-size:12px; color:var(--text-secondary);">Điện trở R:
                <select id="simLedResistor" style="background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border-subtle);border-radius:6px;padding:3px 6px;">
                  <option value="220" selected>220 Ω (Chuẩn)</option>
                  <option value="330">330 Ω (An toàn)</option>
                  <option value="1000">1000 Ω (Mờ nhẹ)</option>
                  <option value="0">0 Ω (Không trở - NGUY HIỂM!)</option>
                </select>
              </label>
            </div>
            <div class="sim-metrics">
              <div class="sim-metric"><span>Áp GPIO</span><strong id="simLedVolt">3.30 V</strong></div>
              <div class="sim-metric"><span>Dòng qua LED</span><strong id="simLedCurr">5.9 mA</strong></div>
              <div class="sim-metric"><span>Đánh giá</span><strong id="simLedHealth" style="color:#10b981;">An toàn ✓</strong></div>
            </div>
          </div>
        </div>
      `;
      let running = true;
      let isOn = true;
      const bulb = document.getElementById('simLedBulb');
      const resSel = document.getElementById('simLedResistor');
      const voltEl = document.getElementById('simLedVolt');
      const currEl = document.getElementById('simLedCurr');
      const healthEl = document.getElementById('simLedHealth');

      const updateMetrics = () => {
        const r = Number(resSel.value);
        bulb.classList.toggle('on', isOn);
        voltEl.textContent = isOn ? '3.30 V' : '0.00 V';
        if (!isOn) {
          currEl.textContent = '0.0 mA';
          return;
        }
        if (r === 0) {
          currEl.textContent = '> 80 mA!';
          healthEl.textContent = '🔥 Cháy GPIO!';
          healthEl.style.color = '#ef4444';
        } else {
          const ma = ((3.3 - 2.0) / r) * 1000;
          currEl.textContent = `${ma.toFixed(1)} mA`;
          healthEl.textContent = ma > 20 ? '⚠️ Hơi cao' : 'An toàn ✓';
          healthEl.style.color = ma > 20 ? '#f97316' : '#10b981';
        }
      };

      exState.simTimer = setInterval(() => {
        if (!running) return;
        isOn = !isOn;
        updateMetrics();
      }, 650);

      document.getElementById('simBlinkToggle').addEventListener('click', (e) => {
        running = !running;
        e.target.textContent = running ? '⏸ Đang chạy Blink' : '▶ Tiếp tục Blink';
        e.target.classList.toggle('active', running);
      });
      resSel.addEventListener('change', updateMetrics);
    } else if (type === 'button-debounce') {
      container.innerHTML = `
        <div class="sim-box">
          <div class="sim-stage">
            <div class="sim-controls-row" style="justify-content:center;">
              <button id="simPressBtn" class="sim-btn" style="padding:12px 22px; font-size:14px;">🔘 Bấm nút (Giả lập có dội phím 12ms)</button>
            </div>
            <div class="sim-metrics">
              <div class="sim-metric"><span>Mức INPUT_PULLUP</span><strong id="simBtnLevel">HIGH (1)</strong></div>
              <div class="sim-metric"><span>Đếm KHÔNG Debounce</span><strong id="simRawCount" style="color:#f97316;">0</strong></div>
              <div class="sim-metric"><span>Đếm CÓ Debounce</span><strong id="simCleanCount" style="color:#10b981;">0</strong></div>
            </div>
          </div>
        </div>
      `;
      let raw = 0;
      let clean = 0;
      const btn = document.getElementById('simPressBtn');
      const levelEl = document.getElementById('simBtnLevel');
      const rawEl = document.getElementById('simRawCount');
      const cleanEl = document.getElementById('simCleanCount');

      btn.addEventListener('click', () => {
        const bounces = 2 + Math.floor(Math.random() * 3); // 2-4 bounce edges!
        raw += bounces;
        clean += 1;
        levelEl.textContent = 'LOW (0) ✓';
        rawEl.textContent = `${raw} (+${bounces} dội)`;
        cleanEl.textContent = `${clean} (Chuẩn)`;
        setTimeout(() => {
          levelEl.textContent = 'HIGH (1)';
        }, 260);
      });
    } else if (type === 'adc-joystick') {
      container.innerHTML = `
        <div class="sim-box">
          <div class="sim-stage">
            <div class="sim-controls-row">
              <span style="font-size:12px; font-weight:700;">Gạt Joystick (ADC):</span>
              <input id="simAdcSlider" class="sim-slider" type="range" min="0" max="4095" value="2020" />
              <button id="simAdcCenterBtn" class="sim-btn" style="padding:5px 10px; font-size:11.5px;">Thả tay (Tâm)</button>
            </div>
            <div style="width:100%; height:14px; background:var(--bg-surface); border-radius:99px; border:1px solid var(--border-subtle); position:relative; overflow:hidden;">
              <div style="position:absolute; left:44.4%; width:9.8%; top:0; bottom:0; background:rgba(16,185,129,0.28);" title="Deadzone ±200"></div>
              <div id="simAdcBar" style="width:49%; height:100%; background:#38bdf8;"></div>
            </div>
            <div class="sim-metrics">
              <div class="sim-metric"><span>analogRead()</span><strong id="simAdcRaw">2020</strong></div>
              <div class="sim-metric"><span>Điện áp GPIO</span><strong id="simAdcVolt">1.63 V</strong></div>
              <div class="sim-metric"><span>Lệnh Motor (Deadzone)</span><strong id="simAdcCmd" style="color:#10b981;">0 (Đứng yên)</strong></div>
            </div>
          </div>
        </div>
      `;
      const slider = document.getElementById('simAdcSlider');
      const bar = document.getElementById('simAdcBar');
      const rawEl = document.getElementById('simAdcRaw');
      const voltEl = document.getElementById('simAdcVolt');
      const cmdEl = document.getElementById('simAdcCmd');

      const updateAdc = () => {
        const raw = Number(slider.value);
        const volt = (raw * 3.3) / 4095;
        const center = 2020;
        const dz = 200;
        let cmd = 0;
        if (raw <= center - dz) {
          cmd = Math.round(((raw - (center - dz)) / (center - dz)) * 255);
        } else if (raw >= center + dz) {
          cmd = Math.round(((raw - (center + dz)) / (4095 - (center + dz))) * 255);
        }
        bar.style.width = `${(raw / 4095) * 100}%`;
        rawEl.textContent = raw;
        voltEl.textContent = `${volt.toFixed(2)} V`;
        cmdEl.textContent = cmd === 0 ? '0 (Vùng chết)' : `${cmd > 0 ? '+' : ''}${cmd}`;
        cmdEl.style.color = cmd === 0 ? '#10b981' : '#38bdf8';
      };

      slider.addEventListener('input', updateAdc);
      document.getElementById('simAdcCenterBtn').addEventListener('click', () => {
        slider.value = 2020 + Math.round((Math.random() - 0.5) * 90);
        updateAdc();
      });
    } else if (type === 'pwm-servo') {
      container.innerHTML = `
        <div class="sim-box">
          <div class="sim-stage">
            <svg width="160" height="90" viewBox="0 0 160 90">
              <path d="M 20 75 A 60 60 0 0 1 140 75" fill="none" stroke="#334155" stroke-width="8" stroke-linecap="round" />
              <g id="simServoArm" transform="translate(80,75) rotate(0)">
                <line x1="0" y1="0" x2="-52" y2="0" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" />
                <circle cx="0" cy="0" r="8" fill="#f8fafc" stroke="#0284c7" stroke-width="2" />
              </g>
            </svg>
            <div class="sim-controls-row">
              <span style="font-size:12px; font-weight:700;">Góc Servo (0°–180°):</span>
              <input id="simServoSlider" class="sim-slider" type="range" min="0" max="180" value="90" />
            </div>
            <div class="sim-metrics">
              <div class="sim-metric"><span>Góc đặt</span><strong id="simServoDeg">90°</strong></div>
              <div class="sim-metric"><span>Độ rộng xung (50Hz)</span><strong id="simServoUs">1450 µs</strong></div>
              <div class="sim-metric"><span>Duty Cycle LED</span><strong id="simServoDuty">50% (128)</strong></div>
            </div>
          </div>
        </div>
      `;
      const slider = document.getElementById('simServoSlider');
      const arm = document.getElementById('simServoArm');
      const degEl = document.getElementById('simServoDeg');
      const usEl = document.getElementById('simServoUs');
      const dutyEl = document.getElementById('simServoDuty');

      const updateServo = () => {
        const deg = Number(slider.value);
        const us = Math.round(500 + (deg / 180) * 1900);
        const pwm = Math.round((deg / 180) * 255);
        arm.setAttribute('transform', `translate(80,75) rotate(${deg})`);
        degEl.textContent = `${deg}°`;
        usEl.textContent = `${us} µs`;
        dutyEl.textContent = `${Math.round((deg / 180) * 100)}% (${pwm})`;
      };
      slider.addEventListener('input', updateServo);
      updateServo();
    } else if (type === 'ultrasonic-pir') {
      container.innerHTML = `
        <div class="sim-box">
          <div class="sim-stage">
            <div class="sim-controls-row">
              <span style="font-size:12px; font-weight:700;">Kéo khoảng cách vật cản:</span>
              <input id="simDistSlider" class="sim-slider" type="range" min="3" max="200" value="35" />
            </div>
            <div class="sim-metrics">
              <div class="sim-metric"><span>Khoảng cách</span><strong id="simDistCm">35.0 cm</strong></div>
              <div class="sim-metric"><span>Thời gian pulseIn()</span><strong id="simDistUs">2041 µs</strong></div>
              <div class="sim-metric"><span>Cảnh báo (&lt;20cm)</span><strong id="simDistAlert" style="color:#10b981;">An toàn</strong></div>
            </div>
          </div>
        </div>
      `;
      const slider = document.getElementById('simDistSlider');
      const cmEl = document.getElementById('simDistCm');
      const usEl = document.getElementById('simDistUs');
      const alertEl = document.getElementById('simDistAlert');
      const update = () => {
        const cm = Number(slider.value);
        const us = Math.round((cm * 2) / 0.0343);
        cmEl.textContent = `${cm.toFixed(1)} cm`;
        usEl.textContent = `${us} µs`;
        alertEl.textContent = cm < 20 ? '🚨 VẬT CẢN GẦN!' : 'An toàn ✓';
        alertEl.style.color = cm < 20 ? '#ef4444' : '#10b981';
      };
      slider.addEventListener('input', update);
    } else if (type === 'i2c-display') {
      container.innerHTML = `
        <div class="sim-box">
          <div class="sim-stage">
            <div style="width:230px; padding:12px; border-radius:8px; background:#020617; border:2px solid #0ea5e9; font-family:var(--font-mono); color:#38bdf8;">
              <div style="font-size:10px; opacity:0.7;">OLED SSD1306 (0x3C)</div>
              <div id="simOledText" style="font-size:14px; font-weight:800; color:#e0f2fe; margin-top:4px;">ESP32 Ready!</div>
            </div>
            <div class="sim-controls-row">
              <input id="simOledInput" type="text" value="ESP32 Ready!" maxlength="20"
                     style="flex:1; padding:6px 10px; border-radius:7px; border:1px solid var(--border-subtle); background:var(--bg-surface); color:var(--text-primary); font-family:var(--font-mono); font-size:12px;" />
            </div>
          </div>
        </div>
      `;
      document.getElementById('simOledInput').addEventListener('input', (e) => {
        document.getElementById('simOledText').textContent = e.target.value || ' ';
      });
    } else if (type === 'drv8833-motor') {
      container.innerHTML = `
        <div class="sim-box">
          <div class="sim-stage">
            <div class="sim-controls-row">
              <label class="mini-check"><input type="checkbox" id="simStbyToggle" checked /><span>Chân STBY = HIGH (Bật mạch)</span></label>
              <span style="font-size:12px; font-weight:700;">PWM:</span>
              <input id="simMotorSlider" class="sim-slider" type="range" min="-255" max="255" value="180" />
            </div>
            <div class="sim-metrics">
              <div class="sim-metric"><span>AIN1 / AIN2</span><strong id="simMotorPins">180 / 0</strong></div>
              <div class="sim-metric"><span>Chiều quay</span><strong id="simMotorDir">Tiến ↻</strong></div>
              <div class="sim-metric"><span>Tốc độ</span><strong id="simMotorPct">71%</strong></div>
            </div>
          </div>
        </div>
      `;
      const stby = document.getElementById('simStbyToggle');
      const slider = document.getElementById('simMotorSlider');
      const pinsEl = document.getElementById('simMotorPins');
      const dirEl = document.getElementById('simMotorDir');
      const pctEl = document.getElementById('simMotorPct');

      const update = () => {
        if (!stby.checked) {
          pinsEl.textContent = 'NGỦ (STBY=0)';
          dirEl.textContent = 'Đứng im (Sleep)';
          dirEl.style.color = '#f97316';
          pctEl.textContent = '0%';
          return;
        }
        const sp = Number(slider.value);
        if (sp > 0) {
          pinsEl.textContent = `${sp} / 0`;
          dirEl.textContent = 'Quay Thuận ↻';
          dirEl.style.color = '#10b981';
        } else if (sp < 0) {
          pinsEl.textContent = `0 / ${-sp}`;
          dirEl.textContent = 'Quay Ngược ↺';
          dirEl.style.color = '#38bdf8';
        } else {
          pinsEl.textContent = '0 / 0';
          dirEl.textContent = 'Dừng (Coast)';
          dirEl.style.color = '#94a3b8';
        }
        pctEl.textContent = `${Math.round((Math.abs(sp) / 255) * 100)}%`;
      };
      stby.addEventListener('change', update);
      slider.addEventListener('input', update);
    } else if (type === 'deep-sleep-wifi') {
      container.innerHTML = `
        <div class="sim-box">
          <div class="sim-stage">
            <div class="sim-controls-row" style="justify-content:center;">
              <button id="simSleepBtn" class="sim-btn active">🌙 Chế độ: Đang chạy Wi-Fi</button>
            </div>
            <div class="sim-metrics">
              <div class="sim-metric"><span>Dòng tiêu thụ</span><strong id="simSleepCurr" style="color:#f97316;">~160 mA</strong></div>
              <div class="sim-metric"><span>Thời lượng Pin 2000mAh</span><strong id="simSleepBat">~12 giờ</strong></div>
              <div class="sim-metric"><span>RAM giữ lại</span><strong id="simSleepMem">Toàn bộ SRAM</strong></div>
            </div>
          </div>
        </div>
      `;
      let sleeping = false;
      const btn = document.getElementById('simSleepBtn');
      const currEl = document.getElementById('simSleepCurr');
      const batEl = document.getElementById('simSleepBat');
      const memEl = document.getElementById('simSleepMem');
      btn.addEventListener('click', () => {
        sleeping = !sleeping;
        btn.textContent = sleeping ? '⚡ Bấm đánh thức (RTC GPIO33)' : '🌙 Chuyển sang Deep Sleep';
        btn.classList.toggle('active', !sleeping);
        currEl.textContent = sleeping ? '~0.02 mA (20 µA)' : '~160 mA';
        currEl.style.color = sleeping ? '#10b981' : '#f97316';
        batEl.textContent = sleeping ? '> 3 năm!' : '~12 giờ';
        memEl.textContent = sleeping ? 'Chỉ RTC_DATA_ATTR' : 'Toàn bộ SRAM';
      });
    } else if (type === 'led-traffic') {
      container.innerHTML = `
        <div class="sim-box">
          <div class="sim-stage">
            <div style="display:flex; gap:14px; padding:10px 18px; background:#090d14; border-radius:14px; border:1px solid var(--border-subtle);">
              <div id="simTlRed" class="sim-led-bulb on" style="width:36px; height:36px;"></div>
              <div id="simTlYellow" class="sim-led-bulb" style="width:36px; height:36px;"></div>
              <div id="simTlGreen" class="sim-led-bulb" style="width:36px; height:36px;"></div>
            </div>
            <div class="sim-metrics">
              <div class="sim-metric"><span>Đèn hiện tại</span><strong id="simTlPhase" style="color:#ef4444;">ĐỎ (Dừng)</strong></div>
              <div class="sim-metric"><span>GPIO Active</span><strong id="simTlPins">16:H 17:L 18:L</strong></div>
              <div class="sim-metric"><span>Chu kỳ</span><strong>Tự động</strong></div>
            </div>
          </div>
        </div>
      `;
      const phases = [
        { name: 'ĐỎ (Dừng)', color: '#ef4444', r: 1, y: 0, g: 0, pins: '16:H 17:L 18:L' },
        { name: 'XANH (Đi)', color: '#10b981', r: 0, y: 0, g: 1, pins: '16:L 17:L 18:H' },
        { name: 'VÀNG (Chậm)', color: '#eab308', r: 0, y: 1, g: 0, pins: '16:L 17:H 18:L' },
      ];
      let idx = 0;
      const elR = document.getElementById('simTlRed');
      const elY = document.getElementById('simTlYellow');
      const elG = document.getElementById('simTlGreen');
      const elPhase = document.getElementById('simTlPhase');
      const elPins = document.getElementById('simTlPins');

      const applyPhase = () => {
        const p = phases[idx];
        elR.style.background = p.r ? '#ef4444' : '#334155';
        elR.style.boxShadow = p.r ? '0 0 20px rgba(239,68,68,0.85)' : 'none';
        elY.style.background = p.y ? '#eab308' : '#334155';
        elY.style.boxShadow = p.y ? '0 0 20px rgba(234,179,8,0.85)' : 'none';
        elG.style.background = p.g ? '#22c55e' : '#334155';
        elG.style.boxShadow = p.g ? '0 0 20px rgba(34,197,94,0.85)' : 'none';
        elPhase.textContent = p.name;
        elPhase.style.color = p.color;
        elPins.textContent = p.pins;
      };
      applyPhase();
      exState.simTimer = setInterval(() => {
        idx = (idx + 1) % phases.length;
        applyPhase();
      }, 1400);
    } else if (type === 'button-hold') {
      container.innerHTML = `
        <div class="sim-box">
          <div class="sim-stage">
            <button id="simHoldBtn" class="sim-btn" style="padding:12px 22px; font-size:13.5px;">👆 Nhấn nhanh hoặc Nhấn giữ 1.5s</button>
            <div class="sim-metrics">
              <div class="sim-metric"><span>Thời gian giữ</span><strong id="simHoldMs">0 ms</strong></div>
              <div class="sim-metric"><span>Sự kiện nhận</span><strong id="simHoldEvt" style="color:var(--accent);">Chờ bấm...</strong></div>
              <div class="sim-metric"><span>Trạng thái LED</span><strong id="simHoldLed">TẮT</strong></div>
            </div>
          </div>
        </div>
      `;
      const btn = document.getElementById('simHoldBtn');
      const msEl = document.getElementById('simHoldMs');
      const evtEl = document.getElementById('simHoldEvt');
      const ledEl = document.getElementById('simHoldLed');
      let downAt = 0;
      let holdInt = null;
      let longTriggered = false;
      let ledOn = false;

      btn.addEventListener('pointerdown', () => {
        downAt = performance.now();
        longTriggered = false;
        btn.classList.add('active');
        clearInterval(holdInt);
        holdInt = setInterval(() => {
          const dt = Math.round(performance.now() - downAt);
          msEl.textContent = `${dt} ms`;
          if (dt >= 1500 && !longTriggered) {
            longTriggered = true;
            evtEl.textContent = '🔥 LONG PRESS!';
            evtEl.style.color = '#f97316';
            ledEl.textContent = 'RESET WIFI!';
          }
        }, 50);
      });
      const release = () => {
        if (!downAt) return;
        clearInterval(holdInt);
        btn.classList.remove('active');
        const dt = Math.round(performance.now() - downAt);
        downAt = 0;
        if (!longTriggered && dt >= 30) {
          ledOn = !ledOn;
          evtEl.textContent = '👆 SHORT PRESS!';
          evtEl.style.color = '#10b981';
          ledEl.textContent = ledOn ? 'BẬT (HIGH)' : 'TẮT (LOW)';
        }
      };
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointerleave', release);
    } else if (type === 'ldr-divider') {
      container.innerHTML = `
        <div class="sim-box">
          <div class="sim-stage">
            <div class="sim-controls-row">
              <span style="font-size:12px; font-weight:700;">Ánh sáng môi trường:</span>
              <input id="simLdrSlider" class="sim-slider" type="range" min="200" max="3800" value="2200" />
            </div>
            <div class="sim-metrics">
              <div class="sim-metric"><span>ADC Quang trở</span><strong id="simLdrVal">2200</strong></div>
              <div class="sim-metric"><span>Vùng trễ (1300–1700)</span><strong id="simLdrZone">Sáng (>1700)</strong></div>
              <div class="sim-metric"><span>Đèn đường</span><strong id="simLdrLamp">TẮT</strong></div>
            </div>
          </div>
        </div>
      `;
      const slider = document.getElementById('simLdrSlider');
      const valEl = document.getElementById('simLdrVal');
      const zoneEl = document.getElementById('simLdrZone');
      const lampEl = document.getElementById('simLdrLamp');
      let lampOn = false;
      slider.addEventListener('input', () => {
        const v = Number(slider.value);
        valEl.textContent = v;
        if (!lampOn && v < 1300) lampOn = true;
        else if (lampOn && v > 1700) lampOn = false;

        zoneEl.textContent = v < 1300 ? 'Tối (<1300)' : v > 1700 ? 'Sáng (>1700)' : 'Giữ trạng thái';
        lampEl.textContent = lampOn ? '💡 BẬT ĐÈN' : 'TẮT';
        lampEl.style.color = lampOn ? '#eab308' : '#94a3b8';
      });
    } else if (type === 'buzzer-pwm') {
      container.innerHTML = `
        <div class="sim-box">
          <div class="sim-stage">
            <div class="sim-controls-row">
              <span style="font-size:12px; font-weight:700;">Tần số Buzzer (Hz):</span>
              <input id="simBuzzSlider" class="sim-slider" type="range" min="200" max="1200" value="440" />
            </div>
            <div class="sim-metrics">
              <div class="sim-metric"><span>Tần số tone()</span><strong id="simBuzzHz">440 Hz</strong></div>
              <div class="sim-metric"><span>Nốt nhạc gần nhất</span><strong id="simBuzzNote">La (A4)</strong></div>
              <div class="sim-metric"><span>Chu kỳ sóng</span><strong id="simBuzzMs">2.27 ms</strong></div>
            </div>
          </div>
        </div>
      `;
      const slider = document.getElementById('simBuzzSlider');
      const hzEl = document.getElementById('simBuzzHz');
      const noteEl = document.getElementById('simBuzzNote');
      const msEl = document.getElementById('simBuzzMs');
      slider.addEventListener('input', () => {
        const f = Number(slider.value);
        hzEl.textContent = `${f} Hz`;
        msEl.textContent = `${(1000 / f).toFixed(2)} ms`;
        noteEl.textContent = f < 280 ? 'Đô (C4)' : f < 340 ? 'Rê/Mi' : f < 420 ? 'Fa/Sol' : f < 510 ? 'La/Si' : 'Quãng cao';
      });
    } else if (type === 'millis-dual') {
      container.innerHTML = `
        <div class="sim-box">
          <div class="sim-stage">
            <div class="sim-controls-row" style="justify-content:center; gap:18px;">
              <div style="text-align:center;">
                <div id="simM1" class="sim-led-bulb" style="width:34px;height:34px;margin:0 auto 4px;"></div>
                <span style="font-size:11px; color:var(--text-secondary);">LED1 (250ms)</span>
              </div>
              <div style="text-align:center;">
                <div id="simM2" class="sim-led-bulb" style="width:34px;height:34px;margin:0 auto 4px;"></div>
                <span style="font-size:11px; color:var(--text-secondary);">LED2 (1000ms)</span>
              </div>
              <button id="simMBtn" class="sim-btn">🔘 Bấm test độ trễ (0ms!)</button>
            </div>
            <div class="sim-metrics">
              <div class="sim-metric"><span>millis() chạy</span><strong id="simMClock">0 ms</strong></div>
              <div class="sim-metric"><span>Phản hồi nút</span><strong id="simMResp" style="color:#10b981;">Tức thì 0ms</strong></div>
              <div class="sim-metric"><span>Kiểu lập trình</span><strong>Non-blocking ✓</strong></div>
            </div>
          </div>
        </div>
      `;
      const m1 = document.getElementById('simM1');
      const m2 = document.getElementById('simM2');
      const clk = document.getElementById('simMClock');
      const resp = document.getElementById('simMBtn');
      const respEl = document.getElementById('simMResp');
      let t = 0;
      let s1 = false, s2 = false;
      exState.simTimer = setInterval(() => {
        t += 250;
        s1 = !s1;
        if (t % 1000 === 0) s2 = !s2;
        m1.classList.toggle('on', s1);
        m2.classList.toggle('on', s2);
        clk.textContent = `${t} ms`;
      }, 250);
      resp.addEventListener('click', () => {
        respEl.textContent = `Ăn ngay tại ${t}ms!`;
      });
    } else if (type === 'relay-sim') {
      container.innerHTML = `
        <div class="sim-box">
          <div class="sim-stage">
            <div class="sim-controls-row" style="justify-content:center;">
              <button id="simRelayBtn" class="sim-btn">⚡ Kích GPIO26 = LOW (ĐÓNG Relay)</button>
            </div>
            <div class="sim-metrics">
              <div class="sim-metric"><span>Chân IN (Active LOW)</span><strong id="simRelayIn">HIGH (3.3V)</strong></div>
              <div class="sim-metric"><span>Tiếp điểm COM–NO</span><strong id="simRelayNo" style="color:#94a3b8;">Đang HỞ</strong></div>
              <div class="sim-metric"><span>Tải 220V / Bơm</span><strong id="simRelayLoad">TẮT</strong></div>
            </div>
          </div>
        </div>
      `;
      let closed = false;
      const btn = document.getElementById('simRelayBtn');
      const inEl = document.getElementById('simRelayIn');
      const noEl = document.getElementById('simRelayNo');
      const loadEl = document.getElementById('simRelayLoad');
      btn.addEventListener('click', () => {
        closed = !closed;
        btn.classList.toggle('active', closed);
        btn.textContent = closed ? '🔌 Đặt GPIO26 = HIGH (NHẢ Relay)' : '⚡ Kích GPIO26 = LOW (ĐÓNG Relay)';
        inEl.textContent = closed ? 'LOW (0V)' : 'HIGH (3.3V)';
        noEl.textContent = closed ? 'ĐÃ ĐÓNG (Tạch!)' : 'Đang HỞ';
        noEl.style.color = closed ? '#10b981' : '#94a3b8';
        loadEl.textContent = closed ? '💡 ĐANG BẬT' : 'TẮT';
        loadEl.style.color = closed ? '#eab308' : '#94a3b8';
      });
    }
  }

  function renderExercisesView() {
    clearSimulatorTimer();
    renderExercisesSidebar();

    if (exState.mode === 'concept') {
      const concept = CORE_CONCEPTS.find((c) => c.id === exState.selectedId) || CORE_CONCEPTS[0];
      const paragraphs = concept.body
        .map((p) => `<p style="font-size:13.8px; line-height:1.7; color:var(--text-primary); margin-bottom:10px;">${formatRichText(p)}</p>`)
        .join('');

      elExContentArea.innerHTML = `
        <div class="ex-container">
          <div class="ex-hero-card">
            <div class="ex-hero-badges">
              <span class="ex-pill-primary">${concept.icon} ${escapeHtml(concept.badge)}</span>
              <span class="ex-pill-soft">Kiến thức nền tảng quan trọng</span>
            </div>
            <h2>${escapeHtml(concept.title)}</h2>
            <p>${formatRichText(concept.summary)}</p>
          </div>

          <div class="ex-panel">
            <h3>🔍 Giải thích chi tiết bản chất</h3>
            ${paragraphs}
            ${concept.formula ? `<div class="formula-banner">📐 ${formatRichText(concept.formula)}</div>` : ''}
            <div class="warning-item is-safe-note" style="margin-top:12px;">
              <span class="warning-bullet">💡</span>
              <span><strong>Mẹo thực chiến:</strong> ${formatRichText(concept.tip)}</span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const exIdx = Math.max(0, ESP32_EXERCISES.findIndex((e) => e.id === exState.selectedId));
    const ex = ESP32_EXERCISES[exIdx] || ESP32_EXERCISES[0];
    const prevEx = exIdx > 0 ? ESP32_EXERCISES[exIdx - 1] : null;
    const nextEx = exIdx < ESP32_EXERCISES.length - 1 ? ESP32_EXERCISES[exIdx + 1] : null;
    const isCompleted = exState.completedIds.has(ex.id);

    const compButtons = (ex.componentsUsed || [])
      .map((cid) => {
        const comp = ESP32_COMPONENTS.find((c) => c.id === cid);
        if (!comp) return '';
        return `<button class="ex-comp-link-btn" data-open-comp="${comp.id}">📦 Xem Datasheet 3D: ${escapeHtml(comp.shortName)}</button>`;
      })
      .join('');

    const goalsHtml = ex.learningGoals
      .map((g) => `<div class="ex-goal-item">${formatRichText(g)}</div>`)
      .join('');

    const deepHtml = ex.deepExplanations
      .map(
        (d) => `
        <div class="deep-card">
          <h4>💡 ${formatRichText(d.title)}</h4>
          <p>${formatRichText(d.content)}</p>
        </div>
      `
      )
      .join('');

    const wiringRows = ex.wiringSteps
      .map(
        (w) => `
        <tr>
          <td class="ds-mono">${escapeHtml(w.from)}</td>
          <td class="ds-mono">${escapeHtml(w.to)}</td>
          <td>${formatRichText(w.detail)}</td>
        </tr>
      `
      )
      .join('');

    const breakdownHtml = ex.codeBreakdown
      .map(
        (b) => `
        <div class="breakdown-item">
          <code>${escapeHtml(b.line)}</code>
          <span>${formatRichText(b.explain)}</span>
        </div>
      `
      )
      .join('');

    const drillsHtml = (ex.practiceDrills || [])
      .map(
        (dr, dIdx) => `
        <div class="drill-card">
          <span class="drill-level-badge">${escapeHtml(dr.level)}</span>
          <div class="drill-task">${formatRichText(dr.task)}</div>
          <details class="drill-details">
            <summary>💡 Xem gợi ý &amp; Đáp án mẫu</summary>
            <div class="drill-details-body">
              <div class="drill-hint"><strong>Gợi ý:</strong> ${formatRichText(dr.hint)}</div>
              ${
                dr.answerCode
                  ? `<div class="code-box"><pre><code>${escapeHtml(dr.answerCode)}</code></pre></div>
                     <div><button class="copy-code-btn drill-copy-btn" data-drill-idx="${dIdx}">📋 Sao chép gợi ý code</button></div>`
                  : ''
              }
            </div>
          </details>
        </div>
      `
      )
      .join('');

    elExContentArea.innerHTML = `
      <div class="ex-container">
        <div class="ex-hero-card">
          <div class="ex-hero-badges">
            <span class="ex-pill-primary">${escapeHtml(ex.number)}</span>
            <span class="ex-pill-soft">${escapeHtml(ex.level)}</span>
            <span class="ex-pill-soft">⏱️ ${escapeHtml(ex.duration)}</span>
            ${isCompleted ? '<span class="ex-done-check">✓ Đã nắm vững</span>' : ''}
          </div>
          <h2>${escapeHtml(ex.title)}</h2>
          <p>${formatRichText(ex.summary)}</p>
          <div class="ex-goals-list">${goalsHtml}</div>
          ${compButtons ? `<div class="ex-comp-links">${compButtons}</div>` : ''}
        </div>

        <div class="ex-grid-2">
          <div class="ex-panel">
            <h3>🔌 Sơ đồ đấu dây trực quan</h3>
            ${renderExerciseWiringSVG(ex)}
          </div>
          <div class="ex-panel">
            <h3>🎛️ Mô phỏng tương tác trực tiếp</h3>
            <div id="exSimMount"></div>
          </div>
        </div>

        <div class="ex-panel">
          <h3>🧠 Giải thích chuyên sâu những nội dung quan trọng</h3>
          <div class="deep-cards">${deepHtml}</div>
        </div>

        <div class="ex-panel">
          <h3>📋 Bảng hướng dẫn nối dây chi tiết</h3>
          <table class="ds-wiring-table">
            <thead><tr><th>Từ đầu nối</th><th>Tới chân đích</th><th>Lý do / Lưu ý</th></tr></thead>
            <tbody>${wiringRows}</tbody>
          </table>
        </div>

        <div class="ex-panel">
          <h3>
            <span>💻 Code mẫu hoàn chỉnh &amp; Giải phẫu từng lệnh</span>
            <button id="copyExCodeBtn" class="copy-code-btn">📋 Sao chép code</button>
          </h3>
          <div class="code-box"><pre><code>${escapeHtml(ex.code)}</code></pre></div>
          <div class="breakdown-list">${breakdownHtml}</div>
        </div>

        ${
          drillsHtml
            ? `<div class="ex-panel">
                <h3>🏋️ Luyện tập nhuần nhuyễn (3 Cấp độ trước khi qua bài mới)</h3>
                <div class="drills-grid">${drillsHtml}</div>
              </div>`
            : ''
        }

        <div class="ex-footer-nav">
          <button id="exPrevBtn" class="ex-nav-action-btn" ${prevEx ? '' : 'disabled'}>
            ${prevEx ? `← ${escapeHtml(prevEx.number)}` : '← Bài đầu tiên'}
          </button>
          <button id="exToggleDoneBtn" class="ex-complete-btn ${isCompleted ? 'is-done' : ''}">
            ${isCompleted ? '✓ Đã hoàn thành bài này' : '✓ Đánh dấu đã nắm vững bài này'}
          </button>
          <button id="exNextBtn" class="ex-nav-action-btn" ${nextEx ? '' : 'disabled'}>
            ${nextEx ? `${escapeHtml(nextEx.number)} →` : 'Đã hết lộ trình 🎉'}
          </button>
        </div>
      </div>
    `;

    // Wire cross-link buttons to open Datasheet 3D directly!
    elExContentArea.querySelectorAll('[data-open-comp]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cid = btn.getAttribute('data-open-comp');
        compState.selectedId = cid;
        compState.selectedPinId = null;
        compState.hoveredPinId = null;
        switchMainMode('components');
      });
    });

    const copyBtn = document.getElementById('copyExCodeBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => copyToClipboard(ex.code));
    }

    elExContentArea.querySelectorAll('.drill-copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-drill-idx'));
        const drill = (ex.practiceDrills || [])[idx];
        if (drill && drill.answerCode) copyToClipboard(drill.answerCode);
      });
    });

    const prevBtn = document.getElementById('exPrevBtn');
    if (prevBtn && prevEx) {
      prevBtn.addEventListener('click', () => {
        exState.selectedId = prevEx.id;
        renderExercisesView();
        elExContentArea.scrollTop = 0;
      });
    }

    const nextBtn = document.getElementById('exNextBtn');
    if (nextBtn && nextEx) {
      nextBtn.addEventListener('click', () => {
        exState.selectedId = nextEx.id;
        renderExercisesView();
        elExContentArea.scrollTop = 0;
      });
    }

    const doneBtn = document.getElementById('exToggleDoneBtn');
    if (doneBtn) {
      doneBtn.addEventListener('click', () => {
        if (exState.completedIds.has(ex.id)) {
          exState.completedIds.delete(ex.id);
        } else {
          exState.completedIds.add(ex.id);
          showToast(`✓ Đã đánh dấu hoàn thành ${ex.number}!`);
        }
        saveCompletedLabs(exState.completedIds);
        renderExercisesView();
      });
    }

    const simMount = document.getElementById('exSimMount');
    if (simMount) {
      setupExerciseSimulator(ex, simMount);
    }
  }

  renderAll();
})();
