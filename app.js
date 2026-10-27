(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
  const MAX_BOUNDS = [[98.925, 18.750], [99.045, 18.830]];
  const START = { center: [98.9738, 18.7962], zoom: 14.1 };
  // Area covered by the simulated outdoor air layer (larger than MAX_BOUNDS).
  const FIELD = { W: 98.90, E: 99.07, S: 18.72, N: 18.86 };
  const LIST_M = 1500;

  // US EPA (2024) PM2.5 bands and colours, as used in the AirGradient apps.
  const PM_BANDS = [
    { max: 9.0, color: '#58D32F', label: 'Good', mascot: 'aqi_mascot_good', advice: 'A good day to be outside' },
    { max: 35.4, color: '#FFDA3E', label: 'Moderate', mascot: 'aqi_mascot_moderate', advice: 'Fine for most people' },
    { max: 55.4, color: '#FF9300', label: 'Unhealthy for sensitive groups', short: 'Sensitive groups', mascot: 'aqi_mascot_unhealthy_sensitive', advice: 'Sensitive groups should limit time outside' },
    { max: 125.4, color: '#E1243B', label: 'Unhealthy', mascot: 'aqi_mascot_unhealthy', advice: 'Spend time in clean indoor spaces' },
    { max: 225.4, color: '#7C2DC1', label: 'Very unhealthy', mascot: 'aqi_mascot_very_unhealthy', advice: 'Avoid time outside' },
    { max: Infinity, color: '#822B22', label: 'Hazardous', mascot: 'aqi_mascot_hazardous', advice: 'Stay in clean indoor air' },
  ];
  // Indoor CO2 bands from the apps (IndoorCo2Thresholds).
  const CO2_BANDS = [
    { max: 800, color: '#58D32F', label: 'Well ventilated' },
    { max: 1000, color: '#FFDA3E', label: 'Acceptable ventilation' },
    { max: 1500, color: '#FF9300', label: 'Stuffy' },
    { max: 2000, color: '#E1243B', label: 'Poorly ventilated' },
    { max: 3000, color: '#7C2DC1', label: 'Very poorly ventilated' },
    { max: Infinity, color: '#822B22', label: 'Unhealthy CO₂ level' },
  ];
  const GREY = '#9E9E9E';
  const GREY_INDEX = 6;

  // Continuous colour ramp for the outdoor air layer: blends from one EPA band colour into the next.
  const RAMP = [
    [0, '#58D32F'], [8, '#58D32F'], [24, '#FFDA3E'], [44, '#FF9300'], [68, '#E1243B'],
    [125, '#7C2DC1'], [235, '#822B22'], [1000, '#822B22'],
  ];

  const GROUPS = [
    { id: 'all', label: 'All' },
    { id: 'cafe', label: 'Cafés', icon: 'M5 9h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9ZM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M9 4v2M12 4v2' },
    { id: 'restaurant', label: 'Restaurants', icon: 'M7 3v18M4.5 3v5a2.5 2.5 0 0 0 5 0V3M17 21V3c-2.2 1.2-3.5 4-3.5 8H17' },
    { id: 'shopping', label: 'Shopping', icon: 'M5.5 8h13l-1 12.5h-11L5.5 8ZM9 8V6.5a3 3 0 0 1 6 0V8' },
    { id: 'culture', label: 'Museums & culture', icon: 'M3 9.5 12 4l9 5.5M5.5 10v8M10 10v8M14 10v8M18.5 10v8M3 20.5h18' },
    { id: 'bar', label: 'Bars', icon: 'M4.5 4h15L12 12.5V20M8 20.5h8' },
    { id: 'hotel', label: 'Hotels', icon: 'M3 19V6M3 14h18v5M21 14a3.5 3.5 0 0 0-3.5-3.5H11V14M7 12.2a1.6 1.6 0 1 0 0-.1' },
    { id: 'health', label: 'Health', icon: 'M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6v-6Z' },
    { id: 'fitness', label: 'Gyms', icon: 'M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11' },
    { id: 'coworking', label: 'Coworking', icon: 'M4 5.5h16v10H4zM2 19h20' },
  ];

  const KIND_LABEL = {
    cafe: 'Café', ice_cream: 'Ice cream', bakery: 'Bakery', restaurant: 'Restaurant', fast_food: 'Fast food',
    food_court: 'Food court', bar: 'Bar', pub: 'Pub', mall: 'Shopping mall', department_store: 'Department store',
    supermarket: 'Supermarket', books: 'Bookshop', convenience: 'Convenience store', museum: 'Museum', gallery: 'Gallery',
    arts_centre: 'Arts centre', theatre: 'Theatre', library: 'Library', cinema: 'Cinema', hotel: 'Hotel',
    hospital: 'Hospital', clinic: 'Clinic', fitness_centre: 'Gym', sports_centre: 'Sports centre',
    coworking_space: 'Coworking space', coworking: 'Coworking space',
  };

  const LOCATIONS = [
    { id: 'nimman', label: 'Nimman, Soi 9', lon: 98.9672, lat: 18.7986 },
    { id: 'maya', label: 'Maya, Huay Kaew Rd', lon: 98.9662, lat: 18.8031 },
    { id: 'santitham', label: 'Santitham', lon: 98.9818, lat: 18.8028 },
    { id: 'oldcity', label: 'Old City, Wat Phra Singh', lon: 98.9822, lat: 18.7884 },
    { id: 'thaphae', label: 'Tha Phae Gate', lon: 98.9934, lat: 18.7877 },
    { id: 'nightbazaar', label: 'Night Bazaar', lon: 99.0006, lat: 18.7851 },
    { id: 'riverside', label: 'Riverside, Nawarat Bridge', lon: 99.0036, lat: 18.7893 },
  ];

  // Monthly mean outdoor PM2.5 used to simulate past measurements (burning season peaks in March).
  const MONTH_PM = [48, 74, 108, 86, 34, 15, 11, 10, 12, 17, 24, 33];

  const HOUSE_PATH = 'M18 3.5 33.5 15.5h-3v13.5q0 4-4 4h-17q-4 0-4-4V15.5h-3Z';
  const STAR_PATH = 'M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function distanceM(a, b) {
    const r = Math.PI / 180;
    const h = Math.sin((b.lat - a.lat) * r / 2) ** 2 +
      Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lon - a.lon) * r / 2) ** 2;
    return 6371000 * 2 * Math.asin(Math.sqrt(clamp(h, 0, 1)));
  }
  const fmtDist = (m) => (m < 950 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1)} km`);
  const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const median = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };

  function bandIndex(v, bands) {
    const t = Math.floor(v * 10) / 10;
    return bands.findIndex((b) => t <= b.max);
  }
  const pmBand = (v) => PM_BANDS[bandIndex(v, PM_BANDS)];
  const co2Band = (v) => CO2_BANDS[bandIndex(v, CO2_BANDS)];

  function hexToRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // Same rule as EPAColorCoding.textColorForMeasurement: dark text on light colours.
  function textOn(hex) {
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const [r, g, b] = hexToRgb(hex);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.5 ? '#111418' : '#FFFFFF';
  }
  const RAMP_RGB = RAMP.map(([v, c]) => [v, hexToRgb(c)]);
  function rampColor(v) {
    for (let i = 1; i < RAMP_RGB.length; i++) {
      const [v1, c1] = RAMP_RGB[i];
      if (v <= v1) {
        const [v0, c0] = RAMP_RGB[i - 1];
        const t = v1 === v0 ? 0 : (v - v0) / (v1 - v0);
        return [0, 1, 2].map((k) => Math.round(c0[k] + (c1[k] - c0[k]) * t));
      }
    }
    return RAMP_RGB[RAMP_RGB.length - 1][1];
  }

  function comparison(indoor, outdoor) {
    // Same thresholds as spotComparison() in the apps.
    if (Math.abs(indoor - outdoor) < 2) return 'same';
    if (outdoor === 0) return 'worse';
    const r = indoor / outdoor;
    if (r <= 0.85) return 'cleaner';
    if (r >= 1.15) return 'worse';
    return 'same';
  }

  // ---------------------------------------------------------------------------
  // Simulated data
  // ---------------------------------------------------------------------------

  function profileFor(p, r) {
    const u = (a, b) => a + (b - a) * r();
    const pick = (purified, closed) => {
      const x = r();
      return x < purified ? 'purified' : x < purified + closed ? 'closed' : 'open';
    };
    const k = p.kind;
    let tier;
    switch (p.group) {
      case 'cafe': tier = pick(0.24, 0.42); break;
      case 'restaurant': tier = k === 'fast_food' ? pick(0.1, 0.6) : pick(0.12, 0.33); break;
      case 'bar': tier = pick(0.05, 0.2); break;
      case 'shopping':
        tier = k === 'mall' || k === 'department_store' ? pick(0.3, 0.7) : k === 'convenience' ? pick(0, 0.25) : pick(0.15, 0.65);
        break;
      case 'culture': tier = k === 'cinema' || k === 'library' ? pick(0.4, 0.55) : pick(0.2, 0.45); break;
      case 'hotel': tier = pick(0.22, 0.6); break;
      case 'health': tier = pick(0.5, 0.45); break;
      case 'fitness': tier = pick(0.15, 0.45); break;
      default: tier = pick(0.45, 0.5);
    }
    const ratio = tier === 'purified' ? u(0.04, 0.17) : tier === 'closed' ? u(0.3, 0.66) : u(0.8, 1.02);
    const purifier = tier === 'purified' ? u(0.65, 0.95) : tier === 'closed' ? u(0, 0.15) : 0.02;
    const source = p.group === 'restaurant' ? u(2, 14) : p.group === 'bar' ? u(1, 10) : k === 'bakery' ? u(1, 6) : u(0, 2.5);
    let co2;
    if (p.group === 'fitness') co2 = u(900, 1600);
    else if (p.group === 'coworking' || k === 'cinema' || k === 'library') co2 = u(720, 1350);
    else if (tier === 'open') co2 = u(430, 560);
    else co2 = u(540, 1100);
    return { tier, ratio, purifier, source, co2 };
  }

  function measurementDate(r) {
    // Mostly during the 2026 burning season, the rest spread over the past year.
    const start = r() < 0.65 ? Date.UTC(2026, 0, 12) : Date.UTC(2025, 10, 1);
    const end = start === Date.UTC(2026, 0, 12) ? Date.UTC(2026, 3, 30) : Date.UTC(2026, 9, 24);
    return new Date(start + r() * (end - start));
  }

  function simulatePlace(p) {
    const r = rng(hash(p.id));
    const u = (a, b) => a + (b - a) * r();
    const prof = profileFor(p, r);
    const big = p.kind === 'mall' || p.kind === 'cinema' || p.kind === 'department_store';
    const unmeasured = !big && r() < 0.1;
    const n = unmeasured ? 0 : 1 + Math.floor(r() ** (big ? 0.6 : 1.4) * 5);

    const ms = [];
    for (let i = 0; i < n; i++) {
      const date = measurementDate(r);
      const out = Math.max(4, Math.round(MONTH_PM[date.getUTCMonth()] * u(0.55, 1.6)));
      const inside = Math.max(1, Math.round(out * prof.ratio * u(0.8, 1.22) + prof.source * u(0.3, 1)));
      ms.push({
        date, out, inside,
        co2: Math.round(prof.co2 * u(0.88, 1.15) / 10) * 10,
        purifier: r() < prof.purifier,
      });
    }
    ms.sort((a, b) => b.date - a.date);

    const ratios = ms.map((m) => m.inside / m.out);
    const ratio = ms.length ? median(ratios) : null;
    const cleanAir = ms.length >= 2 && ratios.every((x) => x <= 0.3) && ms.some((m) => m.out >= 35.5);
    return {
      ...p,
      ms,
      ratio,
      co2: ms.length ? median(ms.map((m) => m.co2)) : null,
      cleanAir,
      purifierSeen: ms.filter((m) => m.purifier).length,
      prof,
      pending: [],
      cur: null,
    };
  }

  const places = window.PLACES.map(simulatePlace);
  const byId = new Map(places.map((p) => [p.id, p]));

  // About 40% of Clean Air Spaces are sealed: their filtered air stays below 5 µg/m³ whatever the
  // outdoor level. Their past readings are regenerated to match.
  const SEALED_SHARE = 0.4;
  const SEALED_MAX = 4;
  (() => {
    const spaces = places.filter((p) => p.cleanAir).sort((a, b) => hash(`${a.id}:sealed`) - hash(`${b.id}:sealed`));
    for (const p of spaces.slice(0, Math.round(spaces.length * SEALED_SHARE))) {
      const r = rng(hash(`${p.id}:indoor`));
      p.ms.forEach((m) => { m.inside = Math.max(1, Math.round(1 + r() * 2.8)); });
      p.sealed = true;
      p.indoor = median(p.ms.map((m) => m.inside));
      p.ratio = median(p.ms.map((m) => m.inside / m.out));
    }
  })();

  // Hidden outdoor stations: the outdoor slider sets the city level, each station adds local variation.
  // Cleaner toward the Doi Suthep foothills in the west, more polluted east and around the old city.
  const stations = (() => {
    const r = rng(42);
    const list = [];
    const cols = 11, rows = 9;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const lon = FIELD.W + (i + 0.15 + r() * 0.7) / cols * (FIELD.E - FIELD.W);
        const lat = FIELD.S + (j + 0.15 + r() * 0.7) / rows * (FIELD.N - FIELD.S);
        const east = clamp((lon - 98.98) / 0.05, -1.2, 1.2);
        const centre = Math.exp(-(((lon - 98.993) / 0.016) ** 2 + ((lat - 18.787) / 0.014) ** 2));
        const south = clamp((18.795 - lat) / 0.04, -1, 1);
        const m = 1 + 0.34 * east + 0.32 * centre + 0.1 * south + (r() - 0.5) * 0.36;
        list.push({ lon, lat, m: Math.max(0.5, m) });
      }
    }
    return list;
  })();

  // Smooth blend of the stations (Gaussian weights, about 1.3 km wide).
  const SIGMA2 = 2 * 0.012 ** 2;
  function multiplierAt(lon, lat) {
    let num = 0, den = 0;
    for (const s of stations) {
      const dx = (lon - s.lon) * 0.947, dy = lat - s.lat;
      const w = Math.exp(-(dx * dx + dy * dy) / SIGMA2) + 1e-9;
      num += w * s.m; den += w;
    }
    return num / den;
  }
  places.forEach((p) => { p.m = multiplierAt(p.lon, p.lat); });

  // Precomputed multiplier grid for the outdoor air layer.
  const GW = 170, GH = 150;
  const grid = new Float32Array(GW * GH);
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const lon = FIELD.W + (x + 0.5) / GW * (FIELD.E - FIELD.W);
      const lat = FIELD.N - (y + 0.5) / GH * (FIELD.N - FIELD.S);
      grid[y * GW + x] = multiplierAt(lon, lat);
    }
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const state = {
    pm: 90,
    mode: 'pm',
    group: 'all',
    user: { ...LOCATIONS[0] },
    selected: null,
    sheet: 'peek',
    sort: 'clean',
    picking: false,
    saved: new Set(),
  };
  try { JSON.parse(localStorage.getItem('cas-saved') || '[]').forEach((id) => state.saved.add(id)); } catch (e) { /* storage unavailable */ }


  function recompute() {
    for (const p of places) {
      const out = state.pm * p.m;
      const dist = distanceM(state.user, p);
      if (p.ratio == null) { p.cur = { out, est: null, verdict: null, dist }; continue; }
      const est = p.sealed
        ? Math.min(SEALED_MAX, Math.round(p.indoor + out * 0.004))
        : Math.max(out >= 0.5 ? 1 : 0, Math.round(out * p.ratio));
      p.cur = { out, est, verdict: comparison(est, out), dist };
    }
  }

  const inGroup = (p) => state.group === 'all' || p.group === state.group;

  function displayFor(p) {
    if (p.ratio == null) return { color: GREY, label: '–', index: GREY_INDEX, value: null };
    if (state.mode === 'co2') {
      const v = p.co2;
      const i = bandIndex(v, CO2_BANDS);
      return { color: CO2_BANDS[i].color, label: v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v), index: i, value: v };
    }
    const v = p.cur.est;
    const i = bandIndex(v, PM_BANDS);
    return { color: PM_BANDS[i].color, label: String(v), index: i, value: v };
  }

  // ---------------------------------------------------------------------------
  // Map
  // ---------------------------------------------------------------------------

  const map = new maplibregl.Map({
    container: 'map',
    style: MAP_STYLE,
    center: START.center,
    zoom: START.zoom,
    minZoom: 12,
    maxZoom: 18.5,
    maxBounds: MAX_BOUNDS,
    attributionControl: false,
    pitchWithRotate: false,
    dragRotate: false,
  });
  map.touchZoomRotate.disableRotation();
  window.__cas = { map, state, places };

  function houseCanvas(color, star) {
    const scale = 2, w = 40, h = 38;
    const c = document.createElement('canvas');
    c.width = w * scale; c.height = h * scale;
    const ctx = c.getContext('2d');
    ctx.scale(scale, scale);
    ctx.translate(1, 1.5);
    const path = new Path2D(HOUSE_PATH);
    ctx.save();
    ctx.shadowColor = 'rgba(16, 37, 61, 0.35)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = color;
    ctx.fill(path);
    ctx.restore();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke(path);
    if (star) {
      ctx.beginPath();
      ctx.arc(31.5, 6.5, 6.3, 0, Math.PI * 2);
      ctx.fillStyle = '#E39A00';
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.save();
      ctx.translate(31.5 - 4.6, 6.5 - 4.7);
      ctx.scale(0.385, 0.385);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill(new Path2D(STAR_PATH));
      ctx.restore();
    }
    return ctx.getImageData(0, 0, c.width, c.height);
  }

  function addHouseImages() {
    const colors = [...PM_BANDS.map((b) => b.color), GREY];
    colors.forEach((color, i) => {
      map.addImage(`h${i}`, houseCanvas(color, false), { pixelRatio: 2 });
      map.addImage(`hs${i}`, houseCanvas(color, true), { pixelRatio: 2 });
    });
  }

  function placesGeoJSON() {
    return {
      type: 'FeatureCollection',
      features: places.filter(inGroup).map((p) => {
        const d = displayFor(p);
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
          properties: {
            id: p.id,
            label: d.label,
            icon: `${p.cleanAir ? 'hs' : 'h'}${d.index}`,
            tc: d.index === GREY_INDEX ? '#FFFFFF' : textOn(d.color),
            sort: d.value == null ? 99999 : d.value,
            bi: d.index,
            star: p.cleanAir ? 1 : 0,
          },
        };
      }),
    };
  }

  function selectedGeoJSON() {
    const p = state.selected && byId.get(state.selected);
    if (!p) return { type: 'FeatureCollection', features: [] };
    const d = displayFor(p);
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
        properties: { label: d.label, icon: `${p.cleanAir ? 'hs' : 'h'}${d.index}`, tc: d.index === GREY_INDEX ? '#FFFFFF' : textOn(d.color) },
      }],
    };
  }

  // Clusters count their places per colour band (b0–b5, b6 = not measured) and Clean Air Spaces.
  const CLUSTER_PROPS = { stars: ['+', ['get', 'star']] };
  for (let i = 0; i <= GREY_INDEX; i++) CLUSTER_PROPS[`b${i}`] = ['+', ['case', ['==', ['get', 'bi'], i], 1, 0]];

  function bandColors() {
    return [...(state.mode === 'co2' ? CO2_BANDS : PM_BANDS).map((b) => b.color), GREY];
  }

  // Ring with one segment per colour band, sized by how many places fall in it.
  function donutHTML(props) {
    const counts = Array.from({ length: GREY_INDEX + 1 }, (_, i) => props[`b${i}`] || 0);
    const total = props.point_count;
    const size = total >= 30 ? 50 : total >= 10 ? 44 : 38;
    const r = size / 2, inner = r - 7, colors = bandColors();
    let angle = -Math.PI / 2;
    let paths = '';
    counts.forEach((n, i) => {
      if (!n) return;
      if (n === total) {
        paths += `<circle cx="${r}" cy="${r}" r="${r - 3.5}" fill="none" stroke="${colors[i]}" stroke-width="7"/>`;
        return;
      }
      const a1 = angle + (n / total) * Math.PI * 2;
      const large = a1 - angle > Math.PI ? 1 : 0;
      const p = (rad, a) => `${(r + rad * Math.cos(a)).toFixed(2)} ${(r + rad * Math.sin(a)).toFixed(2)}`;
      paths += `<path d="M${p(r, angle)} A${r} ${r} 0 ${large} 1 ${p(r, a1)} L${p(inner, a1)} A${inner} ${inner} 0 ${large} 0 ${p(inner, angle)} Z" fill="${colors[i]}"/>`;
      angle = a1;
    });
    const star = props.stars
      ? `<span class="donut-star"><svg viewBox="0 0 24 24"><path d="${STAR_PATH}" fill="#fff"/></svg>${props.stars}</span>` : '';
    return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/>${paths}` +
      `<circle cx="${r}" cy="${r}" r="${inner}" fill="#fff"/></svg><span class="donut-count">${total}</span>${star}`;
  }

  const donuts = new Map();
  let donutsOnScreen = new Map();
  function updateDonuts() {
    if (!mapReady || !map.isSourceLoaded('places')) return;
    const next = new Map();
    for (const f of map.querySourceFeatures('places')) {
      const props = f.properties;
      if (!props.cluster) continue;
      const key = `${props.cluster_id}:${bandColors().join()}:${Object.keys(CLUSTER_PROPS).map((k) => props[k]).join()}`;
      if (next.has(key)) continue;
      let marker = donuts.get(key);
      if (!marker) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'donut';
        const size = props.point_count >= 30 ? 50 : props.point_count >= 10 ? 44 : 38;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.setAttribute('aria-label', `${props.point_count} places${props.stars ? `, ${props.stars} Clean Air Spaces` : ''}. Zoom in`);
        el.innerHTML = donutHTML(props);
        const coords = f.geometry.coordinates;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          map.getSource('places').getClusterExpansionZoom(props.cluster_id)
            .then((z) => map.easeTo({ center: coords, zoom: Math.min(z + 0.3, 18) }));
        });
        marker = new maplibregl.Marker({ element: el }).setLngLat(coords);
        donuts.set(key, marker);
      }
      next.set(key, marker);
      if (!donutsOnScreen.has(key)) marker.addTo(map);
    }
    for (const [key, marker] of donutsOnScreen) if (!next.has(key)) marker.remove();
    donutsOnScreen = next;
    if (donuts.size > 600) donuts.clear();
  }

  function outdoorImageURL() {
    const c = outdoorImageURL.canvas || (outdoorImageURL.canvas = document.createElement('canvas'));
    c.width = GW; c.height = GH;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(GW, GH);
    for (let i = 0; i < grid.length; i++) {
      const [r, g, b] = rampColor(state.pm * grid[i]);
      img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }
  const FIELD_COORDS = [[FIELD.W, FIELD.N], [FIELD.E, FIELD.N], [FIELD.E, FIELD.S], [FIELD.W, FIELD.S]];

  let mapReady = false;
  let userMarker;
  // Add our layers as soon as the style is ready, without waiting for every base map tile.
  map.once('style.load', () => {
    addHouseImages();
    const firstSymbol = map.getStyle().layers.find((l) => l.type === 'symbol');

    map.addSource('outdoor', { type: 'image', url: outdoorImageURL(), coordinates: FIELD_COORDS });
    map.addLayer({
      id: 'outdoor', type: 'raster', source: 'outdoor',
      paint: { 'raster-opacity': 0.42, 'raster-resampling': 'linear', 'raster-fade-duration': 0 },
    }, firstSymbol && firstSymbol.id);

    map.addSource('places', {
      type: 'geojson', data: placesGeoJSON(),
      cluster: true, clusterRadius: 52, clusterMaxZoom: 13,
      clusterProperties: CLUSTER_PROPS,
    });
    // Clusters are drawn as HTML donuts; this invisible layer keeps their tiles loaded.
    map.addLayer({
      id: 'clusters', type: 'circle', source: 'places', filter: ['has', 'point_count'],
      paint: { 'circle-radius': 1, 'circle-opacity': 0 },
    });
    map.addLayer({
      id: 'places', type: 'symbol', source: 'places', filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-allow-overlap': false,
        'symbol-sort-key': ['get', 'sort'],
        'text-field': ['get', 'label'],
        'text-font': ['Noto Sans Bold'],
        'text-size': 11,
        'text-offset': [0, 0.62],
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: { 'text-color': ['get', 'tc'] },
    });

    map.addSource('selected', { type: 'geojson', data: selectedGeoJSON() });
    map.addLayer({
      id: 'selected', type: 'symbol', source: 'selected',
      layout: {
        'icon-image': ['get', 'icon'], 'icon-size': 1.35, 'icon-allow-overlap': true, 'icon-ignore-placement': true,
        'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': 14.5,
        'text-offset': [0, 0.62], 'text-allow-overlap': true, 'text-ignore-placement': true,
      },
      paint: { 'text-color': ['get', 'tc'] },
    });

    const el = document.createElement('div');
    el.className = 'me';
    el.title = 'Your location (drag to move)';
    userMarker = new maplibregl.Marker({ element: el, draggable: true }).setLngLat([state.user.lon, state.user.lat]).addTo(map);
    userMarker.on('dragend', () => {
      const ll = userMarker.getLngLat();
      setUser({ id: 'custom', label: 'Custom location', lon: ll.lng, lat: ll.lat }, false);
    });

    for (const layer of ['places', 'selected']) {
      map.on('mouseenter', layer, () => { if (!state.picking) map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = state.picking ? 'crosshair' : ''; });
    }
    map.on('click', onMapClick);
    map.on('render', updateDonuts);

    mapReady = true;
    refreshMap();
  });

  // Only markers respond to taps; empty map does nothing unless the user is picking a location.
  function onMapClick(e) {
    if (state.picking) {
      setUser({ id: 'custom', label: 'Custom location', lon: e.lngLat.lng, lat: e.lngLat.lat }, false);
      setPicking(false);
      return;
    }
    const place = map.queryRenderedFeatures(e.point, { layers: ['places'] })[0];
    if (place) selectPlace(place.properties.id);
  }

  let layerPm = null;
  function refreshMap() {
    if (!mapReady) return;
    map.getSource('places').setData(placesGeoJSON());
    map.getSource('selected').setData(selectedGeoJSON());
    if (layerPm === null) layerPm = state.pm;
    if (layerPm !== state.pm) {
      layerPm = state.pm;
      try {
        map.getSource('outdoor').updateImage({ url: outdoorImageURL(), coordinates: FIELD_COORDS });
      } catch (err) { /* a newer image replaced one that was still loading */ }
    }
  }

  // ---------------------------------------------------------------------------
  // Mascots (Lottie animations from the app)
  // ---------------------------------------------------------------------------

  function mountMascot(el, name) {
    if (!el || el.dataset.mascot === name) return;
    if (el._anim) el._anim.destroy();
    el.innerHTML = '';
    el.dataset.mascot = name;
    if (!window.lottie || !window.MASCOTS || !window.MASCOTS[name]) return;
    el._anim = lottie.loadAnimation({
      container: el, renderer: 'svg', loop: !reducedMotion, autoplay: !reducedMotion,
      animationData: JSON.parse(JSON.stringify(window.MASCOTS[name])),
    });
    if (reducedMotion) el._anim.goToAndStop(20, true);
  }

  // ---------------------------------------------------------------------------
  // UI rendering
  // ---------------------------------------------------------------------------

  function houseHTML(p, size) {
    const d = displayFor(p);
    const tc = d.index === GREY_INDEX ? '#FFFFFF' : textOn(d.color);
    const star = p.cleanAir
      ? `<span class="star"><svg viewBox="0 0 24 24"><path d="${STAR_PATH}" fill="#fff"/></svg></span>` : '';
    return `<span class="house" style="${size ? `width:${size}px;height:${size}px` : ''}" aria-hidden="true">` +
      `<svg viewBox="0 0 36 36" style="filter:drop-shadow(0 1px 1.5px rgba(16,37,61,.3))"><path d="${HOUSE_PATH}" fill="${d.color}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>` +
      `<b style="color:${tc}">${esc(d.label)}</b>${star}</span>`;
  }

  function verdictLine(p) {
    if (p.ratio == null) return '<div class="row-verdict v-none">Not measured yet</div>';
    if (state.mode === 'co2') {
      return `<div class="row-verdict v-none">CO₂ ${p.co2} ppm · ${esc(co2Band(p.co2).label)}</div>`;
    }
    const { verdict, est, out } = p.cur;
    if (p.sealed && verdict !== 'cleaner') return '<div class="row-verdict v-cleaner">Stays below 5 µg/m³ inside</div>';
    if (verdict === 'cleaner') return `<div class="row-verdict v-cleaner">${Math.round((1 - est / out) * 100)}% less PM2.5 than outside</div>`;
    if (verdict === 'worse') return '<div class="row-verdict v-worse">More particles than outside</div>';
    return '<div class="row-verdict v-same">About the same as outside</div>';
  }

  function rowHTML(p) {
    return `<button class="row" type="button" data-id="${esc(p.id)}">${houseHTML(p)}` +
      `<div class="row-main"><div class="row-name">${esc(p.name)}</div>` +
      `<div class="row-meta">${esc(KIND_LABEL[p.kind] || 'Place')} · ${fmtDist(p.cur.dist)}</div>${verdictLine(p)}</div></button>`;
  }

  function cleanestNearby(limit) {
    const value = (p) => (state.mode === 'co2' ? p.co2 : p.cur.est);
    let pool = places.filter((p) => inGroup(p) && p.ratio != null && p.cur.dist <= LIST_M);
    if (pool.length < 5) {
      pool = places.filter((p) => inGroup(p) && p.ratio != null).sort((a, b) => a.cur.dist - b.cur.dist).slice(0, 12);
    }
    return pool.sort((a, b) => value(a) - value(b) || a.cur.dist - b.cur.dist).slice(0, limit);
  }

  function nearest(limit) {
    return places.filter(inGroup).sort((a, b) => a.cur.dist - b.cur.dist).slice(0, limit);
  }

  const ATTRIBUTION = '<p class="disclaimer">Air quality values are simulated for this prototype. Places from OpenStreetMap. Map © OpenFreeMap © OpenMapTiles © OpenStreetMap contributors.</p>';

  function renderList() {
    const body = $('sheetBody');
    const full = state.sheet === 'full' || isDesktop();
    const groupLabel = state.group === 'all' ? 'spaces' : GROUPS.find((g) => g.id === state.group).label.toLowerCase();
    if (!full) {
      const items = cleanestNearby(2);
      body.innerHTML =
        `<div class="list-head"><div><h2>Cleanest near you</h2></div><button class="more-link" type="button" data-act="expand">List ›</button></div>` +
        (items.length ? items.map(rowHTML).join('') : `<div class="empty">No measured ${esc(groupLabel)} nearby yet.</div>`);
      return;
    }
    const items = state.sort === 'clean' ? cleanestNearby(40) : nearest(40);
    const condition = state.mode === 'co2'
      ? 'Sorted by measured CO₂'
      : `Estimated for ${Math.round(state.pm)} µg/m³ outside`;
    const scope = state.sort === 'clean' ? 'within 1.5 km' : `near ${state.user.label}`;
    body.innerHTML =
      `<div class="list-head"><div><h2>${state.sort === 'clean' ? 'Cleanest near you' : 'Nearest places'}</h2>` +
      `<div class="list-sub">${esc(condition)} · ${esc(scope)}</div></div>` +
      `<div class="seg" role="group" aria-label="Sort"><button type="button" data-sort="clean" aria-pressed="${state.sort === 'clean'}">Cleanest</button>` +
      `<button type="button" data-sort="near" aria-pressed="${state.sort === 'near'}">Nearest</button></div></div>` +
      (items.length ? items.map(rowHTML).join('') : `<div class="empty">No ${esc(groupLabel)} match. Try another place type or move your location.</div>`) +
      ATTRIBUTION;
  }

  function cmpTile(label, value, unit, band) {
    const tc = textOn(band.color);
    return `<div class="cmp" style="background:${band.color};color:${tc}"><div class="cmp-label">${label}</div>` +
      `<div class="cmp-value">${value} <small>${unit}</small></div><div class="cmp-cat">${esc(band.label)}</div></div>`;
  }

  const DISCOUNT_CODE = 'CLEANAIR10';

  // Clean Air Spaces reward visitors: a small offer card with a code to show at the counter.
  function offerHTML() {
    return `<div class="offer"><span class="offer-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 9h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9ZM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M9 4v2M12 4v2"/></svg></span>` +
      `<div class="offer-text"><span class="offer-tag">Clean air reward</span><strong>10% off your coffee</strong>` +
      `<span>Show this code at the counter.</span></div>` +
      `<button class="offer-code" type="button" data-act="copy-code" aria-label="Copy discount code ${DISCOUNT_CODE}"><code>${DISCOUNT_CODE}</code><span>Copy</span></button></div>`;
  }

  function systemHTML() {
    return `<div class="system"><span class="system-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7M5.5 9.5V20h13V9.5"/><path d="M9 14h6M12.5 12l2.5 2-2.5 2"/></svg></span>` +
      `<div><strong>Positive pressure system</strong>` +
      `<p>This space runs an open-source positive pressure system. It pushes filtered air in, so smoky outside air stays out when doors open.</p>` +
      `<a href="https://openair.foundation/" target="_blank" rel="noopener">Learn more at openair.foundation ›</a></div></div>`;
  }

  // Published measurements, with the viewer's own submissions on top while they await review.
  function measurementTable(p) {
    const row = (m, pending) => `<tr${pending ? ' class="pending"' : ''}><td>${fmtDate(m.date)}` +
      (pending ? '<span class="review-chip">Awaiting review</span>' : '') + '</td>' +
      `<td><span class="dot" style="background:${pmBand(m.inside).color}"></span>${m.inside}</td>` +
      `<td><span class="dot" style="background:${pmBand(m.out).color}"></span>${m.out}</td><td>${m.co2}</td></tr>`;
    return `<table class="mtable"><thead><tr><th>Date</th><th>Inside</th><th>Outside</th><th>CO₂</th></tr></thead><tbody>` +
      p.pending.map((m) => row(m, true)).join('') + p.ms.map((m) => row(m, false)).join('') +
      `<tr class="unit"><td></td><td>µg/m³</td><td>µg/m³</td><td>ppm</td></tr></tbody></table>`;
  }

  function renderPlace() {
    const p = byId.get(state.selected);
    const body = $('sheetBody');
    if (!p) return;
    const meta = [KIND_LABEL[p.kind] || 'Place', p.street, fmtDist(p.cur.dist)].filter(Boolean).map(esc).join(' · ');
    const saved = state.saved.has(p.id);
    const outBand = pmBand(p.cur.out);
    let html =
      `<div class="place-head"><h2>${esc(p.name)}</h2><button class="close-btn" type="button" data-act="close" aria-label="Close">✕</button></div>` +
      `<div class="place-meta">${meta}</div>` +
      (p.cleanAir ? `<div class="badge-cas"><i><svg viewBox="0 0 24 24"><path d="${STAR_PATH}" fill="#fff"/></svg></i>Clean Air Space</div>` : '');

    if (p.ratio == null) {
      html +=
        `<div class="compare">${cmpTile('Inside', '–', '', { color: '#E9ECEF', label: 'Not measured yet' })}` +
        `${cmpTile('Outside here', Math.round(p.cur.out), 'µg/m³', outBand)}</div>` +
        (p.pending.length
          ? `<div class="unmeasured"><div class="verdict-mascot" id="placeMascot"></div><div><strong>Thanks for measuring</strong>` +
            `<p>Your measurement is awaiting review. It shows on the map once our team has checked it.</p></div></div>` +
            `<div class="section-title">Measurements</div>${measurementTable(p)}`
          : `<div class="unmeasured"><div class="verdict-mascot" id="placeMascot"></div><div><strong>Be the first to measure</strong>` +
            `<p>Nobody has measured the air here yet. Take an AirGradient Go inside and help others find clean air.</p></div></div>`);
    } else {
      const inBand = pmBand(p.cur.est);
      const v = p.cur.verdict;
      // Sealed spaces hold a steady indoor level, so today's share kept out depends on the outdoor air.
      const kept = Math.round((1 - (p.sealed ? p.cur.est / p.cur.out : p.ratio)) * 100);
      const keptPolluted = Math.round((1 - p.ratio) * 100);
      const vText = v === 'cleaner'
        ? `<strong>Cleaner than outside</strong>Keeps out about ${kept}% of outside particles`
        : v === 'worse'
          ? (p.sealed
            ? '<strong>Clean air inside</strong>Filtered air stays below 5 µg/m³ on any day'
            : '<strong>More particles than outside</strong>Indoor sources such as cooking or smoking add to the outside air')
          : `<strong>About the same as outside</strong>${p.sealed
            ? 'Filtered air stays below 5 µg/m³, also on polluted days'
            : p.ratio < 0.85 ? `Keeps out about ${keptPolluted}% of outside particles, which matters on polluted days` : 'Outside air comes in freely'}`;
      const last = p.ms[0];
      const cb = co2Band(p.co2);
      html +=
        `<div class="compare">${cmpTile('Inside (est.)', p.cur.est, 'µg/m³', inBand)}${cmpTile('Outside here', Math.round(p.cur.out), 'µg/m³', outBand)}</div>` +
        `<div class="verdict ${v}"><div class="verdict-mascot" id="placeMascot"></div><div class="verdict-text">${vText}</div></div>` +
        (p.cleanAir ? offerHTML() : '') +
        `<div class="facts">` +
        `<div class="fact"><span class="fact-dot" style="background:${cb.color}"></span><span>CO₂ ${p.co2} ppm · ${esc(cb.label)}</span></div>` +
        `<div class="fact"><span class="fact-dot" style="background:var(--brand)"></span><span>Last measured ${fmtDate(last.date)}</span></div>` +
        `<div class="fact"><span class="fact-dot" style="background:${p.purifierSeen ? 'var(--reward)' : 'var(--neutral)'}"></span><span>Air purifier seen in ${p.purifierSeen} of ${p.ms.length} measurement${p.ms.length > 1 ? 's' : ''}</span></div>` +
        `</div>` +
        (p.cleanAir ? systemHTML() : '') +
        `<div class="section-title">Measurements</div>${measurementTable(p)}`;
    }
    html +=
      `<div class="actions">` +
      `<a class="act" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M3 11 21 3l-8 18-2-8-8-2Z"/></svg>Directions</a>` +
      `<button class="act${saved ? ' saved' : ''}" type="button" data-act="save" aria-pressed="${saved}"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>${saved ? 'Saved' : 'Save'}</button>` +
      `<button class="act primary" type="button" data-act="measure"><svg viewBox="0 0 24 24"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="5"/></svg>Measure</button>` +
      `</div>` + ATTRIBUTION;

    const keepScroll = body.dataset.place === p.id ? body.scrollTop : 0;
    body.innerHTML = html;
    body.dataset.place = p.id;
    body.scrollTop = keepScroll;
    const mascot = p.ratio == null ? 'mascot_idea' : pmBand(p.cur.est).mascot;
    mountMascot($('placeMascot'), mascot);
  }

  function renderSheet() {
    const sheet = $('sheet');
    sheet.dataset.state = state.sheet;
    $('app').classList.toggle('focus', state.sheet !== 'peek');
    $('app').classList.toggle('place-open', state.sheet === 'place');
    if (state.sheet === 'place') renderPlace();
    else { $('sheetBody').dataset.place = ''; renderList(); }
  }

  function renderPanel() {
    const b = pmBand(state.pm);
    $('pmNum').textContent = Math.round(state.pm);
    const chip = $('pmCat');
    chip.textContent = b.label;
    chip.style.background = b.color;
    chip.style.color = textOn(b.color);
    $('pmSlider').value = state.pm;
    document.querySelectorAll('.presets button').forEach((btn) => btn.setAttribute('aria-pressed', String(Number(btn.dataset.pm) === state.pm)));
    const sel = $('locSelect');
    let custom = sel.querySelector('option[value="custom"]');
    if (state.user.id === 'custom') {
      if (!custom) { custom = new Option('Custom location (on map)', 'custom'); sel.add(custom, 0); }
      sel.value = 'custom';
    } else {
      if (custom) custom.remove();
      sel.value = state.user.id;
    }
  }

  function renderChips() {
    $('chips').innerHTML = GROUPS.map((g) =>
      `<button class="chip" type="button" data-group="${g.id}" aria-pressed="${state.group === g.id}">` +
      (g.icon ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${g.icon}"/></svg>` : '') + `${esc(g.label)}</button>`).join('');
  }

  function renderLegend() {
    const bands = state.mode === 'co2' ? CO2_BANDS : PM_BANDS;
    const title = state.mode === 'co2' ? 'Indoor CO₂ (ppm)' : 'PM2.5 (µg/m³)';
    let lo = 0;
    const items = bands.map((b) => {
      const range = b.max === Infinity ? `${lo}+` : `${lo}–${b.max}`;
      lo = state.mode === 'co2' ? b.max + 1 : Math.round((b.max + 0.1) * 10) / 10;
      return `<div class="legend-item"><i style="background:${b.color}"></i><span>${esc(b.short || b.label)} <span style="color:var(--ink-2)">${range}</span></span></div>`;
    }).join('');
    const fakeHouse = (color, label, star) => {
      const tc = label === '–' ? '#fff' : textOn(color);
      return `<span class="house" aria-hidden="true"><svg viewBox="0 0 36 36"><path d="${HOUSE_PATH}" fill="${color}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg><b style="color:${tc}">${label}</b>` +
        (star ? `<span class="star"><svg viewBox="0 0 24 24"><path d="${STAR_PATH}" fill="#fff"/></svg></span>` : '') + '</span>';
    };
    $('legend').innerHTML =
      `<h3>${title}<button class="close-btn" type="button" data-act="legend-close" aria-label="Close legend">✕</button></h3>` +
      `<div class="legend-grid">${items}</div>` +
      `<div class="legend-markers">` +
      `<div class="lm">${fakeHouse('#58D32F', state.mode === 'co2' ? '620' : '6', false)}<span>Indoor place. ${state.mode === 'co2' ? 'Typical measured CO₂.' : 'Estimated PM2.5 inside, given the outdoor air right now.'}</span></div>` +
      `<div class="lm">${fakeHouse('#58D32F', state.mode === 'co2' ? '590' : '4', true)}<span>Clean Air Space: consistently much cleaner than outside, also on polluted days.</span></div>` +
      `<div class="lm">${fakeHouse(GREY, '–', false)}<span>Not measured yet.</span></div>` +
      `<div class="lm"><span class="donut" style="width:34px;height:34px;flex:none;cursor:default">${donutHTML(Object.assign({ point_count: 12, stars: 2 }, ...[3, 4, 2, 2, 0, 0, 1].map((n, i) => ({ [`b${i}`]: n }))))}</span>` +
      `<span>Group of places. The ring shows how many are in each colour; the star counts Clean Air Spaces. Tap to zoom in.</span></div>` +
      `<div class="lm"><span class="layer-swatch" style="width:32px;height:24px;flex:none"></span><span>Outdoor air layer: PM2.5 outside, from outdoor monitors.</span></div>` +
      `</div>`;
  }

  function renderAll() {
    recompute();
    renderSheet();
    renderPanel();
    refreshMap();
    if (!$('legend').hidden) renderLegend();
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  let toastTimer;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3800);
  }

  function setUser(loc, fly) {
    state.user = { ...loc };
    if (userMarker) userMarker.setLngLat([loc.lon, loc.lat]);
    renderAll();
    if (fly && mapReady) map.easeTo({ center: [loc.lon, loc.lat], zoom: Math.max(map.getZoom(), 14.2), padding: mapPadding() });
  }

  function setPicking(on) {
    state.picking = on;
    $('pickHint').hidden = !on;
    $('pickBtn').setAttribute('aria-pressed', String(on));
    if (mapReady) map.getCanvas().style.cursor = on ? 'crosshair' : '';
    if (on) closePanelDrawer();
  }

  function mapPadding() {
    if (isDesktop()) {
      const panelOpen = !$('panel').classList.contains('collapsed');
      return { top: 60, bottom: 60, left: 60, right: panelOpen ? 400 : 60 };
    }
    const appH = $('app').clientHeight;
    const sheetH = state.sheet === 'peek' ? 216 : appH * (state.sheet === 'place' ? 0.64 : 0.74);
    return { top: state.sheet === 'peek' ? 250 : 110, bottom: sheetH + 10, left: 20, right: 20 };
  }

  function selectPlace(id, fly = true) {
    const p = byId.get(id);
    if (!p) return;
    if (!inGroup(p)) { state.group = 'all'; renderChips(); }
    state.selected = id;
    state.sheet = 'place';
    renderAll();
    $('sheetBody').scrollTop = 0;
    if (fly && mapReady) {
      map.easeTo({ center: [p.lon, p.lat], zoom: Math.max(map.getZoom(), 15), padding: mapPadding(), duration: 600 });
    }
  }

  function closePlace() {
    state.selected = null;
    state.sheet = 'peek';
    renderAll();
  }

  function setSheet(s) {
    state.sheet = s;
    if (s !== 'place') state.selected = null;
    renderAll();
  }

  // Outdoor slider and presets
  let pmFrame;
  $('pmSlider').addEventListener('input', (e) => {
    state.pm = Number(e.target.value);
    cancelAnimationFrame(pmFrame);
    pmFrame = requestAnimationFrame(renderAll);
  });
  document.querySelector('.presets').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-pm]');
    if (!btn) return;
    state.pm = Number(btn.dataset.pm);
    renderAll();
  });

  // Location controls
  const locSelect = $('locSelect');
  LOCATIONS.forEach((l) => locSelect.add(new Option(l.label, l.id)));
  locSelect.addEventListener('change', () => {
    const loc = LOCATIONS.find((l) => l.id === locSelect.value);
    if (loc) setUser(loc, true);
  });
  $('pickBtn').addEventListener('click', () => setPicking(!state.picking));
  $('gpsBtn').addEventListener('click', () => {
    if (!navigator.geolocation) { toast('Location is not available in this browser.'); return; }
    navigator.geolocation.getCurrentPosition((pos) => {
      const { longitude: lon, latitude: lat } = pos.coords;
      const [[w, s], [e, n]] = MAX_BOUNDS;
      if (lon < w || lon > e || lat < s || lat > n) {
        toast('Your GPS position is outside central Chiang Mai, so your location stays where it is. Pick a spot on the map instead.');
        return;
      }
      setUser({ id: 'custom', label: 'Your GPS position', lon, lat }, true);
    }, () => toast('Could not get your GPS position. Pick a spot on the map instead.'), { enableHighAccuracy: true, timeout: 10000 });
  });

  // App controls
  $('chips').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-group]');
    if (!btn) return;
    state.group = btn.dataset.group;
    if (state.selected && !inGroup(byId.get(state.selected))) { state.selected = null; state.sheet = 'peek'; }
    renderChips();
    renderAll();
  });

  $('paramBtn').addEventListener('click', () => {
    state.mode = state.mode === 'pm' ? 'co2' : 'pm';
    document.querySelectorAll('#paramBtn span').forEach((s) => s.classList.toggle('on', s.dataset.mode === state.mode));
    renderAll();
  });

  $('infoBtn').addEventListener('click', () => {
    const lg = $('legend');
    lg.hidden = !lg.hidden;
    if (!lg.hidden) renderLegend();
  });
  $('legend').addEventListener('click', (e) => {
    if (e.target.closest('[data-act="legend-close"]')) $('legend').hidden = true;
  });

  $('locateBtn').addEventListener('click', () => {
    if (mapReady) map.easeTo({ center: [state.user.lon, state.user.lat], zoom: Math.max(map.getZoom(), 14.2), padding: mapPadding() });
  });

  $('sheetHandle').addEventListener('click', () => {
    if (state.sheet === 'peek') setSheet('full');
    else if (state.sheet === 'place') closePlace();
    else setSheet('peek');
  });
  // Swipe on the handle area to expand or collapse
  (() => {
    let y0 = null;
    const handle = $('sheetHandle');
    handle.addEventListener('pointerdown', (e) => { y0 = e.clientY; });
    window.addEventListener('pointerup', (e) => {
      if (y0 == null) return;
      const dy = e.clientY - y0;
      y0 = null;
      if (Math.abs(dy) < 30) return;
      if (dy < 0 && state.sheet === 'peek') setSheet('full');
      else if (dy > 0 && state.sheet === 'place') closePlace();
      else if (dy > 0 && state.sheet === 'full') setSheet('peek');
    });
  })();

  $('sheetBody').addEventListener('click', (e) => {
    const row = e.target.closest('.row[data-id]');
    if (row) { selectPlace(row.dataset.id); return; }
    const sortBtn = e.target.closest('button[data-sort]');
    if (sortBtn) { state.sort = sortBtn.dataset.sort; renderAll(); return; }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    const p = byId.get(state.selected);
    switch (act.dataset.act) {
      case 'expand': setSheet('full'); break;
      case 'close': closePlace(); break;
      case 'save':
        if (!p) break;
        if (state.saved.has(p.id)) state.saved.delete(p.id); else state.saved.add(p.id);
        try { localStorage.setItem('cas-saved', JSON.stringify([...state.saved])); } catch (err) { /* storage unavailable */ }
        renderPlace();
        toast(state.saved.has(p.id) ? `Saved ${p.name}. You'll be told when its air changes.` : `Removed ${p.name} from saved places.`);
        break;
      case 'measure':
        if (p) startFlow(p.id);
        break;
      case 'copy-code': {
        const copied = () => toast(`Code ${DISCOUNT_CODE} copied. Show it at the counter for 10% off your coffee.`);
        const select = () => {
          const range = document.createRange();
          range.selectNodeContents(act.querySelector('code'));
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          toast(`Your code is ${DISCOUNT_CODE}. Show it at the counter for 10% off your coffee.`);
        };
        if (navigator.clipboard) navigator.clipboard.writeText(DISCOUNT_CODE).then(copied, select);
        else select();
        break;
      }
      default: break;
    }
  });

  // Search
  const search = $('search');
  const results = $('searchResults');
  function renderSearch() {
    const q = search.value.trim().toLowerCase();
    if (!q) { results.hidden = true; return; }
    const hits = places
      .filter((p) => p.name.toLowerCase().includes(q) || (KIND_LABEL[p.kind] || '').toLowerCase().includes(q))
      .sort((a, b) => a.cur.dist - b.cur.dist)
      .slice(0, 8);
    results.innerHTML = hits.length
      ? hits.map((p) => `<button type="button" data-id="${esc(p.id)}">${houseHTML(p, 32)}<div style="min-width:0"><div class="sr-name">${esc(p.name)}</div>` +
        `<div class="sr-meta">${esc(KIND_LABEL[p.kind] || 'Place')} · ${fmtDist(p.cur.dist)}</div></div></button>`).join('')
      : '<div class="search-empty">No places match. Try a café, mall or museum name.</div>';
    results.hidden = false;
  }
  search.addEventListener('input', renderSearch);
  search.addEventListener('focus', renderSearch);
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { search.value = ''; results.hidden = true; search.blur(); }
    if (e.key === 'Enter') {
      const first = results.querySelector('button[data-id]');
      if (first) first.click();
    }
  });
  results.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    results.hidden = true;
    search.value = '';
    search.blur();
    selectPlace(btn.dataset.id);
  });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('#searchBox')) results.hidden = true;
  });

  // Simulation controls: a drawer on phones, a collapsible floating card in the desktop layout
  function closePanelDrawer() { $('panel').classList.remove('open'); }
  $('panelOpen').addEventListener('click', () => {
    $('panel').classList.add('open');
    $('panel').classList.remove('collapsed');
  });
  $('panelClose').addEventListener('click', () => {
    closePanelDrawer();
    $('panel').classList.add('collapsed');
  });

  // Layout switch in the brand bar. #desktop or #phone in the link opens that layout.
  const wideScreen = window.matchMedia('(min-width: 880px)');
  function isDesktop() {
    return document.body.classList.contains('desktop') && wideScreen.matches;
  }
  function setView(view, remember) {
    document.body.classList.toggle('desktop', view === 'desktop');
    document.querySelectorAll('.view-toggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    if (remember) {
      try { localStorage.setItem('cas-view', view); } catch (e) { /* storage unavailable */ }
      history.replaceState(null, '', `#${view}`);
    }
    if (state.sheet === 'full' && view === 'desktop') state.sheet = 'peek';
    renderAll();
    requestAnimationFrame(() => { if (mapReady) map.resize(); });
  }
  document.querySelector('.view-toggle').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-view]');
    if (btn) setView(btn.dataset.view, true);
  });
  wideScreen.addEventListener('change', () => {
    renderAll();
    requestAnimationFrame(() => { if (mapReady) map.resize(); });
  });
  let savedView = null;
  try { savedView = localStorage.getItem('cas-view'); } catch (e) { /* storage unavailable */ }
  const hashView = ['desktop', 'phone'].includes(location.hash.slice(1)) ? location.hash.slice(1) : null;
  document.body.classList.toggle('desktop', (hashView || savedView) === 'desktop');
  document.querySelectorAll('.view-toggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === (hashView || savedView || 'phone'))));
  map.resize();
  new ResizeObserver(() => map.resize()).observe($('map'));

  // ---------------------------------------------------------------------------
  // Simulated indoor measurement with an AirGradient Go
  // Follows the iOS Spot flow (prepare → questions while Go measures → review → submitted),
  // without the outdoor, calibration and place-type steps.
  // ---------------------------------------------------------------------------

  const SETTLE_S = 15;
  const INTERVAL_S = 3;
  const SAMPLE_TARGET = 10;
  const FAST = { settle: 3, interval: 0.7 };
  const LEVEL_THRESHOLDS = [0, 20, 60, 150, 300];
  const QUESTION_KEYS = ['area', 'occupancy', 'doors', 'purifier', 'activities', 'photo'];
  const DUMMY_PHOTO = 'assets/dummy-photo.jpg';
  const DEFAULT_PROFILE_NAME = 'CleanAirCM';

  const QUESTION_TITLE = {
    area: 'Which part of the place are you measuring in?',
    occupancy: 'How occupied is the room or area you are measuring?',
    doors: 'During this measurement, were nearby doors or windows to outdoors open?',
    purifier: 'Did you notice a portable air cleaner in this area?',
    activities: 'Nearby activities',
    photo: 'Add a photo of this space',
  };
  const DETAIL_LABEL = {
    area: 'Area type', occupancy: 'Occupancy', doors: 'Doors and windows',
    purifier: 'Portable air cleaner', activities: 'Nearby activities', photo: 'Photo',
  };
  const ANSWER_LABEL = {
    seating: 'Main seating area', separate_room: 'Separate room', counter: 'Counter / ordering area',
    covered_outdoor: 'Covered outdoor seating', concourse: 'Main concourse / atrium', food_court: 'Food court',
    shop: 'Inside a shop', corridor: 'Corridor', indoor_car_park: 'Indoor car park', lobby: 'Lobby',
    guest_room: 'Guest room', dining_area: 'Restaurant / dining area', meeting_room: 'Meeting room',
    waiting_area: 'Waiting area', treatment_room: 'Consultation / treatment room', ward: 'Ward',
    cafeteria: 'Cafeteria', main_area: 'Main occupied area', other: 'Other', unknown: 'Not sure',
    only_me: 'Only me', mostly_empty: 'Mostly empty', half_full: 'Around half full', mostly_full: 'Mostly full',
    open_continuously: 'Open continuously', open_frequently: 'Opening and closing frequently',
    closed_throughout: 'Closed throughout', no_outside_openings: 'No outside doors/windows nearby',
    purifier_running: 'Apparently running', purifier_off: 'Appears off', purifier_unsure: 'Unsure whether running',
    none_noticed: 'None noticed', source_cooking: 'Cooking', source_smoking: 'Smoking or vaping',
    source_candles: 'Candles, incense or other burning', source_dust: 'Construction or other dust-producing work',
    source_exhaust: 'Running vehicles / exhaust',
  };
  // Answer icons as in SpotAnswerGlyphs.swift. Area answers have none and show as plain rows.
  const ANSWER_GLYPH = {
    only_me: 'spot.occupancy.alone', mostly_empty: 'spot.occupancy.empty', half_full: 'spot.occupancy.some',
    mostly_full: 'spot.occupancy.crowded', open_continuously: 'spot.doors.open', open_frequently: 'spot.doors.often',
    closed_throughout: 'spot.doors.closed', no_outside_openings: 'spot.doors.none', purifier_running: 'spot.purifier',
    purifier_off: 'sys.power.circle', purifier_unsure: 'sys.question.circle', source_cooking: 'spot.activity.cooking',
    source_smoking: 'spot.activity.smoking', source_candles: 'spot.activity.burning', source_dust: 'spot.activity.construction',
    source_exhaust: 'spot.activity.vehicles', other: 'spot.answer.other', none_noticed: 'sys.check.circle',
  };
  // Place icons as in SpotSpaceType.glyph.
  const PLACE_GLYPH = {
    cafe: 'spot.place.coffee', restaurant: 'spot.place.restaurant', bar: 'spot.place.bar', mall: 'spot.place.mall',
    shop: 'spot.place.shop', supermarket: 'spot.place.supermarket', gym: 'spot.place.gym', coworking: 'spot.indoor',
    library: 'sys.books', hotel: 'sys.bed', hospital: 'sys.cross.case', clinic: 'sys.cross.case', cinema: 'sys.film',
    theatre: 'sys.masks', museum: 'sys.columns', sportsCentre: 'sys.court', other: 'spot.answer.other',
  };
  // Stand-ins for the SF Symbols the app uses, drawn in the same two-tone style on the 48-unit grid.
  const SYSTEM_ICONS = {
    'sys.power.circle': '<circle class="s" cx="24" cy="24" r="20"/><path class="p k" d="M24 13v10" stroke-width="4"/><path class="p k" d="M17 17.2a10 10 0 1 0 14 0" stroke-width="4"/>',
    'sys.question.circle': '<circle class="s" cx="24" cy="24" r="20"/><path class="p k" d="M18.8 19a5.3 5.3 0 1 1 7.4 4.9c-1.3.6-2.2 1.6-2.2 3.1v1" stroke-width="4"/><circle class="p" cx="24" cy="34.5" r="2.6"/>',
    'sys.check.circle': '<circle class="s" cx="24" cy="24" r="20"/><path class="p k" d="M15 24.5l6.5 6.5L33.5 18" stroke-width="4.5"/>',
    'sys.wind': '<path class="p k" d="M6 19h21a6 6 0 1 0-6-6" stroke-width="4"/><path class="s k" d="M6 27h28a6 6 0 1 1-6 6" stroke-width="4"/><path class="p k" d="M6 35h11" stroke-width="4"/>',
    'sys.books': '<rect class="p" x="6" y="8" width="9" height="34" rx="3"/><rect class="s" x="17" y="12" width="9" height="30" rx="3"/><path class="p" d="M29 13.5l7.5-2 7 29-7.5 2z"/>',
    'sys.bed': '<rect class="p" x="4" y="12" width="5" height="30" rx="2.5"/><rect class="s" x="12" y="17" width="12" height="8" rx="4"/><rect class="p" x="4" y="27" width="40" height="9" rx="3"/><rect class="p" x="39" y="30" width="5" height="12" rx="2.5"/>',
    'sys.cross.case': '<path class="p k" d="M18 13V9.5a2.5 2.5 0 0 1 2.5-2.5h7a2.5 2.5 0 0 1 2.5 2.5V13" stroke-width="3.5"/><rect class="p" x="4" y="13" width="40" height="29" rx="7"/><path class="s" d="M21 19h6v6h6v6h-6v6h-6v-6h-6v-6h6z"/>',
    'sys.film': '<rect class="p" x="6" y="7" width="36" height="34" rx="6"/><rect class="s" x="14" y="13" width="20" height="22" rx="3"/><circle class="s" cx="10" cy="14" r="1.8"/><circle class="s" cx="10" cy="24" r="1.8"/><circle class="s" cx="10" cy="34" r="1.8"/><circle class="s" cx="38" cy="14" r="1.8"/><circle class="s" cx="38" cy="24" r="1.8"/><circle class="s" cx="38" cy="34" r="1.8"/>',
    'sys.masks': '<path class="s" d="M21 16h21v11a10.5 10.5 0 0 1-21 0z"/><path class="p" d="M6 8h21v11a10.5 10.5 0 0 1-21 0z"/>',
    'sys.columns': '<path class="p" d="M24 4l20 10H4z"/><rect class="s" x="8" y="17" width="5" height="19" rx="2"/><rect class="s" x="16.5" y="17" width="5" height="19" rx="2"/><rect class="s" x="26.5" y="17" width="5" height="19" rx="2"/><rect class="s" x="35" y="17" width="5" height="19" rx="2"/><rect class="p" x="4" y="38" width="40" height="6" rx="3"/>',
    'sys.court': '<rect class="p" x="4" y="10" width="40" height="28" rx="6"/><rect class="s" x="8" y="14" width="32" height="20" rx="3"/><rect class="p" x="22.5" y="14" width="3" height="20" rx="1.5"/><circle class="p" cx="24" cy="24" r="4.5"/>',
  };
  // Two-tone Spot icon: "active" in the brand blues, "inactive" in greys (SpotIcon.Style).
  function spotIcon(name, style = 'active', size = 28) {
    const shapes = (window.SPOT_ICONS && window.SPOT_ICONS[name]) || SYSTEM_ICONS[name];
    if (!shapes) return '';
    return `<svg class="spot-icon ${style}" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">${shapes}</svg>`;
  }

  function spaceTypeOf(p) {
    const byKind = {
      cafe: 'cafe', bakery: 'cafe', ice_cream: 'cafe', restaurant: 'restaurant', fast_food: 'restaurant', food_court: 'restaurant',
      bar: 'bar', pub: 'bar', mall: 'mall', department_store: 'mall', supermarket: 'supermarket', convenience: 'shop', books: 'shop',
      museum: 'museum', gallery: 'museum', arts_centre: 'museum', theatre: 'theatre', cinema: 'cinema', library: 'library',
      hotel: 'hotel', hospital: 'hospital', clinic: 'clinic', fitness_centre: 'gym', sports_centre: 'sportsCentre',
      coworking_space: 'coworking', coworking: 'coworking',
    };
    return byKind[p.kind] || 'other';
  }
  // Same area options per space type as SpotQuestions.areas in the apps.
  function areaOptions(type) {
    const main = {
      mall: ['concourse', 'food_court', 'shop', 'corridor', 'indoor_car_park'],
      cafe: ['seating', 'separate_room', 'counter', 'covered_outdoor'],
      restaurant: ['seating', 'separate_room', 'counter', 'covered_outdoor'],
      bar: ['seating', 'separate_room', 'counter', 'covered_outdoor'],
      hotel: ['lobby', 'guest_room', 'dining_area', 'corridor', 'meeting_room'],
      hospital: ['waiting_area', 'treatment_room', 'ward', 'corridor', 'cafeteria'],
      clinic: ['waiting_area', 'treatment_room', 'ward', 'corridor', 'cafeteria'],
    }[type] || ['main_area', 'separate_room', 'lobby', 'corridor'];
    return [...main, 'other', 'unknown'];
  }
  function answerOptions(key) {
    switch (key) {
      case 'area': return areaOptions(flow.type);
      case 'occupancy': return ['only_me', 'mostly_empty', 'half_full', 'mostly_full', 'unknown'];
      case 'doors': return ['open_continuously', 'open_frequently', 'closed_throughout', 'no_outside_openings', 'unknown'];
      case 'purifier': return ['purifier_running', 'purifier_off', 'purifier_unsure', 'none_noticed', 'unknown'];
      case 'activities': return ['source_cooking', 'source_smoking', 'source_candles', 'source_dust', 'source_exhaust', 'other', 'none_noticed', 'unknown'];
      default: return [];
    }
  }

  const flow = { open: false };
  let flowTimer = null;

  const flowPlace = () => byId.get(flow.placeId);
  const flowSpeed = () => ($('fastToggle').checked ? FAST : { settle: SETTLE_S, interval: INTERVAL_S });
  const meanOf = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const tintFill = (color) => `color-mix(in srgb, ${color} 24%, #fff)`;

  function startFlow(id) {
    Object.assign(flow, {
      open: true, placeId: id, type: spaceTypeOf(byId.get(id)), step: 'prepare', phase: 'idle',
      samples: [], q: 0, answers: { activities: [] }, photo: null, questionsDone: false,
      anonymous: false, error: '', submitting: false,
    });
    $('legend').hidden = true;
    $('mDone').hidden = true;
    $('measure').hidden = false;
    renderFlow();
  }

  function closeFlow() {
    clearInterval(flowTimer);
    flowTimer = null;
    flow.open = false;
    flow.photo = null;
    $('measure').hidden = true;
    $('mConfirm').hidden = true;
    $('mDone').hidden = true;
  }

  function startCapture() {
    const speed = flowSpeed();
    flow.step = 'measure';
    flow.phase = 'settling';
    flow.settleStart = Date.now();
    flow.settleEnd = flow.settleStart + speed.settle * 1000;
    clearInterval(flowTimer);
    flowTimer = setInterval(tickFlow, 200);
    renderFlow();
  }

  // A reading near the place's indoor level right now, so the outdoor slider also moves the readings.
  function simulatedReading(p) {
    const out = state.pm * p.m;
    const base = p.sealed ? p.indoor
      : p.ratio != null ? out * p.ratio
        : out * p.prof.ratio + p.prof.source * 0.6;
    return {
      pm: Math.max(0.3, Math.round(base * (0.9 + Math.random() * 0.2) * 10) / 10),
      co2: Math.round((p.co2 ?? p.prof.co2) * (0.97 + Math.random() * 0.06)),
    };
  }

  function tickFlow() {
    const now = Date.now();
    if (flow.phase === 'settling' && now >= flow.settleEnd) {
      flow.phase = 'collecting';
      flow.nextSample = now;
    }
    if (flow.phase === 'collecting' && now >= flow.nextSample) {
      flow.samples.push(simulatedReading(flowPlace()));
      flow.nextSample = now + flowSpeed().interval * 1000;
      if (flow.samples.length >= SAMPLE_TARGET) {
        flow.phase = 'complete';
        clearInterval(flowTimer);
        flowTimer = null;
        if (flow.questionsDone) { goToReview(); return; }
      }
    }
    renderStatus();
  }

  function goToReview() {
    flow.step = 'review';
    renderFlow();
  }

  function captureMeans() {
    return {
      pm: Math.round(meanOf(flow.samples.map((s) => s.pm)) * 10) / 10,
      co2: Math.round(meanOf(flow.samples.map((s) => s.co2))),
    };
  }

  function renderStatus() {
    const box = $('mStatus');
    box.hidden = flow.step !== 'measure';
    if (box.hidden) return;
    const p = flowPlace();
    const n = flow.samples.length;
    const complete = flow.phase === 'complete';
    const settling = flow.phase === 'settling';
    const latest = complete ? captureMeans() : flow.samples[n - 1];
    $('mStatusPlace').textContent = p.name;
    $('mStatusTitle').textContent = complete ? 'Measurement complete' : settling ? 'Settling period' : 'Measuring…';
    const trailing = $('mStatusTrailing');
    if (settling) {
      const left = Math.max(0, Math.ceil((flow.settleEnd - Date.now()) / 1000));
      trailing.textContent = `0:${String(left).padStart(2, '0')}`;
    } else if (complete) {
      trailing.innerHTML = '<span class="m-check" aria-label="Complete">✓</span>';
    } else {
      trailing.textContent = `${n} / ${SAMPLE_TARGET}`;
    }
    $('mProgress').hidden = !settling;
    if (settling) {
      const done = (Date.now() - flow.settleStart) / (flow.settleEnd - flow.settleStart);
      $('mProgress').firstElementChild.style.width = `${Math.min(100, done * 100)}%`;
    }
    $('mStatusHint').hidden = !settling;
    $('mMetrics').hidden = settling;
    $('mSegments').hidden = settling;
    if (!settling && latest) {
      $('mPm').textContent = `${complete ? 'Average ' : ''}PM2.5 ${latest.pm.toFixed(1)} µg/m³`;
      $('mCo2').textContent = `CO₂ ${latest.co2} ppm`;
    } else if (!settling) {
      $('mPm').textContent = 'PM2.5 — µg/m³';
      $('mCo2').textContent = 'CO₂ — ppm';
    }
    $('mSegments').innerHTML = Array.from({ length: SAMPLE_TARGET }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
    const band = latest && !settling ? pmBand(latest.pm) : null;
    box.style.setProperty('--tint', band ? tintFill(band.color) : '#EEF2F6');
    box.style.setProperty('--seg', band ? band.color : 'var(--brand)');
    mountMascot($('mStatusMascot'), 'mascot_reading');
  }

  function prepareHTML(p) {
    return `<div class="m-place-card">${spotIcon(PLACE_GLYPH[flow.type] || PLACE_GLYPH.other, 'active', 38)}` +
      `<div class="m-place-text"><strong>${esc(p.name)}</strong><span>${esc(KIND_LABEL[p.kind] || 'Place')}</span></div>` +
      `<div class="m-mascot-64" id="mPrepMascot"></div></div>` +
      `<h3 class="m-title">Ready to measure</h3>` +
      `<div class="m-bubble">Place Go where you want to check the air.</div>` +
      `<ul class="m-instructions">` +
      `<li>${spotIcon('spot.go.still', 'active', 30)}<span>Keep Go still with its air openings clear.</span></li>` +
      `<li>${spotIcon('sys.wind', 'active', 30)}<span>Keep it away from your breath, vents, and other direct sources of airflow.</span></li>` +
      `<li>${spotIcon('spot.settle', 'active', 30)}<span>Go will settle for ${SETTLE_S} seconds, then collect ${SAMPLE_TARGET} readings.</span></li>` +
      `</ul>` +
      `<p class="m-note">You can answer questions about the space and take a photo while Go measures.</p>` +
      `<p class="m-footnote">Keep the app open until measurement finishes.</p>`;
  }

  // SpotChoiceTile: a centred icon tile in the grid, or a full-width row with a radio marker.
  function choiceHTML(key, option, layout) {
    const selected = key === 'activities' ? flow.answers.activities.includes(option) : flow.answers[key] === option;
    const glyph = ANSWER_GLYPH[option];
    const icon = glyph ? spotIcon(glyph, selected ? 'active' : 'inactive', layout === 'tile' ? 32 : 26) : '';
    const marker = layout === 'row'
      ? `<span class="m-marker" aria-hidden="true">${selected ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.3l3 3 6-6.3" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'}</span>`
      : '';
    return `<button type="button" class="m-choice ${layout}" data-answer="${option}" aria-pressed="${selected}">` +
      `${icon}<span class="m-choice-label">${esc(ANSWER_LABEL[option] || option)}</span>${marker}</button>`;
  }

  function photoStepHTML() {
    const bubble = '<div class="m-bubble">Help others recognize where you measured. Avoid identifiable people.</div>';
    const hint = `<div class="m-reward-hint">${spotIcon('spot.reward.points', 'reward', 22)}<span>A photo makes your measurement easier to review</span></div>`;
    if (!flow.photo) {
      return bubble +
        `<button type="button" class="m-photo-empty" data-flow="photo" aria-label="Take photo">${spotIcon('spot.photo', 'active', 56)}` +
        `<span class="m-photo-mascot" id="mPhotoMascot" aria-hidden="true"></span></button>` + hint;
    }
    return bubble +
      `<div class="m-photo-wrap"><img class="m-photo" src="${flow.photo}" alt="Your photo of the space"><span class="m-photo-ok" aria-hidden="true">✓</span></div>` +
      `<div class="m-photo-actions"><button type="button" data-flow="photo">${spotIcon('spot.photo', 'active', 20)}Retake photo</button>` +
      `<button type="button" class="danger" data-flow="remove-photo">Remove photo</button></div>` + hint;
  }

  function questionHTML() {
    const key = QUESTION_KEYS[flow.q];
    let html = `<div class="m-qprog">Question ${flow.q + 1} of ${QUESTION_KEYS.length}</div>` +
      `<div class="m-qhead"><h3>${esc(QUESTION_TITLE[key])}</h3>${key === 'photo' ? '' : '<div class="m-mascot-58" id="mQMascot"></div>'}</div>`;
    if (key === 'photo') return html + photoStepHTML();
    const options = answerOptions(key);
    // Same split as the app: activity sources (and "other") as tiles; elsewhere a grid only when
    // every main answer has an icon and there are at most four. "Not sure" always sits apart as a row.
    const tiles = key === 'activities'
      ? options.filter((o) => o.startsWith('source_') || o === 'other')
      : (() => {
        const main = options.filter((o) => o !== 'unknown');
        return main.length <= 4 && main.every((o) => ANSWER_GLYPH[o]) ? main : [];
      })();
    if (key === 'activities') html += '<p class="m-sub">Select any you noticed. Leave blank if not reported.</p>';
    if (tiles.length) html += `<div class="m-grid">${tiles.map((o) => choiceHTML(key, o, 'tile')).join('')}</div>`;
    html += `<div class="m-rows">${options.filter((o) => !tiles.includes(o)).map((o) => choiceHTML(key, o, 'row')).join('')}</div>`;
    return html;
  }

  function detailsDoneHTML() {
    return `<div class="m-details-done"><div class="m-mascot-130" id="mDetailsMascot"></div>` +
      `<h3>Space details complete</h3>` +
      `<div class="m-bubble center">Keep Go still. Each new reading advances the counter.</div>` +
      `<ul class="m-checklist">${QUESTION_KEYS.map((k, i) => `<li style="--i:${i}"><span class="m-check">✓</span>${DETAIL_LABEL[k]}</li>`).join('')}</ul></div>`;
  }

  function rewardsFor(list) {
    const points = list.length;
    let level = 1;
    LEVEL_THRESHOLDS.forEach((t, i) => { if (points >= t) level = i + 1; });
    const next = LEVEL_THRESHOLDS[level];
    const floor = LEVEL_THRESHOLDS[level - 1];
    const types = new Set(list.map((s) => s.type).filter((t) => t !== 'other'));
    const badges = [];
    if (list.length) badges.push('first');
    if (list.filter((s) => s.type === 'cafe').length >= 3) badges.push('cafe');
    if (types.size >= 5) badges.push('explorer');
    if (list.some((s) => s.co2 < 600 && comparison(s.inside, s.out) === 'cleaner')) badges.push('fresh_air');
    return { points, level, next, progress: next ? (points - floor) / (next - floor) : 1, badges };
  }
  const BADGES = {
    first: ['First measurement', 'Submitted your first public space measurement'],
    cafe: ['Café critic', 'Measured 3 coffee shops'],
    explorer: ['Explorer', 'Measured 5 different types of places'],
    fresh_air: ['Fresh-air finder', 'Found a place with fresh air that is cleaner than outside'],
  };

  function loadSubmissions() {
    try { return JSON.parse(localStorage.getItem('cas-submissions') || '[]'); } catch (e) { return []; }
  }
  function saveSubmissions(list) {
    try { localStorage.setItem('cas-submissions', JSON.stringify(list)); } catch (e) { /* storage unavailable */ }
  }
  let profileName = DEFAULT_PROFILE_NAME;
  try { profileName = localStorage.getItem('cas-profile-name') || DEFAULT_PROFILE_NAME; } catch (e) { /* storage unavailable */ }

  function reviewHTML() {
    const p = flowPlace();
    const means = captureMeans();
    const band = pmBand(means.pm);
    const cb = co2Band(means.co2);
    const out = Math.round(state.pm * p.m);
    const verdict = comparison(means.pm, out);
    const verdictText = { cleaner: 'Cleaner than outside', same: 'About the same as outside', worse: 'More particles than outside' }[verdict];
    const summary = [KIND_LABEL[p.kind], ANSWER_LABEL[flow.answers.area], ANSWER_LABEL[flow.answers.occupancy]]
      .filter((s) => s && s !== 'Not sure').map(esc).join(' · ');
    const maxV = Math.max(means.pm, out, 1);
    const rewards = rewardsFor(loadSubmissions());
    return `<div class="m-result-head" style="background:${tintFill(band.color)}"><div class="m-mascot-88" id="mReviewMascot"></div>` +
      `<div><strong>${esc(p.name)}</strong>${summary ? `<span>${summary}</span>` : ''}` +
      `<em class="m-chip" style="background:${band.color};color:${textOn(band.color)}">${esc(band.label)}</em></div></div>` +
      `<div class="m-tiles">` +
      `<div class="m-tile-metric" style="background:${tintFill(band.color)}"><span>PM2.5</span><b>${means.pm.toFixed(1)} <small>µg/m³</small></b><em>${esc(band.label)}</em></div>` +
      `<div class="m-tile-metric" style="background:${tintFill(cb.color)}"><span>CO₂</span><b>${means.co2} <small>ppm</small></b><em>${esc(cb.label)}</em></div>` +
      `</div>` +
      `<div class="m-compare"><strong>Inside compared with outside</strong>` +
      `<div class="m-bar"><span>Inside</span><i><b style="width:${(means.pm / maxV) * 100}%;background:${band.color}"></b></i><em>${means.pm.toFixed(1)}</em></div>` +
      `<div class="m-bar"><span>Outside</span><i><b style="width:${(out / maxV) * 100}%;background:#9AA3AD"></b></i><em>${out}</em></div>` +
      `<p class="m-verdict ${verdict}">${verdictText}</p>` +
      `<p class="m-footnote">Outside value from nearby outdoor monitors.</p></div>` +
      `<div class="m-submit">` +
      (flow.anonymous ? '' : `<label class="m-field"><span>Public profile name</span><input id="mName" type="text" autocomplete="nickname" placeholder="Public profile name" value="${esc(profileName)}"></label>`) +
      `<div class="m-points"><span>Points: ${rewards.points}</span><em class="m-chip reward">Level ${rewards.level}</em></div>` +
      `<label class="m-toggle"><input type="checkbox" id="mAnon" ${flow.anonymous ? 'checked' : ''}><span class="m-switch" aria-hidden="true"><i></i></span>` +
      `<span>Hide my public profile name for this measurement</span></label>` +
      `<p class="m-footnote">Your submission will display your public profile name and can earn you points. Check this box to hide your name from the public. The submission will remain linked to your AirGradient account.</p>` +
      (flow.error ? `<p class="m-error">${esc(flow.error)}</p>` : '') +
      `</div>`;
  }

  function renderFlow() {
    if (!flow.open) return;
    const p = flowPlace();
    const stepIndex = { prepare: 0, measure: 1, review: 2 }[flow.step];
    $('mTitle').textContent = flow.step === 'review' ? 'Review measurement' : 'Indoor measurement';
    $('mLeft').textContent = flow.step === 'review' ? 'Back' : 'Cancel';
    [...$('mSteps').children].forEach((el, i) => { el.className = i < stepIndex ? 'done' : i === stepIndex ? 'current' : ''; });
    renderStatus();

    const body = $('mBody');
    const footer = $('mFooter');
    let html = '';
    let foot = '';
    if (flow.step === 'prepare') {
      html = prepareHTML(p);
      foot = '<button type="button" class="m-btn primary" data-flow="start">Start measurement</button>';
    } else if (flow.step === 'measure' && !flow.questionsDone) {
      html = questionHTML();
      const isPhoto = QUESTION_KEYS[flow.q] === 'photo';
      foot = isPhoto && !flow.photo
        ? '<button type="button" class="m-btn primary" data-flow="photo">Take photo</button><button type="button" class="m-btn secondary" data-flow="next">Continue without photo</button>'
        : '<button type="button" class="m-btn primary" data-flow="next">Continue</button>';
    } else if (flow.step === 'measure') {
      html = detailsDoneHTML();
    } else {
      html = reviewHTML();
      foot = `<button type="button" class="m-btn primary" data-flow="submit" ${flow.submitting ? 'disabled' : ''}>${flow.submitting ? 'Submitting…' : 'Submit for review'}</button>`;
    }
    body.innerHTML = html;
    footer.innerHTML = foot;
    footer.hidden = !foot;
    body.scrollTop = 0;
    mountMascot($('mPrepMascot'), 'mascot_reading');
    mountMascot($('mQMascot'), QUESTION_KEYS[flow.q] === 'doors' ? 'mascot_stay_indoors' : 'mascot_idea');
    mountMascot($('mDetailsMascot'), 'mascot_reading');
    mountMascot($('mPhotoMascot'), 'mascot_idea');
    if (flow.step === 'review') mountMascot($('mReviewMascot'), pmBand(captureMeans().pm).mascot);
  }

  function selectAnswer(option) {
    const key = QUESTION_KEYS[flow.q];
    if (key === 'activities') {
      const cur = flow.answers.activities;
      // Same rule as SpotQuestions.toggleActivity: "none noticed" and "not sure" exclude the others.
      flow.answers.activities = cur.includes(option) ? cur.filter((o) => o !== option)
        : ['none_noticed', 'unknown'].includes(option) ? [option]
          : [...cur.filter((o) => !['none_noticed', 'unknown'].includes(o)), option];
    } else {
      flow.answers[key] = option;
    }
    const keep = $('mBody').scrollTop;
    renderFlow();
    $('mBody').scrollTop = keep;
  }

  function nextQuestion() {
    if (flow.q < QUESTION_KEYS.length - 1) { flow.q += 1; renderFlow(); return; }
    flow.questionsDone = true;
    if (flow.phase === 'complete') goToReview(); else renderFlow();
  }

  function submitFlow() {
    const nameInput = $('mName');
    if (nameInput) profileName = nameInput.value.trim();
    if (!flow.anonymous && !profileName) {
      flow.error = 'Choose a public profile name.';
      renderFlow();
      return;
    }
    try { localStorage.setItem('cas-profile-name', profileName); } catch (e) { /* storage unavailable */ }
    flow.error = '';
    flow.submitting = true;
    renderFlow();
    setTimeout(() => {
      const p = flowPlace();
      const means = captureMeans();
      const list = loadSubmissions();
      const before = rewardsFor(list);
      const record = {
        placeId: p.id, type: flow.type, date: new Date().toISOString(),
        inside: Math.max(1, Math.round(means.pm)), out: Math.round(state.pm * p.m), co2: means.co2,
      };
      list.push(record);
      saveSubmissions(list);
      p.pending.unshift({ date: new Date(record.date), inside: record.inside, out: record.out, co2: record.co2 });
      flow.submitting = false;
      showSubmitted(p, before, rewardsFor(list));
    }, 900);
  }

  function showSubmitted(p, before, after) {
    clearInterval(flowTimer);
    $('measure').hidden = true;
    const unlocked = after.badges.filter((b) => !before.badges.includes(b));
    const done = $('mDone');
    done.innerHTML =
      `<div class="m-done-inner">` +
      `<div class="m-mascot-170" id="mDoneMascot"></div>` +
      `<h2>Measurement submitted</h2>` +
      `<p>Thanks for measuring ${esc(p.name)}. Our team reviews it before it appears on the map.</p>` +
      `<div class="m-level"><div><span>Level ${after.level}</span><span>${after.next ? `${after.points} / ${after.next} points` : ''}</span></div>` +
      `<i><b style="width:${Math.min(1, Math.max(0, after.progress)) * 100}%"></b></i></div>` +
      unlocked.map((b) => `<div class="m-badge">${spotIcon('spot.reward.badge', 'reward', 36)}<div><strong>Badge unlocked: ${BADGES[b][0]}</strong><span>${BADGES[b][1]}</span></div></div>`).join('') +
      `<button type="button" class="m-btn white" data-done="another">Measure another place</button>` +
      `<button type="button" class="m-btn ghost" data-done="done">Done</button>` +
      `</div>` +
      `<canvas class="m-confetti" id="mConfetti" aria-hidden="true"></canvas>`;
    done.hidden = false;
    mountMascot($('mDoneMascot'), 'mascot_mission');
    confettiBurst($('mConfetti'));
  }

  // One confetti burst, ported from SpotConfettiView.swift: 90 pieces thrown up from 30% height,
  // falling under gravity, spinning and flipping, fading out over 2.5 s. Nothing under reduced motion.
  function confettiBurst(canvas) {
    if (reducedMotion || !canvas) return;
    const COUNT = 90, DURATION = 2.5, GRAVITY = 900;
    const COLORS = ['#FFCC00', '#FF9500', '#FFFFFF', '#B0ECFF', '#34C759', '#FCD9E0'];
    const rand = (a, b) => a + Math.random() * (b - a);
    const pieces = Array.from({ length: COUNT }, (_, i) => ({
      vx: rand(-320, 320), vy: rand(-720, -260), spin: rand(-9, 9),
      w: rand(6, 11), h: rand(9, 15), color: COLORS[i % COLORS.length],
    }));
    const ctx = canvas.getContext('2d');
    const start = performance.now();
    const frame = (now) => {
      const t = (now - start) / 1000;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (t >= DURATION || !canvas.isConnected) return;
      ctx.globalAlpha = 1 - t / DURATION;
      for (const p of pieces) {
        ctx.save();
        ctx.translate(w * 0.5 + p.vx * t, h * 0.3 + p.vy * t + (GRAVITY * t * t) / 2);
        ctx.rotate(p.spin * t);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.spin * t)));
        ctx.restore();
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  // Saved submissions from earlier visits show as "Awaiting review" on their places.
  loadSubmissions().forEach((s) => {
    const p = byId.get(s.placeId);
    if (p) p.pending.unshift({ date: new Date(s.date), inside: s.inside, out: s.out, co2: s.co2 });
  });

  $('measure').addEventListener('click', (e) => {
    const choice = e.target.closest('[data-answer]');
    if (choice) { selectAnswer(choice.dataset.answer); return; }
    const action = e.target.closest('[data-flow]');
    if (action) {
      switch (action.dataset.flow) {
        case 'start': startCapture(); break;
        case 'next': nextQuestion(); break;
        // The prototype "takes" the same sample photo every time.
        case 'photo': flow.photo = DUMMY_PHOTO; renderFlow(); break;
        case 'remove-photo': flow.photo = null; renderFlow(); break;
        case 'submit': submitFlow(); break;
        default: break;
      }
      return;
    }
    const confirm = e.target.closest('[data-confirm]');
    if (confirm) {
      $('mConfirm').hidden = true;
      if (confirm.dataset.confirm === 'discard') closeFlow();
    }
  });
  $('measure').addEventListener('change', (e) => {
    if (e.target.id === 'mAnon') {
      const nameInput = $('mName');
      if (nameInput) profileName = nameInput.value.trim();
      flow.anonymous = e.target.checked;
      flow.error = '';
      renderFlow();
    }
  });
  $('mLeft').addEventListener('click', () => {
    if (flow.step === 'prepare') { closeFlow(); return; }
    if (flow.step === 'review') {
      flow.step = 'measure';
      flow.questionsDone = false;
      flow.q = QUESTION_KEYS.length - 1;
      renderFlow();
      return;
    }
    $('mConfirm').hidden = false;
  });
  $('mDone').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-done]');
    if (!btn) return;
    const id = flow.placeId;
    closeFlow();
    if (btn.dataset.done === 'done') selectPlace(id);
    else closePlace();
  });

  // ---------------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------------

  renderChips();
  renderAll();
})();
