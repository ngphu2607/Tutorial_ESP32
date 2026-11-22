/**
 * Interactive 3D Studio Engine cho ESP32 Component Datasheet Viewer
 * - Bệ xoay kỹ thuật 3D (Turntable Podium) + Bóng đổ tiếp xúc (Contact Shadow)
 * - Trục tọa độ 3D mini (X-Y-Z) + Nút góc nhìn nhanh mượt (Smooth Camera Presets)
 * - Ánh sáng đa nguồn (Key + Rim Light + Specular Highlight theo vật liệu)
 * - Chữ Silkscreen 3D chiếu trực tiếp lên mặt linh kiện + Nhãn chân chống chồng chéo
 */

(function (global) {
  'use strict';

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const n = parseInt(clean, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function shadeMaterial(hex, nDotL, rim, spec, material = 'plastic', alpha = 1, unlit = false) {
    const [r, g, b] = hexToRgb(hex);
    if (unlit) {
      return alpha < 1 ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
    }

    let ambient = 0.36;
    let diffuseGain = 0.72;
    let specGain = 0.14;
    let specPower = 14;
    let rimGain = 0.14;

    if (material === 'metal') {
      ambient = 0.44;
      diffuseGain = 0.65;
      specGain = 0.55;
      specPower = 26;
      rimGain = 0.24;
    } else if (material === 'glass') {
      ambient = 0.45;
      diffuseGain = 0.55;
      specGain = 0.65;
      specPower = 36;
      rimGain = 0.32;
    } else if (material === 'pcb') {
      ambient = 0.38;
      diffuseGain = 0.7;
      specGain = 0.22;
      specPower = 18;
      rimGain = 0.16;
    } else if (material === 'copper') {
      ambient = 0.42;
      diffuseGain = 0.66;
      specGain = 0.48;
      specPower = 22;
      rimGain = 0.2;
    }

    const baseScale = ambient + diffuseGain * nDotL;
    const specTerm = Math.pow(Math.max(0, spec), specPower) * specGain * 255;
    const rimTerm = Math.pow(Math.max(0, rim), 2.2) * rimGain;

    const rr = clamp(Math.round(r * baseScale + specTerm + 56 * rimTerm), 0, 255);
    const gg = clamp(Math.round(g * baseScale + specTerm + 189 * rimTerm), 0, 255);
    const bb = clamp(Math.round(b * baseScale + specTerm + 248 * rimTerm), 0, 255);

    return alpha < 1 ? `rgba(${rr},${gg},${bb},${alpha})` : `rgb(${rr},${gg},${bb})`;
  }

  function sub3(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }
  function cross3(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }
  function dot3(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function norm3(v) {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  function createBox(cx, cy, cz, w, h, d, color, options = {}) {
    const hw = w / 2;
    const hh = h / 2;
    const hd = d / 2;
    const v = [
      [cx - hw, cy - hh, cz - hd],
      [cx + hw, cy - hh, cz - hd],
      [cx + hw, cy + hh, cz - hd],
      [cx - hw, cy + hh, cz - hd],
      [cx - hw, cy - hh, cz + hd],
      [cx + hw, cy - hh, cz + hd],
      [cx + hw, cy + hh, cz + hd],
      [cx - hw, cy + hh, cz + hd],
    ];
    const sideColors = options.faceColors || {};
    const facesDef = [
      { idx: [4, 5, 6, 7], c: sideColors.front || color },
      { idx: [1, 0, 3, 2], c: sideColors.back || color },
      { idx: [0, 4, 7, 3], c: sideColors.left || color },
      { idx: [5, 1, 2, 6], c: sideColors.right || color },
      { idx: [3, 7, 6, 2], c: sideColors.top || color },
      { idx: [0, 1, 5, 4], c: sideColors.bottom || color },
    ];
    return facesDef.map((f) => ({
      verts: f.idx.map((i) => v[i]),
      color: f.c,
      alpha: options.alpha ?? 1,
      stroke: options.stroke !== undefined ? options.stroke : 'rgba(255,255,255,0.08)',
      material: options.material || 'plastic',
      unlit: !!options.unlit,
      doubleSided: !!options.doubleSided,
    }));
  }

  function createCylinder(cx, cy, cz, r, h, axis, segments, color, options = {}) {
    const faces = [];
    const half = h / 2;
    const ringA = [];
    const ringB = [];
    const rTop = options.rTop ?? r;

    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      if (axis === 'y') {
        ringA.push([cx + r * ca, cy - half, cz + r * sa]);
        ringB.push([cx + rTop * ca, cy + half, cz + rTop * sa]);
      } else if (axis === 'z') {
        ringA.push([cx + r * ca, cy + r * sa, cz - half]);
        ringB.push([cx + rTop * ca, cy + rTop * sa, cz + half]);
      } else {
        ringA.push([cx - half, cy + r * ca, cz + r * sa]);
        ringB.push([cx + half, cy + rTop * ca, cz + rTop * sa]);
      }
    }

    for (let i = 0; i < segments; i++) {
      const j = (i + 1) % segments;
      faces.push({
        verts: [ringA[i], ringA[j], ringB[j], ringB[i]],
        color,
        alpha: options.alpha ?? 1,
        stroke: options.stroke || null,
        material: options.material || 'plastic',
        doubleSided: !!options.doubleSided,
        unlit: !!options.unlit,
      });
    }

    if (!options.noCaps) {
      faces.push({
        verts: [...ringA].reverse(),
        color: options.capColor || color,
        alpha: options.alpha ?? 1,
        stroke: options.capStroke || options.stroke || null,
        material: options.capMaterial || options.material || 'plastic',
        unlit: !!options.unlit,
      });
      faces.push({
        verts: ringB,
        color: options.capColor || color,
        alpha: options.alpha ?? 1,
        stroke: options.capStroke || options.stroke || null,
        material: options.capMaterial || options.material || 'plastic',
        unlit: !!options.unlit,
      });
    }
    return faces;
  }

  function createHemisphere(cx, cy, cz, r, stacks, slices, color, options = {}) {
    const faces = [];
    for (let s = 0; s < stacks; s++) {
      const phi1 = (s / stacks) * (Math.PI / 2);
      const phi2 = ((s + 1) / stacks) * (Math.PI / 2);
      for (let i = 0; i < slices; i++) {
        const t1 = (i / slices) * Math.PI * 2;
        const t2 = ((i + 1) / slices) * Math.PI * 2;

        const p1 = [cx + r * Math.cos(phi1) * Math.cos(t1), cy + r * Math.sin(phi1), cz + r * Math.cos(phi1) * Math.sin(t1)];
        const p2 = [cx + r * Math.cos(phi1) * Math.cos(t2), cy + r * Math.sin(phi1), cz + r * Math.cos(phi1) * Math.sin(t2)];
        const p3 = [cx + r * Math.cos(phi2) * Math.cos(t2), cy + r * Math.sin(phi2), cz + r * Math.cos(phi2) * Math.sin(t2)];
        const p4 = [cx + r * Math.cos(phi2) * Math.cos(t1), cy + r * Math.sin(phi2), cz + r * Math.cos(phi2) * Math.sin(t1)];

        faces.push({
          verts: [p1, p2, p3, p4],
          color,
          alpha: options.alpha ?? 1,
          stroke: options.stroke || null,
          material: options.material || 'plastic',
          doubleSided: !!options.doubleSided,
        });
      }
    }
    return faces;
  }

  function addPinHeaderRow(faces, startX, y, z, count, stepX, pinLen = 0.52) {
    for (let i = 0; i < count; i++) {
      const x = startX + i * stepX;
      faces.push(...createBox(x, y + 0.08, z, 0.14, 0.14, 0.14, '#0f172a', { material: 'plastic' }));
      faces.push(...createBox(x, y - pinLen / 2, z, 0.052, pinLen, 0.052, '#fbbf24', { material: 'metal' }));
    }
  }

  function rotatePoint(p, yaw, pitch) {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);

    const x1 = p[0] * cy + p[2] * sy;
    const y1 = p[1];
    const z1 = -p[0] * sy + p[2] * cy;

    const x2 = x1;
    const y2 = y1 * cp - z1 * sp;
    const z2 = y1 * sp + z1 * cp;

    return [x2, y2, z2];
  }

  // =========================================================================
  // ENHANCED COMPONENT 3D GEOMETRY + 3D SILKSCREEN LABELS
  // =========================================================================
  function buildComponentScene(type, timeSec) {
    const faces = [];
    const silkLabels = []; // { pos: [x,y,z], text, color, size, normal: [nx,ny,nz] }
    let glowEffect = null; // optional screen-space glow

    switch (type) {
      case 'led-resistor': {
        const pulse = 0.45 + 0.55 * Math.sin(timeSec * 3.0);
        const ledColor = pulse > 0.32 ? '#ef4444' : '#b91c1c';
        // Internal metallic cathode anvil (big flag) & anode post (small) visible through translucent lens
        faces.push(...createBox(-0.38, 0.42, 0, 0.06, 0.56, 0.05, '#cbd5e1', { material: 'metal' }));
        faces.push(...createBox(-0.02, 0.45, 0, 0.16, 0.52, 0.06, '#e2e8f0', { material: 'metal' }));
        // Inner emitting semiconductor die
        faces.push(...createBox(-0.18, 0.66, 0, 0.12, 0.12, 0.12, '#fef08a', { unlit: true }));

        // Translucent glossy 5mm LED lens
        faces.push(...createCylinder(-0.2, 0.06, 0, 0.54, 0.2, 'y', 20, ledColor, { alpha: 0.78, material: 'glass' }));
        faces.push(...createCylinder(-0.2, 0.52, 0, 0.45, 0.72, 'y', 20, ledColor, { alpha: 0.62, material: 'glass', doubleSided: true }));
        faces.push(...createHemisphere(-0.2, 0.88, 0, 0.45, 5, 20, '#f87171', { alpha: 0.64, material: 'glass', doubleSided: true }));

        // Anode (+) Long leg & Cathode (-) Short leg
        faces.push(...createBox(-0.38, -0.68, 0, 0.065, 1.32, 0.065, '#e2e8f0', { material: 'metal' }));
        faces.push(...createBox(-0.02, -0.56, 0, 0.065, 1.08, 0.065, '#94a3b8', { material: 'metal' }));

        // 220 Ohm Ceramic Resistor with rounded end caps & crisp 4 bands
        faces.push(...createCylinder(1.25, 0.32, 0, 0.21, 0.78, 'y', 16, '#e7c697', { material: 'plastic' }));
        faces.push(...createCylinder(1.25, 0.68, 0, 0.255, 0.2, 'y', 16, '#e7c697', { material: 'plastic' }));
        faces.push(...createCylinder(1.25, -0.04, 0, 0.255, 0.2, 'y', 16, '#e7c697', { material: 'plastic' }));
        faces.push(...createCylinder(1.25, 0.52, 0, 0.222, 0.085, 'y', 16, '#dc2626', { material: 'plastic' }));
        faces.push(...createCylinder(1.25, 0.36, 0, 0.222, 0.085, 'y', 16, '#dc2626', { material: 'plastic' }));
        faces.push(...createCylinder(1.25, 0.2, 0, 0.222, 0.085, 'y', 16, '#78350f', { material: 'plastic' }));
        faces.push(...createCylinder(1.25, -0.01, 0, 0.264, 0.07, 'y', 16, '#fbbf24', { material: 'metal' }));
        // Bent top & bottom wire leads
        faces.push(...createBox(1.25, 1.0, 0, 0.055, 0.54, 0.055, '#cbd5e1', { material: 'metal' }));
        faces.push(...createBox(1.25, -0.46, 0, 0.055, 0.74, 0.055, '#cbd5e1', { material: 'metal' }));

        glowEffect = { pos: [-0.2, 0.65, 0], color: '#ef4444', intensity: pulse };
        silkLabels.push({ pos: [1.25, 0.32, 0.29], text: '220Ω', color: '#fef3c7', size: 10 });
        break;
      }

      case 'push-button': {
        const pressOffset = Math.sin(timeSec * 3.0) > 0.62 ? -0.11 : 0;
        faces.push(...createBox(0, 0, 0, 1.38, 0.42, 1.38, '#1e293b', { material: 'plastic' }));
        faces.push(...createBox(0, 0.23, 0, 1.32, 0.06, 1.32, '#cbd5e1', { material: 'metal' }));
        // 4 corner brass/dark rivets holding metallic bezel
        [
          [-0.48, -0.48],
          [0.48, -0.48],
          [-0.48, 0.48],
          [0.48, 0.48],
        ].forEach(([rx, rz]) => {
          faces.push(...createCylinder(rx, 0.27, rz, 0.09, 0.04, 'y', 10, '#334155', { material: 'metal' }));
        });
        // Tactile circular cap
        faces.push(...createCylinder(0, 0.45 + pressOffset, 0, 0.37, 0.38, 'y', 20, '#0f172a', { material: 'plastic' }));
        faces.push(...createCylinder(0, 0.65 + pressOffset, 0, 0.32, 0.04, 'y', 20, '#334155', { material: 'plastic' }));
        // 4 curved gull-wing pins
        [
          [-0.75, -0.46],
          [-0.75, 0.46],
          [0.75, -0.46],
          [0.75, 0.46],
        ].forEach(([lx, lz]) => {
          faces.push(...createBox(lx, -0.1, lz, 0.16, 0.1, 0.13, '#cbd5e1', { material: 'metal' }));
          faces.push(...createBox(lx * 1.07, -0.45, lz, 0.08, 0.66, 0.13, '#e2e8f0', { material: 'metal' }));
        });
        silkLabels.push({ pos: [0, 0.68 + pressOffset, 0], text: 'NO', color: '#94a3b8', size: 9 });
        break;
      }

      case 'joystick': {
        faces.push(...createBox(0, -0.15, 0, 2.15, 0.14, 2.38, '#0f172a', { faceColors: { top: '#111827' }, material: 'pcb' }));
        [
          [-0.86, -0.96],
          [0.86, -0.96],
          [-0.86, 0.96],
          [0.86, 0.96],
        ].forEach(([hx, hz]) => {
          faces.push(...createCylinder(hx, -0.07, hz, 0.12, 0.04, 'y', 12, '#fbbf24', { material: 'copper' }));
        });
        // Metallic Gimbal Frame
        faces.push(...createBox(0, 0.34, -0.15, 1.24, 0.82, 1.24, '#94a3b8', { material: 'metal' }));
        faces.push(...createBox(0.72, 0.25, -0.15, 0.2, 0.58, 0.68, '#0284c7', { material: 'plastic' }));
        faces.push(...createBox(0, 0.25, -0.86, 0.68, 0.58, 0.2, '#0284c7', { material: 'plastic' }));
        faces.push(...createBox(-0.72, 0.18, -0.15, 0.22, 0.42, 0.42, '#475569', { material: 'plastic' }));

        const tiltX = Math.sin(timeSec * 1.6) * 0.2;
        const tiltZ = Math.cos(timeSec * 1.2) * 0.16;
        faces.push(...createCylinder(tiltX * 0.5, 0.95, -0.15 + tiltZ * 0.5, 0.13, 0.62, 'y', 12, '#334155', { material: 'plastic' }));
        faces.push(...createCylinder(tiltX, 1.3, -0.15 + tiltZ, 0.68, 0.24, 'y', 22, '#1e293b', { rTop: 0.58, material: 'plastic' }));
        faces.push(...createHemisphere(tiltX, 1.42, -0.15 + tiltZ, 0.58, 3, 20, '#334155', { material: 'plastic' }));
        for (let i = 0; i < 5; i++) {
          const px = -0.7 + i * 0.35;
          faces.push(...createBox(px, -0.02, 1.0, 0.14, 0.14, 0.14, '#090d14'));
          faces.push(...createBox(px, -0.02, 1.26, 0.055, 0.055, 0.52, '#fbbf24', { material: 'metal' }));
        }
        silkLabels.push({ pos: [0, -0.05, 0.72], text: 'KY-023', color: '#e2e8f0', size: 9 });
        break;
      }

      case 'hc-sr04': {
        faces.push(...createBox(0, 0, 0, 2.94, 1.32, 0.14, '#1d4ed8', { faceColors: { front: '#2563eb' }, material: 'pcb' }));
        // 4 corner gold mounting holes
        [
          [-1.32, 0.52],
          [1.32, 0.52],
          [-1.32, -0.52],
          [1.32, -0.52],
        ].forEach(([hx, hy]) => {
          faces.push(...createCylinder(hx, hy, 0, 0.09, 0.16, 'z', 10, '#fbbf24', { material: 'copper' }));
        });
        // 16MHz metallic crystal oscillator
        faces.push(...createBox(0, 0.45, 0.17, 0.68, 0.23, 0.18, '#e2e8f0', { material: 'metal' }));
        // 2 Aluminum Transducers (T & R) with inner dark acoustic mesh & cone
        [-0.86, 0.86].forEach((cx) => {
          faces.push(...createCylinder(cx, 0.02, 0.42, 0.53, 0.72, 'z', 24, '#cbd5e1', { capColor: '#0f172a', material: 'metal' }));
          faces.push(...createCylinder(cx, 0.02, 0.79, 0.44, 0.04, 'z', 22, '#1e293b', { material: 'plastic' }));
          faces.push(...createCylinder(cx, 0.02, 0.81, 0.18, 0.03, 'z', 14, '#b45309', { material: 'copper' }));
        });
        // Animated ultrasonic pulse waves
        const wavePhase = (timeSec * 1.4) % 1;
        const wr = 0.26 + wavePhase * 0.48;
        const wz = 0.92 + wavePhase * 0.75;
        faces.push(...createCylinder(-0.86, 0.02, wz, wr, 0.035, 'z', 20, '#38bdf8', { alpha: (1 - wavePhase) * 0.6, noCaps: true, unlit: true }));
        addPinHeaderRow(faces, -0.42, -0.78, 0, 4, 0.28, 0.46);
        silkLabels.push({ pos: [0, -0.35, 0.1], text: 'HC-SR04', color: '#f8fafc', size: 10 });
        silkLabels.push({ pos: [-0.86, -0.56, 0.1], text: 'T', color: '#93c5fd', size: 9.5 });
        silkLabels.push({ pos: [0.86, -0.56, 0.1], text: 'R', color: '#93c5fd', size: 9.5 });
        break;
      }

      case 'hc-sr501': {
        faces.push(...createBox(0, -0.25, 0, 2.15, 0.14, 2.15, '#15803d', { faceColors: { top: '#16a34a' }, material: 'pcb' }));
        // Inner RE200B pyroelectric sensor visible inside translucent dome
        faces.push(...createCylinder(0, 0.06, 0, 0.26, 0.34, 'y', 14, '#cbd5e1', { material: 'metal' }));
        faces.push(...createBox(0, 0.24, 0, 0.24, 0.04, 0.18, '#0f172a'));
        // Translucent white geodesic Fresnel dome
        faces.push(...createHemisphere(0, -0.18, 0, 0.88, 5, 14, '#f8fafc', { alpha: 0.84, stroke: 'rgba(148,163,184,0.35)', material: 'glass', doubleSided: true }));
        // 2 Orange trimming pots on back/side
        faces.push(...createBox(-0.45, -0.38, -0.76, 0.36, 0.16, 0.36, '#ea580c', { material: 'plastic' }));
        faces.push(...createCylinder(-0.45, -0.47, -0.76, 0.11, 0.04, 'y', 10, '#f8fafc', { material: 'metal' }));
        faces.push(...createBox(0.45, -0.38, -0.76, 0.36, 0.16, 0.36, '#ea580c', { material: 'plastic' }));
        faces.push(...createCylinder(0.45, -0.47, -0.76, 0.11, 0.04, 'y', 10, '#f8fafc', { material: 'metal' }));
        faces.push(...createBox(0, -0.38, 0.1, 0.65, 0.12, 0.35, '#0f172a'));
        addPinHeaderRow(faces, -0.32, -0.38, 0.76, 3, 0.32, 0.52);
        silkLabels.push({ pos: [0, 0.8, 0], text: 'FRESNEL', color: '#94a3b8', size: 8.5 });
        break;
      }

      case 'drv8833': {
        faces.push(...createBox(0, 0, 0, 1.48, 0.14, 1.88, '#b91c1c', { faceColors: { top: '#dc2626' }, material: 'pcb' }));
        // DRV8833 QFN/HTSSOP IC with silver leads
        faces.push(...createBox(0, 0.14, 0.1, 0.46, 0.12, 0.68, '#0f172a', { material: 'plastic' }));
        for (let k = 0; k < 8; k++) {
          const lz = -0.2 + k * 0.085;
          faces.push(...createBox(-0.27, 0.1, lz, 0.08, 0.04, 0.04, '#cbd5e1', { material: 'metal' }));
          faces.push(...createBox(0.27, 0.1, lz, 0.08, 0.04, 0.04, '#cbd5e1', { material: 'metal' }));
        }
        // Tantalum capacitor & SMD caps
        faces.push(...createBox(0, 0.17, -0.58, 0.48, 0.19, 0.28, '#f59e0b', { material: 'plastic' }));
        faces.push(...createBox(-0.28, 0.13, -0.3, 0.2, 0.1, 0.14, '#d6b48c', { material: 'plastic' }));
        faces.push(...createBox(0.28, 0.13, -0.3, 0.2, 0.1, 0.14, '#d6b48c', { material: 'plastic' }));
        // Gold plated through-hole pads & pins
        for (let i = 0; i < 8; i++) {
          const pz = -0.74 + i * 0.21;
          faces.push(...createCylinder(-0.62, 0.08, pz, 0.065, 0.18, 'y', 10, '#fbbf24', { material: 'copper' }));
          faces.push(...createCylinder(0.62, 0.08, pz, 0.065, 0.18, 'y', 10, '#fbbf24', { material: 'copper' }));
          faces.push(...createBox(-0.62, -0.25, pz, 0.045, 0.44, 0.045, '#f59e0b', { material: 'metal' }));
          faces.push(...createBox(0.62, -0.25, pz, 0.045, 0.44, 0.045, '#f59e0b', { material: 'metal' }));
        }
        silkLabels.push({ pos: [0, 0.23, 0.1], text: 'DRV8833', color: '#e2e8f0', size: 9 });
        break;
      }

      case 'servo-sg90': {
        // Internal gears visible slightly through translucent blue shell
        faces.push(...createCylinder(0.38, 0.55, 0, 0.26, 0.42, 'y', 14, '#d97706', { material: 'copper' }));
        faces.push(...createBox(-0.25, -0.1, 0, 0.72, 0.75, 0.55, '#475569', { material: 'metal' }));
        // Translucent Blue SG90 shell
        faces.push(...createBox(0, 0, 0, 1.76, 1.46, 0.86, '#0284c7', { alpha: 0.76, material: 'glass', doubleSided: true }));
        faces.push(...createBox(-1.12, 0.34, 0, 0.48, 0.14, 0.86, '#0369a1', { alpha: 0.85, material: 'plastic' }));
        faces.push(...createBox(1.12, 0.34, 0, 0.48, 0.14, 0.86, '#0369a1', { alpha: 0.85, material: 'plastic' }));
        faces.push(...createCylinder(0.38, 0.86, 0, 0.41, 0.34, 'y', 20, '#0284c7', { alpha: 0.8, material: 'glass' }));
        faces.push(...createCylinder(0.38, 1.06, 0, 0.19, 0.16, 'y', 14, '#e2e8f0', { material: 'metal' }));

        const sweep = Math.sin(timeSec * 1.8) * 1.1;
        const ca = Math.cos(sweep);
        const sa = Math.sin(sweep);
        const hornPts = [
          [-0.22, 1.16, -0.14],
          [0.86, 1.16, -0.07],
          [0.86, 1.16, 0.07],
          [-0.22, 1.16, 0.14],
        ].map(([hx, hy, hz]) => [0.38 + hx * ca - hz * sa, hy, hx * sa + hz * ca]);
        const hornTop = hornPts.map(([hx, hy, hz]) => [hx, hy + 0.11, hz]);
        faces.push({ verts: hornTop, color: '#f8fafc', material: 'plastic', stroke: 'rgba(15,23,42,0.12)' });
        faces.push({ verts: [...hornPts].reverse(), color: '#cbd5e1', material: 'plastic' });
        for (let i = 0; i < 4; i++) {
          const j = (i + 1) % 4;
          faces.push({ verts: [hornPts[i], hornPts[j], hornTop[j], hornTop[i]], color: '#e2e8f0', material: 'plastic' });
        }
        faces.push(...createCylinder(0.38, 1.2, 0, 0.22, 0.16, 'y', 14, '#f8fafc', { material: 'plastic' }));
        faces.push(...createCylinder(0.38, 1.29, 0, 0.08, 0.03, 'y', 10, '#94a3b8', { material: 'metal' }));
        faces.push(...createBox(-1.12, -0.45, 0.18, 0.64, 0.08, 0.12, '#78350f'));
        faces.push(...createBox(-1.12, -0.45, 0.0, 0.64, 0.08, 0.12, '#ef4444'));
        faces.push(...createBox(-1.12, -0.45, -0.18, 0.64, 0.08, 0.12, '#f97316'));
        silkLabels.push({ pos: [-0.25, 0.05, 0.45], text: 'SG90 9g', color: '#e0f2fe', size: 10 });
        break;
      }

      case 'oled-i2c': {
        faces.push(...createBox(0, 0, 0, 1.98, 1.98, 0.12, '#1d4ed8', { faceColors: { front: '#2563eb' }, material: 'pcb' }));
        // Gold mounting holes
        [
          [-0.82, 0.82],
          [0.82, 0.82],
          [-0.82, -0.82],
          [0.82, -0.82],
        ].forEach(([hx, hy]) => {
          faces.push(...createCylinder(hx, hy, 0, 0.09, 0.14, 'z', 10, '#fbbf24', { material: 'copper' }));
        });
        // Glossy glass bezel + orange flex ribbon at bottom
        faces.push(...createBox(0, -0.84, 0.08, 0.72, 0.24, 0.03, '#ea580c', { material: 'plastic' }));
        faces.push(...createBox(0, -0.06, 0.11, 1.76, 1.26, 0.08, '#020617', { material: 'glass' }));
        faces.push(...createBox(0, -0.04, 0.16, 1.56, 0.86, 0.02, '#0ea5e9', { unlit: true, alpha: 0.18 }));
        // Dynamic animated equalizer / bar graph pixels on OLED!
        for (let b = 0; b < 5; b++) {
          const bh = 0.14 + 0.18 * (0.5 + 0.5 * Math.sin(timeSec * 3.5 + b * 1.1));
          faces.push(...createBox(-0.48 + b * 0.24, -0.35 + bh / 2, 0.175, 0.14, bh, 0.01, '#38bdf8', { unlit: true }));
        }
        faces.push(...createBox(0, 0.22, 0.175, 1.25, 0.09, 0.01, '#e0f2fe', { unlit: true }));
        for (let i = 0; i < 4; i++) {
          const px = -0.42 + i * 0.28;
          faces.push(...createCylinder(px, 0.84, 0.08, 0.06, 0.12, 'z', 10, '#fbbf24', { material: 'copper' }));
          faces.push(...createBox(px, 0.84, -0.25, 0.05, 0.05, 0.45, '#f59e0b', { material: 'metal' }));
        }
        silkLabels.push({ pos: [0, 0.14, 0.2], text: 'OLED 0x3C', color: '#7dd3fc', size: 9 });
        break;
      }

      case 'relay': {
        faces.push(...createBox(0, -0.25, 0, 2.38, 0.14, 1.48, '#1e40af', { faceColors: { top: '#1d4ed8' }, material: 'pcb' }));
        faces.push(...createBox(-0.1, 0.36, 0, 1.16, 1.06, 0.96, '#0284c7', { material: 'plastic' }));
        // Green 3-port Screw Terminal Block (COM / NO / NC)
        faces.push(...createBox(0.86, 0.16, 0, 0.56, 0.66, 1.16, '#16a34a', { material: 'plastic' }));
        [-0.34, 0, 0.34].forEach((sz) => {
          faces.push(...createCylinder(0.86, 0.5, sz, 0.13, 0.05, 'y', 12, '#e2e8f0', { material: 'metal' }));
        });
        faces.push(...createBox(-0.88, -0.1, -0.28, 0.32, 0.16, 0.36, '#0f172a', { material: 'plastic' }));
        const ledActive = Math.sin(timeSec * 2.5) > 0;
        faces.push(...createBox(-0.88, -0.13, 0.35, 0.16, 0.1, 0.16, ledActive ? '#22c55e' : '#14532d', { unlit: ledActive }));
        if (ledActive) glowEffect = { pos: [-0.88, -0.1, 0.35], color: '#22c55e', intensity: 0.7 };
        for (let i = 0; i < 3; i++) {
          const pz = -0.32 + i * 0.32;
          faces.push(...createBox(-1.13, -0.14, pz, 0.14, 0.14, 0.14, '#090d14'));
          faces.push(...createBox(-1.36, -0.14, pz, 0.42, 0.05, 0.05, '#fbbf24', { material: 'metal' }));
        }
        silkLabels.push({ pos: [-0.1, 0.92, 0], text: 'SRD-05VDC', color: '#e0f2fe', size: 9 });
        break;
      }

      case 'mpu6050': {
        faces.push(...createBox(0, 0, 0, 2.04, 1.38, 0.12, '#1d4ed8', { faceColors: { front: '#2563eb' }, material: 'pcb' }));
        [
          [-0.86, 0.52],
          [0.86, 0.52],
        ].forEach(([hx, hy]) => {
          faces.push(...createCylinder(hx, hy, 0, 0.09, 0.14, 'z', 10, '#fbbf24', { material: 'copper' }));
        });
        faces.push(...createBox(0, 0.08, 0.1, 0.46, 0.46, 0.09, '#0f172a', { material: 'plastic' }));
        faces.push(...createBox(-0.52, 0.16, 0.09, 0.24, 0.2, 0.08, '#1e293b', { material: 'plastic' }));
        faces.push(...createBox(0.62, 0.25, 0.09, 0.14, 0.1, 0.05, '#22c55e', { unlit: true }));
        faces.push(...createBox(0.52, -0.1, 0.075, 0.36, 0.04, 0.01, '#f8fafc', { unlit: true }));
        faces.push(...createBox(0.35, 0.2, 0.075, 0.04, 0.36, 0.01, '#f8fafc', { unlit: true }));
        addPinHeaderRow(faces, -0.77, -0.72, 0.04, 8, 0.22, 0.42);
        silkLabels.push({ pos: [0, 0.08, 0.18], text: 'MPU6050', color: '#94a3b8', size: 8.5 });
        silkLabels.push({ pos: [0.76, -0.1, 0.1], text: 'X', color: '#f8fafc', size: 9 });
        silkLabels.push({ pos: [0.35, 0.45, 0.1], text: 'Y', color: '#f8fafc', size: 9 });
        break;
      }
    }

    return { faces, silkLabels, glowEffect };
  }

  // =========================================================================
  // INTERACTIVE 3D VIEWER CLASS
  // =========================================================================
  class Component3DViewer {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.onPinHover = options.onPinHover || function () {};
      this.onPinSelect = options.onPinSelect || function () {};

      this.component = null;
      this.yaw = -0.52;
      this.pitch = 0.42;
      this.zoom = 1.24;
      this.targetYaw = null;
      this.targetPitch = null;
      this.targetZoom = null;

      this.autoRotate = true;
      this.showLabels = true;
      this.hoveredPinId = null;
      this.selectedPinId = null;

      this.isDragging = false;
      this.lastMouse = { x: 0, y: 0 };
      this.projectedPins = [];
      this.animId = null;
      this.startTime = performance.now();

      this._bindEvents();
    }

    setComponent(component) {
      this.component = component;
      this.hoveredPinId = null;
      this.selectedPinId = null;
      this.resetView();
    }

    setSelectedPin(pinId) {
      this.selectedPinId = pinId;
    }

    setHoveredPin(pinId) {
      this.hoveredPinId = pinId;
    }

    setAutoRotate(val) {
      this.autoRotate = !!val;
    }

    setShowLabels(val) {
      this.showLabels = !!val;
    }

    setViewPreset(preset) {
      this.autoRotate = preset === 'iso';
      if (preset === 'iso') {
        this.targetYaw = -0.52;
        this.targetPitch = 0.38;
        this.targetZoom = 1.24;
      } else if (preset === 'front') {
        this.targetYaw = 0;
        this.targetPitch = 0.05;
        this.targetZoom = 1.32;
      } else if (preset === 'top') {
        this.targetYaw = 0;
        this.targetPitch = 1.32;
        this.targetZoom = 1.28;
      } else if (preset === 'side') {
        this.targetYaw = 1.54;
        this.targetPitch = 0.14;
        this.targetZoom = 1.28;
      }
    }

    resetView() {
      this.targetYaw = -0.52;
      this.targetPitch = 0.38;
      this.targetZoom = 1.24;
    }

    adjustZoom(delta) {
      this.targetZoom = null;
      this.zoom = clamp(this.zoom + delta, 0.65, 2.3);
    }

    start() {
      if (this.animId) return;
      const tick = (now) => {
        this._render((now - this.startTime) / 1000);
        this.animId = requestAnimationFrame(tick);
      };
      this.animId = requestAnimationFrame(tick);
    }

    stop() {
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    }

    _project(p, width, height) {
      const rp = rotatePoint(p, this.yaw, this.pitch);
      const cameraDist = 7.2;
      const fov = Math.min(width, height) * 0.72 * this.zoom;
      const zCam = cameraDist - rp[2];
      const scale = fov / Math.max(0.8, zCam);
      return {
        x: width / 2 + rp[0] * scale,
        y: height / 2 - rp[1] * scale,
        z: rp[2],
        scale,
        rotated: rp,
      };
    }

    _hitTestPin(mx, my) {
      let best = null;
      let bestDist = 34;
      for (const p of this.projectedPins) {
        const dDot = Math.hypot(mx - p.x, my - p.y);
        const inLabel =
          mx >= p.labelBox.x &&
          mx <= p.labelBox.x + p.labelBox.w &&
          my >= p.labelBox.y &&
          my <= p.labelBox.y + p.labelBox.h;
        if (inLabel) return p.id;
        if (dDot < bestDist) {
          bestDist = dDot;
          best = p.id;
        }
      }
      return best;
    }

    _bindEvents() {
      const getCoords = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
      };

      this.canvas.addEventListener('pointerdown', (e) => {
        const pos = getCoords(e);
        const hitPin = this._hitTestPin(pos.x, pos.y);
        this._pointerDownOnPin = hitPin && e.button === 0 ? hitPin : null;
        this.isDragging = true;
        this._dragDist = 0;
        this.targetYaw = null;
        this.targetPitch = null;
        this.targetZoom = null;
        this.lastMouse = pos;
        this.canvas.setPointerCapture(e.pointerId);
      });

      this.canvas.addEventListener('pointermove', (e) => {
        const pos = getCoords(e);
        if (this.isDragging) {
          const dx = pos.x - this.lastMouse.x;
          const dy = pos.y - this.lastMouse.y;
          this._dragDist += Math.hypot(dx, dy);
          this.yaw += dx * 0.011;
          this.pitch = clamp(this.pitch + dy * 0.011, -1.35, 1.35);
          this.lastMouse = pos;
          if (this._dragDist > 4) {
            this.autoRotate = false;
          }
          return;
        }

        const hit = this._hitTestPin(pos.x, pos.y);
        if (hit !== this.hoveredPinId) {
          this.hoveredPinId = hit;
          this.canvas.style.cursor = hit ? 'pointer' : 'grab';
          this.onPinHover(hit);
        }
      });

      this.canvas.addEventListener('pointerup', (e) => {
        if (this.isDragging && this._dragDist < 5 && this._pointerDownOnPin) {
          this.selectedPinId =
            this.selectedPinId === this._pointerDownOnPin ? null : this._pointerDownOnPin;
          this.onPinSelect(this.selectedPinId);
        }
        this.isDragging = false;
        this._pointerDownOnPin = null;
        if (this.canvas.hasPointerCapture(e.pointerId)) {
          this.canvas.releasePointerCapture(e.pointerId);
        }
      });

      this.canvas.addEventListener('pointerleave', () => {
        if (!this.isDragging && this.hoveredPinId !== null) {
          this.hoveredPinId = null;
          this.onPinHover(null);
        }
      });

      this.canvas.addEventListener(
        'wheel',
        (e) => {
          e.preventDefault();
          this.adjustZoom(e.deltaY > 0 ? -0.09 : 0.09);
        },
        { passive: false }
      );
    }

    _drawAxisTriad(ctx, width, height, isLight) {
      const originX = 42;
      const originY = height - 46;
      const len = 24;
      const axes = [
        { vec: [1, 0, 0], label: 'X', color: '#ef4444' },
        { vec: [0, 1, 0], label: 'Y', color: '#22c55e' },
        { vec: [0, 0, 1], label: 'Z', color: '#38bdf8' },
      ];
      ctx.beginPath();
      ctx.arc(originX, originY, 30, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? 'rgba(255,255,255,0.75)' : 'rgba(15,23,42,0.72)';
      ctx.fill();
      ctx.strokeStyle = isLight ? 'rgba(15,23,42,0.12)' : 'rgba(148,163,184,0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();

      axes.forEach((ax) => {
        const rp = rotatePoint(ax.vec, this.yaw, this.pitch);
        const ex = originX + rp[0] * len;
        const ey = originY - rp[1] * len;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = ax.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.fillStyle = ax.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ax.label, originX + rp[0] * (len + 8), originY - rp[1] * (len + 8));
      });
    }

    _render(timeSec) {
      if (!this.canvas || !this.component) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(320, Math.floor(rect.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
      }

      // Smooth preset camera interpolation
      if (this.targetYaw !== null) {
        this.yaw = lerp(this.yaw, this.targetYaw, 0.16);
        if (Math.abs(this.yaw - this.targetYaw) < 0.01) {
          this.yaw = this.targetYaw;
          this.targetYaw = null;
        }
      }
      if (this.targetPitch !== null) {
        this.pitch = lerp(this.pitch, this.targetPitch, 0.16);
        if (Math.abs(this.pitch - this.targetPitch) < 0.01) {
          this.pitch = this.targetPitch;
          this.targetPitch = null;
        }
      }
      if (this.targetZoom !== null) {
        this.zoom = lerp(this.zoom, this.targetZoom, 0.16);
        if (Math.abs(this.zoom - this.targetZoom) < 0.01) {
          this.zoom = this.targetZoom;
          this.targetZoom = null;
        }
      }

      const ctx = this.ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (this.autoRotate && !this.isDragging && this.targetYaw === null) {
        this.yaw += 0.0052;
      }

      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      // 1. Turntable Studio Podium + Perspective Grid + Soft Contact Shadow (y = -1.45)
      const floorY = -1.45;
      const centerFloor = this._project([0, floorY, 0], width, height);

      // Soft studio radial shadow under component
      const shadowR = 115 * this.zoom;
      const shadowGrad = ctx.createRadialGradient(
        centerFloor.x,
        centerFloor.y,
        6,
        centerFloor.x,
        centerFloor.y,
        shadowR
      );
      shadowGrad.addColorStop(0, isLight ? 'rgba(15,23,42,0.22)' : 'rgba(0,0,0,0.62)');
      shadowGrad.addColorStop(0.55, isLight ? 'rgba(15,23,42,0.08)' : 'rgba(14,165,233,0.08)');
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.arc(centerFloor.x, centerFloor.y, shadowR, 0, Math.PI * 2);
      ctx.fill();

      // Concentric turntable rings
      [1.45, 2.25].forEach((radius, rIdx) => {
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const a = (i / 48) * Math.PI * 2;
          const pt = this._project([Math.cos(a) * radius, floorY, Math.sin(a) * radius], width, height);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle =
          rIdx === 0
            ? isLight
              ? 'rgba(2,132,199,0.25)'
              : 'rgba(56,189,248,0.25)'
            : isLight
            ? 'rgba(15,23,42,0.1)'
            : 'rgba(148,163,184,0.12)';
        ctx.lineWidth = rIdx === 0 ? 1.5 : 1;
        ctx.stroke();
      });

      // Floor grid lines
      ctx.strokeStyle = isLight ? 'rgba(15,23,42,0.06)' : 'rgba(56,189,248,0.09)';
      ctx.lineWidth = 1;
      for (let g = -2.4; g <= 2.41; g += 0.8) {
        const p1 = this._project([g, floorY, -2.4], width, height);
        const p2 = this._project([g, floorY, 2.4], width, height);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        const p3 = this._project([-2.4, floorY, g], width, height);
        const p4 = this._project([2.4, floorY, g], width, height);
        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
      }

      // 2. Build & Shade Component Mesh Faces
      const { faces: rawFaces, silkLabels, glowEffect } = buildComponentScene(
        this.component.model3DType,
        timeSec
      );
      const lightDir = norm3([0.52, 0.86, 0.72]);
      const viewDir = [0, 0, 1];
      const halfVec = norm3([lightDir[0] + viewDir[0], lightDir[1] + viewDir[1], lightDir[2] + viewDir[2]]);
      const projectedFaces = [];

      for (const f of rawFaces) {
        const pts = f.verts.map((v) => this._project(v, width, height));
        const avgZ = pts.reduce((acc, p) => acc + p.z, 0) / pts.length;

        const r0 = pts[0].rotated;
        const r1 = pts[1].rotated;
        const r2 = pts[2].rotated;
        const normal = norm3(cross3(sub3(r1, r0), sub3(r2, r0)));

        if (f.alpha >= 0.98 && !f.doubleSided && normal[2] < -0.15) {
          continue;
        }

        const nDotL = Math.max(0, dot3(normal, lightDir));
        const rim = 1 - Math.abs(normal[2]);
        const spec = Math.max(0, dot3(normal, halfVec));

        projectedFaces.push({
          pts,
          avgZ,
          fill: shadeMaterial(f.color, nDotL, rim, spec, f.material, f.alpha, f.unlit),
          stroke: f.stroke,
        });
      }

      projectedFaces.sort((a, b) => a.avgZ - b.avgZ);

      for (const pf of projectedFaces) {
        ctx.beginPath();
        ctx.moveTo(pf.pts[0].x, pf.pts[0].y);
        for (let i = 1; i < pf.pts.length; i++) {
          ctx.lineTo(pf.pts[i].x, pf.pts[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = pf.fill;
        ctx.fill();
        if (pf.stroke) {
          ctx.strokeStyle = pf.stroke;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }

      // Optional dynamic LED glow halo
      if (glowEffect && glowEffect.intensity > 0.2) {
        const gp = this._project(glowEffect.pos, width, height);
        const gr = (36 + glowEffect.intensity * 26) * this.zoom;
        const gGrad = ctx.createRadialGradient(gp.x, gp.y, 2, gp.x, gp.y, gr);
        gGrad.addColorStop(0, shadeMaterial(glowEffect.color, 1, 0, 0, 'plastic', 0.55 * glowEffect.intensity, true));
        gGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gGrad;
        ctx.beginPath();
        ctx.arc(gp.x, gp.y, gr, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3D Silkscreen markings projected onto the component
      silkLabels.forEach((sl) => {
        const sp = this._project(sl.pos, width, height);
        ctx.font = `800 ${Math.round(sl.size * Math.min(1.25, this.zoom))}px "JetBrains Mono", monospace`;
        ctx.fillStyle = sl.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sl.text, sp.x, sp.y);
      });

      // 3. Project Interactive 3D Pin Callouts with Collision De-duplication
      this.projectedPins = [];
      const pins = this.component.pins || [];
      ctx.font = '700 11px "JetBrains Mono", monospace';

      const callouts = pins.map((pin, idx) => {
        const p3 = this._project(pin.pos3D, width, height);
        const isActive = this.selectedPinId === pin.id || this.hoveredPinId === pin.id;
        const text = pin.shortLabel;
        const tw = ctx.measureText(text).width;
        const bw = tw + 16;
        const bh = 22;

        const vx = p3.x - width / 2;
        const vy = p3.y - height / 2;
        const vLen = Math.hypot(vx, vy) || 1;
        const dirX = vx / vLen;
        const dirY = vy / vLen;
        const pushDist = 76 + (idx % 2) * 18;
        const lx = clamp(p3.x + dirX * pushDist, bw / 2 + 16, width - bw / 2 - 16);
        const ly = clamp(p3.y + dirY * pushDist + (p3.y >= height / 2 ? 14 : -14), 56, height - 42);

        return { pin, p3, isActive, text, bw, bh, lx, ly };
      });

      const padGap = 7;
      for (let iter = 0; iter < 8; iter++) {
        for (let i = 0; i < callouts.length; i++) {
          for (let j = i + 1; j < callouts.length; j++) {
            const a = callouts[i];
            const b = callouts[j];
            const dx = b.lx - a.lx;
            const dy = b.ly - a.ly;
            const minX = (a.bw + b.bw) / 2 + padGap;
            const minY = (a.bh + b.bh) / 2 + padGap;
            if (Math.abs(dx) < minX && Math.abs(dy) < minY) {
              const overlapY = minY - Math.abs(dy);
              const overlapX = minX - Math.abs(dx);
              if (overlapY <= overlapX) {
                const shiftY = (overlapY / 2 + 1) * (dy >= 0 ? 1 : -1);
                a.ly = clamp(a.ly - shiftY, 56, height - 42);
                b.ly = clamp(b.ly + shiftY, 56, height - 42);
              } else {
                const shiftX = (overlapX / 2 + 1) * (dx >= 0 ? 1 : -1);
                a.lx = clamp(a.lx - shiftX, a.bw / 2 + 16, width - a.bw / 2 - 16);
                b.lx = clamp(b.lx + shiftX, b.bw / 2 + 16, width - b.bw / 2 - 16);
              }
            }
          }
        }
      }

      callouts.forEach((c) => {
        const { pin, p3, isActive, text, bw, bh, lx, ly } = c;
        const bx = lx - bw / 2;
        const by = ly - bh / 2;

        if (isActive) {
          const pulseR = 11 + Math.sin(timeSec * 6) * 3;
          ctx.beginPath();
          ctx.arc(p3.x, p3.y, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = pin.color;
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(p3.x, p3.y, isActive ? 6.5 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = pin.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        this.projectedPins.push({
          id: pin.id,
          x: p3.x,
          y: p3.y,
          z: p3.z,
          labelBox: { x: bx, y: by, w: bw, h: bh },
        });

        if (!this.showLabels && !isActive) return;

        ctx.beginPath();
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(lx, ly);
        ctx.strokeStyle = isActive ? '#38bdf8' : pin.color;
        ctx.lineWidth = isActive ? 2 : 1.3;
        ctx.setLineDash(isActive ? [] : [3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 6);
        ctx.fillStyle = isActive
          ? pin.color
          : isLight
          ? 'rgba(255,255,255,0.95)'
          : 'rgba(15,23,42,0.92)';
        ctx.fill();
        ctx.strokeStyle = isActive ? '#ffffff' : pin.color;
        ctx.lineWidth = isActive ? 2 : 1.4;
        ctx.stroke();

        ctx.fillStyle = isActive ? '#ffffff' : isLight ? '#0f172a' : '#f1f5f9';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, lx, ly + 0.5);
      });

      // 4. Draw 3D Axis Triad at bottom-left
      this._drawAxisTriad(ctx, width, height, isLight);
    }
  }

  global.Component3DViewer = Component3DViewer;
})(window);
