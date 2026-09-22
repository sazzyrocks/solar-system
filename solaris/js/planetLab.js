/**
 * planetLab.js — SOLARIS Cosmic Lab & Planetary Telemetry Suite
 * Features:
 *   1. Planetary Comparison Mode: Side-by-side visual scale spheres & specs showdown
 *   2. Astronaut Biometrics Calculator: Surface weight & planetary age across all worlds
 *   3. Interplanetary Transit & Radiation Matrix: Hohmann transfers, light delays & flux
 */

export const CELESTIAL_BODIES = {
  sun: {
    id: 'sun',
    name: 'Sun',
    type: 'Yellow Dwarf Star',
    color: '#FDB813',
    atmosphereColor: '#FF6000',
    diameter: 1392700,
    diameterEarthRatio: 109.3,
    massEarthRatio: 333000,
    gravity: 274.0,
    gravityFactor: 27.93,
    dayLengthHours: 600, // differential rotation ~25 days at equator
    yearLengthDays: 0,
    temperatureC: 5505,
    temperatureF: 9941,
    moons: 8, // planets as satellites
    distanceFromSunKm: 0,
    distanceAU: 0,
    atmosphere: ['Hydrogen (73%)', 'Helium (25%)', 'Plasma'],
    escapeVelocityKmS: 617.5,
    hasRings: false,
    gradient: 'radial-gradient(circle at 35% 35%, #FFF7D6 0%, #FFB300 45%, #FF5722 80%, #BF360C 100%)',
    glow: 'rgba(255, 179, 0, 0.65)',
    funFact: 'Contains 99.86% of all the mass in the entire Solar System.'
  },
  mercury: {
    id: 'mercury',
    name: 'Mercury',
    type: 'Terrestrial Planet',
    color: '#9E9E9E',
    atmosphereColor: '#B0B0B0',
    diameter: 4879,
    diameterEarthRatio: 0.383,
    massEarthRatio: 0.055,
    gravity: 3.7,
    gravityFactor: 0.378,
    dayLengthHours: 1407.6,
    yearLengthDays: 87.97,
    temperatureC: 167,
    temperatureF: 333,
    moons: 0,
    distanceFromSunKm: 57.9,
    distanceAU: 0.39,
    atmosphere: ['Trace Oxygen', 'Sodium', 'Hydrogen', 'Helium'],
    escapeVelocityKmS: 4.3,
    hasRings: false,
    gradient: 'radial-gradient(circle at 35% 35%, #E0E0E0 0%, #9E9E9E 45%, #616161 80%, #303030 100%)',
    glow: 'rgba(158, 158, 158, 0.4)',
    funFact: 'Experiences the wildest temperature swings: from -180°C at night to 430°C in direct sun.'
  },
  venus: {
    id: 'venus',
    name: 'Venus',
    type: 'Terrestrial Planet',
    color: '#E8C07D',
    atmosphereColor: '#D4940A',
    diameter: 12104,
    diameterEarthRatio: 0.949,
    massEarthRatio: 0.815,
    gravity: 8.87,
    gravityFactor: 0.904,
    dayLengthHours: 5832.5,
    yearLengthDays: 224.7,
    temperatureC: 464,
    temperatureF: 867,
    moons: 0,
    distanceFromSunKm: 108.2,
    distanceAU: 0.72,
    atmosphere: ['Carbon Dioxide (96.5%)', 'Nitrogen (3.5%)', 'Sulfuric Acid Clouds'],
    escapeVelocityKmS: 10.36,
    hasRings: false,
    gradient: 'radial-gradient(circle at 35% 35%, #FFF0C2 0%, #E8C07D 50%, #B8860B 80%, #5D3A0A 100%)',
    glow: 'rgba(232, 192, 125, 0.45)',
    funFact: 'Spins backwards compared to most planets; a day on Venus is longer than its entire year!'
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    type: 'Terrestrial / Habitable',
    color: '#4A90D9',
    atmosphereColor: '#5599EE',
    diameter: 12742,
    diameterEarthRatio: 1.0,
    massEarthRatio: 1.0,
    gravity: 9.81,
    gravityFactor: 1.0,
    dayLengthHours: 24.0,
    yearLengthDays: 365.25,
    temperatureC: 15,
    temperatureF: 59,
    moons: 1,
    distanceFromSunKm: 149.6,
    distanceAU: 1.0,
    atmosphere: ['Nitrogen (78%)', 'Oxygen (21%)', 'Argon (0.9%)', 'Water Vapor'],
    escapeVelocityKmS: 11.19,
    hasRings: false,
    gradient: 'radial-gradient(circle at 35% 35%, #76B4FF 0%, #2980B9 40%, #1A5276 75%, #0B2545 100%)',
    glow: 'rgba(74, 144, 217, 0.55)',
    funFact: 'The only known world in the cosmos harboring active life and liquid surface oceans.'
  },
  moon: {
    id: 'moon',
    name: 'Moon (Luna)',
    type: 'Planetary Satellite',
    color: '#CCCCCC',
    atmosphereColor: '#AAAAAA',
    diameter: 3474,
    diameterEarthRatio: 0.272,
    massEarthRatio: 0.0123,
    gravity: 1.62,
    gravityFactor: 0.166,
    dayLengthHours: 708.7,
    yearLengthDays: 27.3,
    temperatureC: -20,
    temperatureF: -4,
    moons: 0,
    distanceFromSunKm: 149.6,
    distanceAU: 1.0,
    atmosphere: ['Exosphere (Helium, Neon, Hydrogen)'],
    escapeVelocityKmS: 2.38,
    hasRings: false,
    gradient: 'radial-gradient(circle at 35% 35%, #F0F0F0 0%, #B0B0B0 50%, #757575 80%, #424242 100%)',
    glow: 'rgba(200, 200, 200, 0.35)',
    funFact: 'Tidally locked to Earth, meaning we only ever see the same hemisphere from our surface.'
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    type: 'Terrestrial Planet',
    color: '#C1440E',
    atmosphereColor: '#C07030',
    diameter: 6779,
    diameterEarthRatio: 0.532,
    massEarthRatio: 0.107,
    gravity: 3.72,
    gravityFactor: 0.379,
    dayLengthHours: 24.6,
    yearLengthDays: 686.97,
    temperatureC: -65,
    temperatureF: -85,
    moons: 2,
    distanceFromSunKm: 227.9,
    distanceAU: 1.52,
    atmosphere: ['Carbon Dioxide (95.3%)', 'Nitrogen (2.6%)', 'Argon (1.9%)'],
    escapeVelocityKmS: 5.03,
    hasRings: false,
    gradient: 'radial-gradient(circle at 35% 35%, #FF7F50 0%, #C1440E 45%, #8B2500 80%, #4A1200 100%)',
    glow: 'rgba(193, 68, 14, 0.5)',
    funFact: 'Home to Olympus Mons, the largest volcano in the Solar System, 2.5× the height of Everest.'
  },
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'Gas Giant',
    color: '#C88B3A',
    atmosphereColor: '#B07020',
    diameter: 139820,
    diameterEarthRatio: 10.97,
    massEarthRatio: 317.8,
    gravity: 24.79,
    gravityFactor: 2.528,
    dayLengthHours: 9.9,
    yearLengthDays: 4333,
    temperatureC: -110,
    temperatureF: -166,
    moons: 95,
    distanceFromSunKm: 778.5,
    distanceAU: 5.2,
    atmosphere: ['Hydrogen (90%)', 'Helium (10%)', 'Methane', 'Ammonia'],
    escapeVelocityKmS: 59.5,
    hasRings: true,
    gradient: 'radial-gradient(circle at 35% 35%, #FFDFBA 0%, #D4A373 35%, #B07020 70%, #5E390A 100%)',
    glow: 'rgba(200, 139, 58, 0.45)',
    funFact: 'More than double the mass of all other planets in the Solar System combined!'
  },
  saturn: {
    id: 'saturn',
    name: 'Saturn',
    type: 'Gas Giant',
    color: '#E4D191',
    atmosphereColor: '#D0B840',
    diameter: 116460,
    diameterEarthRatio: 9.14,
    massEarthRatio: 95.2,
    gravity: 10.44,
    gravityFactor: 1.064,
    dayLengthHours: 10.7,
    yearLengthDays: 10759,
    temperatureC: -140,
    temperatureF: -220,
    moons: 146,
    distanceFromSunKm: 1432,
    distanceAU: 9.58,
    atmosphere: ['Hydrogen (96%)', 'Helium (3%)', 'Methane', 'Ammonia'],
    escapeVelocityKmS: 35.5,
    hasRings: true,
    gradient: 'radial-gradient(circle at 35% 35%, #FFF5D0 0%, #E4D191 45%, #B89B48 75%, #6B551C 100%)',
    glow: 'rgba(228, 209, 145, 0.45)',
    funFact: 'Saturn’s density is so low (0.687 g/cm³) that it would float in a giant bathtub of water.'
  },
  uranus: {
    id: 'uranus',
    name: 'Uranus',
    type: 'Ice Giant',
    color: '#7DE8E8',
    atmosphereColor: '#40C8C8',
    diameter: 50724,
    diameterEarthRatio: 3.98,
    massEarthRatio: 14.5,
    gravity: 8.69,
    gravityFactor: 0.886,
    dayLengthHours: 17.2,
    yearLengthDays: 30687,
    temperatureC: -195,
    temperatureF: -319,
    moons: 28,
    distanceFromSunKm: 2867,
    distanceAU: 19.2,
    atmosphere: ['Hydrogen (83%)', 'Helium (15%)', 'Methane (2%)'],
    escapeVelocityKmS: 21.3,
    hasRings: true,
    gradient: 'radial-gradient(circle at 35% 35%, #D4FFFF 0%, #7DE8E8 45%, #38A3A3 75%, #165656 100%)',
    glow: 'rgba(125, 232, 232, 0.45)',
    funFact: 'Rotates sideways with an axial tilt of 97.8°, essentially rolling like a ball around the Sun.'
  },
  neptune: {
    id: 'neptune',
    name: 'Neptune',
    type: 'Ice Giant',
    color: '#3F54BA',
    atmosphereColor: '#2244AA',
    diameter: 49244,
    diameterEarthRatio: 3.86,
    massEarthRatio: 17.1,
    gravity: 11.15,
    gravityFactor: 1.137,
    dayLengthHours: 16.1,
    yearLengthDays: 60190,
    temperatureC: -200,
    temperatureF: -328,
    moons: 16,
    distanceFromSunKm: 4515,
    distanceAU: 30.1,
    atmosphere: ['Hydrogen (80%)', 'Helium (19%)', 'Methane (1.5%)'],
    escapeVelocityKmS: 23.5,
    hasRings: true,
    gradient: 'radial-gradient(circle at 35% 35%, #8B9DFF 0%, #3F54BA 45%, #1B2975 75%, #0B1238 100%)',
    glow: 'rgba(63, 84, 186, 0.55)',
    funFact: 'Whipping with supersonic winds reaching up to 2,100 km/h, the fastest recorded anywhere in the Solar System.'
  },
  pluto: {
    id: 'pluto',
    name: 'Pluto',
    type: 'Dwarf Planet',
    color: '#D4B895',
    atmosphereColor: '#B09070',
    diameter: 2376,
    diameterEarthRatio: 0.186,
    massEarthRatio: 0.0022,
    gravity: 0.62,
    gravityFactor: 0.063,
    dayLengthHours: 153.3,
    yearLengthDays: 90560,
    temperatureC: -230,
    temperatureF: -382,
    moons: 5,
    distanceFromSunKm: 5906,
    distanceAU: 39.5,
    atmosphere: ['Nitrogen', 'Methane', 'Carbon Monoxide (Seasonal)'],
    escapeVelocityKmS: 1.21,
    hasRings: false,
    gradient: 'radial-gradient(circle at 35% 35%, #F5E5D0 0%, #D4B895 45%, #96724E 75%, #4A331E 100%)',
    glow: 'rgba(212, 184, 149, 0.35)',
    funFact: 'Features a massive heart-shaped nitrogen ice glacier (Tombaugh Regio) larger than Texas.'
  }
};

export class PlanetLab {
  constructor({ onNavigate }) {
    this._onNavigate = onNavigate;
    this._activeTab = 'compare'; // 'compare' | 'biometrics' | 'transit'
    this._bodyAId = 'earth';
    this._bodyBId = 'mars';
    this._userWeight = 70;
    this._userAge = 25;
    this._unit = 'kg'; // 'kg' | 'lbs'
    this._transitOrigin = 'earth';
    this._transitDest = 'mars';

    this._modal = null;
    this._isOpen = false;

    this._initDOM();
  }

  _initDOM() {
    let modal = document.getElementById('planet-lab-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'planet-lab-modal';
      modal.className = 'planet-lab-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-hidden', 'true');
      document.body.appendChild(modal);
    }
    this._modal = modal;
    this._renderModalContent();
    this._bindEvents();
  }

  _renderModalContent() {
    this._modal.innerHTML = `
      <div class="pl-backdrop" id="pl-backdrop"></div>
      <div class="pl-container">
        <!-- Header -->
        <header class="pl-header">
          <div class="pl-brand-group">
            <span class="pl-agency-pill">NASA / JPL LAB</span>
            <div class="pl-title-row">
              <h2 class="pl-title">COSMIC EXPLORATION LAB</h2>
              <span class="pl-subtitle">INTERACTIVE PLANETARY COMPARISON & BIOMETRIC TELEMETRY</span>
            </div>
          </div>
          <button class="pl-close-btn" id="pl-close-btn" aria-label="Close Planet Lab">✕</button>
        </header>

        <!-- Navigation Tabs -->
        <nav class="pl-tabs" role="tablist">
          <button class="pl-tab ${this._activeTab === 'compare' ? 'active' : ''}" data-tab="compare" role="tab" aria-selected="${this._activeTab === 'compare'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14"><circle cx="8" cy="12" r="5"/><circle cx="17" cy="12" r="3"/></svg>
            PLANET COMPARISON
          </button>
          <button class="pl-tab ${this._activeTab === 'biometrics' ? 'active' : ''}" data-tab="biometrics" role="tab" aria-selected="${this._activeTab === 'biometrics'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            ASTRONAUT BIOMETRICS
          </button>
          <button class="pl-tab ${this._activeTab === 'transit' ? 'active' : ''}" data-tab="transit" role="tab" aria-selected="${this._activeTab === 'transit'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14"><polygon points="12 2 15 8.5 22 9.5 17 14.5 18.5 21.5 12 18 5.5 21.5 7 14.5 2 9.5 9 8.5 12 2"/></svg>
            INTERPLANETARY TRANSIT
          </button>
        </nav>

        <!-- Tab Content Panes -->
        <div class="pl-body">
          <div class="pl-tab-pane ${this._activeTab === 'compare' ? 'active' : ''}" id="pl-pane-compare">
            ${this._renderCompareTab()}
          </div>
          <div class="pl-tab-pane ${this._activeTab === 'biometrics' ? 'active' : ''}" id="pl-pane-biometrics">
            ${this._renderBiometricsTab()}
          </div>
          <div class="pl-tab-pane ${this._activeTab === 'transit' ? 'active' : ''}" id="pl-pane-transit">
            ${this._renderTransitTab()}
          </div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //   TAB 1: PLANET COMPARISON
  // ═══════════════════════════════════════════════════════════════════════

  _renderCompareTab() {
    const a = CELESTIAL_BODIES[this._bodyAId] || CELESTIAL_BODIES.earth;
    const b = CELESTIAL_BODIES[this._bodyBId] || CELESTIAL_BODIES.mars;

    // Visual scale sizes: clamp between 28px and 160px based on diameter ratio
    const maxDiam = Math.max(a.diameter, b.diameter);
    const minDiam = Math.min(a.diameter, b.diameter);
    const ratio = a.diameter / b.diameter;

    let sizeA, sizeB;
    if (a.diameter >= b.diameter) {
      sizeA = 130;
      sizeB = Math.max(26, Math.round(130 * (b.diameter / a.diameter)));
    } else {
      sizeB = 130;
      sizeA = Math.max(26, Math.round(130 * (a.diameter / b.diameter)));
    }

    // Volume comparison
    const volRatio = (Math.pow(a.diameter, 3) / Math.pow(b.diameter, 3));
    let highlightText = '';
    if (Math.abs(volRatio - 1) < 0.05) {
      highlightText = `${a.name} and ${b.name} are nearly twin-sized worlds in physical diameter!`;
    } else if (volRatio > 1) {
      highlightText = `<strong>${Math.round(volRatio).toLocaleString()}</strong> ${b.name}s could fit inside the physical volume of ${a.name}!`;
    } else {
      highlightText = `<strong>${Math.round(1 / volRatio).toLocaleString()}</strong> ${a.name}s could fit inside the physical volume of ${b.name}!`;
    }

    const bodyKeys = Object.keys(CELESTIAL_BODIES);

    return `
      <!-- Body Selectors -->
      <div class="pl-compare-controls">
        <div class="pl-selector-group">
          <label for="pl-select-a" class="pl-select-label">BODY ALPHA</label>
          <select id="pl-select-a" class="pl-select">
            ${bodyKeys.map(k => `<option value="${k}" ${k === this._bodyAId ? 'selected' : ''}>${CELESTIAL_BODIES[k].name} (${CELESTIAL_BODIES[k].type})</option>`).join('')}
          </select>
        </div>

        <button class="pl-swap-btn" id="pl-swap-btn" title="Swap Bodies">⇄</button>

        <div class="pl-selector-group">
          <label for="pl-select-b" class="pl-select-label">BODY BETA</label>
          <select id="pl-select-b" class="pl-select">
            ${bodyKeys.map(k => `<option value="${k}" ${k === this._bodyBId ? 'selected' : ''}>${CELESTIAL_BODIES[k].name} (${CELESTIAL_BODIES[k].type})</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Quick Take Callout -->
      <div class="pl-quicktake">
        <span class="pl-quicktake-icon">⚡</span>
        <div class="pl-quicktake-text">${highlightText}</div>
      </div>

      <!-- Scaled Visual Comparison Arena -->
      <div class="pl-visual-arena">
        <!-- Body A Sphere -->
        <div class="pl-sphere-col">
          <div class="pl-sphere-wrapper" style="width:160px; height:160px;">
            <div class="pl-sphere ${a.hasRings ? 'pl-sphere--rings' : ''}" style="width:${sizeA}px; height:${sizeA}px; background:${a.gradient}; box-shadow: 0 0 25px ${a.glow};">
              ${a.hasRings ? `<div class="pl-ring-decor"></div>` : ''}
            </div>
          </div>
          <div class="pl-sphere-meta">
            <h4 class="pl-sphere-name" style="color:${a.color}">${a.name.toUpperCase()}</h4>
            <span class="pl-sphere-scale">${a.diameter.toLocaleString()} km · ${a.diameterEarthRatio}× Earth</span>
            <button class="pl-fly-btn" data-fly-target="${a.id}">FLY TO 3D TARGET →</button>
          </div>
        </div>

        <!-- Scale Ruler Center -->
        <div class="pl-scale-center">
          <div class="pl-vs-badge">VS</div>
          <div class="pl-scale-diff">
            <span class="diff-val">${ratio >= 1 ? `${ratio.toFixed(2)}×` : `${(1 / ratio).toFixed(2)}×`}</span>
            <span class="diff-lbl">${ratio >= 1 ? `${a.name} is larger` : `${b.name} is larger`}</span>
          </div>
        </div>

        <!-- Body B Sphere -->
        <div class="pl-sphere-col">
          <div class="pl-sphere-wrapper" style="width:160px; height:160px;">
            <div class="pl-sphere ${b.hasRings ? 'pl-sphere--rings' : ''}" style="width:${sizeB}px; height:${sizeB}px; background:${b.gradient}; box-shadow: 0 0 25px ${b.glow};">
              ${b.hasRings ? `<div class="pl-ring-decor"></div>` : ''}
            </div>
          </div>
          <div class="pl-sphere-meta">
            <h4 class="pl-sphere-name" style="color:${b.color}">${b.name.toUpperCase()}</h4>
            <span class="pl-sphere-scale">${b.diameter.toLocaleString()} km · ${b.diameterEarthRatio}× Earth</span>
            <button class="pl-fly-btn" data-fly-target="${b.id}">FLY TO 3D TARGET →</button>
          </div>
        </div>
      </div>

      <!-- Telemetry Breakdown Table -->
      <div class="pl-table-wrap">
        <table class="pl-spec-table">
          <thead>
            <tr>
              <th class="col-metric">TELEMETRY PARAMETER</th>
              <th class="col-body-a" style="color:${a.color}">${a.name.toUpperCase()}</th>
              <th class="col-delta">COMPARATIVE DELTA</th>
              <th class="col-body-b" style="color:${b.color}">${b.name.toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="col-metric">Mean Diameter</td>
              <td class="col-body-a">${a.diameter.toLocaleString()} km</td>
              <td class="col-delta"><span class="pl-delta-chip ${a.diameter >= b.diameter ? 'pos' : 'neg'}">${(a.diameter / b.diameter).toFixed(2)}×</span></td>
              <td class="col-body-b">${b.diameter.toLocaleString()} km</td>
            </tr>
            <tr>
              <td class="col-metric">Surface Gravity</td>
              <td class="col-body-a">${a.gravity} m/s² (${a.gravityFactor}g)</td>
              <td class="col-delta"><span class="pl-delta-chip ${a.gravity >= b.gravity ? 'pos' : 'neg'}">${(a.gravity / b.gravity).toFixed(2)}×</span></td>
              <td class="col-body-b">${b.gravity} m/s² (${b.gravityFactor}g)</td>
            </tr>
            <tr>
              <td class="col-metric">Rotation (Day Length)</td>
              <td class="col-body-a">${a.dayLengthHours.toLocaleString()} hrs</td>
              <td class="col-delta"><span class="pl-delta-chip neutral">${(a.dayLengthHours / b.dayLengthHours).toFixed(2)}×</span></td>
              <td class="col-body-b">${b.dayLengthHours.toLocaleString()} hrs</td>
            </tr>
            <tr>
              <td class="col-metric">Solar Year (Orbit Period)</td>
              <td class="col-body-a">${a.yearLengthDays ? `${a.yearLengthDays.toLocaleString()} Earth days` : 'N/A (Host Star)'}</td>
              <td class="col-delta"><span class="pl-delta-chip neutral">${b.yearLengthDays && a.yearLengthDays ? `${(a.yearLengthDays / b.yearLengthDays).toFixed(2)}×` : '—'}</span></td>
              <td class="col-body-b">${b.yearLengthDays ? `${b.yearLengthDays.toLocaleString()} Earth days` : 'N/A (Host Star)'}</td>
            </tr>
            <tr>
              <td class="col-metric">Mean Temperature</td>
              <td class="col-body-a">${a.temperatureC > 0 ? `+${a.temperatureC}` : a.temperatureC}°C (${a.temperatureF}°F)</td>
              <td class="col-delta"><span class="pl-delta-chip neutral">Δ ${Math.abs(a.temperatureC - b.temperatureC)}°C</span></td>
              <td class="col-body-b">${b.temperatureC > 0 ? `+${b.temperatureC}` : b.temperatureC}°C (${b.temperatureF}°F)</td>
            </tr>
            <tr>
              <td class="col-metric">Known Satellites / Moons</td>
              <td class="col-body-a">${a.moons}</td>
              <td class="col-delta"><span class="pl-delta-chip ${a.moons >= b.moons ? 'pos' : 'neg'}">${a.moons} vs ${b.moons}</span></td>
              <td class="col-body-b">${b.moons}</td>
            </tr>
            <tr>
              <td class="col-metric">Distance from Sun</td>
              <td class="col-body-a">${a.distanceFromSunKm.toLocaleString()}M km (${a.distanceAU} AU)</td>
              <td class="col-delta"><span class="pl-delta-chip neutral">${Math.abs(a.distanceAU - b.distanceAU).toFixed(2)} AU sep</span></td>
              <td class="col-body-b">${b.distanceFromSunKm.toLocaleString()}M km (${b.distanceAU} AU)</td>
            </tr>
            <tr>
              <td class="col-metric">Escape Velocity</td>
              <td class="col-body-a">${a.escapeVelocityKmS} km/s</td>
              <td class="col-delta"><span class="pl-delta-chip ${a.escapeVelocityKmS >= b.escapeVelocityKmS ? 'pos' : 'neg'}">${(a.escapeVelocityKmS / b.escapeVelocityKmS).toFixed(2)}×</span></td>
              <td class="col-body-b">${b.escapeVelocityKmS} km/s</td>
            </tr>
            <tr>
              <td class="col-metric">Atmosphere Composition</td>
              <td class="col-body-a">${a.atmosphere.join(', ')}</td>
              <td class="col-delta"><span class="pl-delta-chip neutral">Atmospheric Mix</span></td>
              <td class="col-body-b">${b.atmosphere.join(', ')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //   TAB 2: ASTRONAUT BIOMETRICS
  // ═══════════════════════════════════════════════════════════════════════

  _renderBiometricsTab() {
    const isKg = this._unit === 'kg';
    const weightVal = this._userWeight;
    const ageVal = this._userAge;
    const unitLabel = isKg ? 'kg' : 'lbs';

    const planetList = ['mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'sun'];

    return `
      <!-- User Parameter Inputs -->
      <div class="pl-bio-inputs-bar">
        <div class="pl-input-card">
          <label class="pl-input-lbl" for="pl-bio-weight">YOUR EARTH WEIGHT</label>
          <div class="pl-input-wrap">
            <input type="number" id="pl-bio-weight" class="pl-num-input" min="5" max="500" value="${weightVal}" />
            <div class="pl-unit-toggle">
              <button class="pl-unit-btn ${isKg ? 'active' : ''}" data-unit="kg">KG</button>
              <button class="pl-unit-btn ${!isKg ? 'active' : ''}" data-unit="lbs">LBS</button>
            </div>
          </div>
        </div>

        <div class="pl-input-card">
          <label class="pl-input-lbl" for="pl-bio-age">YOUR EARTH AGE</label>
          <div class="pl-input-wrap">
            <input type="number" id="pl-bio-age" class="pl-num-input" min="1" max="130" value="${ageVal}" />
            <span class="pl-unit-suffix">YEARS</span>
          </div>
        </div>

        <div class="pl-bio-summary-hint">
          <span class="hint-icon">🚀</span>
          <span>Explore how physical gravity and orbital velocity warp your personal physiology and lifespan across other worlds!</span>
        </div>
      </div>

      <!-- Biometric Cards Grid -->
      <div class="pl-bio-grid">
        ${planetList.map(pid => {
          const body = CELESTIAL_BODIES[pid];
          const localWeight = (weightVal * body.gravityFactor).toFixed(1);
          // Local age: Earth age * (365.25 / yearLengthDays)
          const localAge = body.yearLengthDays > 0 ? (ageVal * 365.25 / body.yearLengthDays).toFixed(2) : '—';
          const isHighG = body.gravityFactor > 1.2;
          const isLowG = body.gravityFactor < 0.8;

          return `
            <div class="pl-bio-card" data-fly-target="${body.id}">
              <div class="pl-bio-card-header">
                <div class="pl-bio-orb" style="background:${body.gradient}; box-shadow: 0 0 10px ${body.glow};"></div>
                <div class="pl-bio-name-group">
                  <span class="pl-bio-name" style="color:${body.color}">${body.name.toUpperCase()}</span>
                  <span class="pl-bio-type">${body.type}</span>
                </div>
                <span class="pl-bio-g-badge ${isHighG ? 'high' : isLowG ? 'low' : 'norm'}">${body.gravityFactor}g</span>
              </div>

              <div class="pl-bio-metrics-row">
                <div class="pl-bio-stat">
                  <span class="stat-lbl">YOUR WEIGHT</span>
                  <div class="stat-val-highlight">
                    <span class="num">${localWeight}</span>
                    <span class="unit">${unitLabel}</span>
                  </div>
                  <span class="stat-sub">${(body.gravityFactor * 100).toFixed(0)}% of Earth</span>
                </div>

                <div class="pl-bio-stat">
                  <span class="stat-lbl">PLANETARY AGE</span>
                  <div class="stat-val-highlight">
                    <span class="num">${localAge}</span>
                    <span class="unit">yrs</span>
                  </div>
                  <span class="stat-sub">${body.yearLengthDays ? `Year: ${Math.round(body.yearLengthDays)} d` : 'Host Star'}</span>
                </div>
              </div>

              <!-- Gravity Gauge Bar -->
              <div class="pl-gravity-bar-wrap">
                <div class="pl-gravity-bar-fill" style="width: ${Math.min(100, (body.gravityFactor / 2.6) * 100)}%; background: ${body.color};"></div>
              </div>

              <div class="pl-bio-card-footer">
                <span class="pl-bio-day">Day: ${body.dayLengthHours < 100 ? `${body.dayLengthHours}h` : `${Math.round(body.dayLengthHours / 24)}d`}</span>
                <span class="pl-bio-action">CLICK TO FLY →</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //   TAB 3: INTERPLANETARY TRANSIT & HABITABILITY
  // ═══════════════════════════════════════════════════════════════════════

  _renderTransitTab() {
    const origin = CELESTIAL_BODIES[this._transitOrigin] || CELESTIAL_BODIES.earth;
    const dest = CELESTIAL_BODIES[this._transitDest] || CELESTIAL_BODIES.mars;

    // Minimum distance (closest approach) and maximum distance (conjunction)
    const dMinKm = Math.abs(origin.distanceFromSunKm - dest.distanceFromSunKm);
    const dMaxKm = origin.distanceFromSunKm + dest.distanceFromSunKm;
    const dAvgKm = (dMinKm + dMaxKm) / 2;

    // Speed of Light delay (c = 300,000 km/s)
    const lightSecMin = Math.round(dMinKm * 1000000 / 299792.458);
    const lightSecMax = Math.round(dMaxKm * 1000000 / 299792.458);
    const lightMinStr = (lightSecMin / 60).toFixed(1);
    const lightMaxStr = (lightSecMax / 60).toFixed(1);

    // Chemical Hohmann Transfer time approx (semi-major axis)
    // T_trans = 0.5 * sqrt( (r1 + r2)^3 / (8) ) in Earth years
    const r1 = origin.distanceAU;
    const r2 = dest.distanceAU;
    const aTransfer = (r1 + r2) / 2;
    const hohmannDays = aTransfer > 0 ? Math.round(0.5 * Math.pow(aTransfer, 1.5) * 365.25) : 0;

    // Solar radiation flux relative to Earth: 1 / (r2^2)
    const solarFlux = r2 > 0 ? ((1 / (r2 * r2)) * 100).toFixed(1) : '100000+';

    const planetKeys = ['mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

    return `
      <!-- Route Selector -->
      <div class="pl-transit-route-bar">
        <div class="pl-selector-group">
          <label for="pl-transit-origin" class="pl-select-label">MISSION DEPARTURE POINT</label>
          <select id="pl-transit-origin" class="pl-select">
            ${planetKeys.map(k => `<option value="${k}" ${k === this._transitOrigin ? 'selected' : ''}>${CELESTIAL_BODIES[k].name}</option>`).join('')}
          </select>
        </div>

        <div class="pl-transit-arrow">➔ ➔ ➔</div>

        <div class="pl-selector-group">
          <label for="pl-transit-dest" class="pl-select-label">EXPEDITION DESTINATION</label>
          <select id="pl-transit-dest" class="pl-select">
            ${planetKeys.map(k => `<option value="${k}" ${k === this._transitDest ? 'selected' : ''}>${CELESTIAL_BODIES[k].name}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Transit Metrics Overview -->
      <div class="pl-transit-grid">
        <div class="pl-transit-card">
          <div class="tc-icon">🛰️</div>
          <div class="tc-info">
            <span class="tc-lbl">HOHMANN MINIMUM-ENERGY TRAJECTORY</span>
            <div class="tc-val">${hohmannDays > 0 ? `${hohmannDays.toLocaleString()} DAYS` : 'SUB-ORBITAL'}</div>
            <span class="tc-sub">Optimal planetary alignment launch window</span>
          </div>
        </div>

        <div class="pl-transit-card">
          <div class="tc-icon">⚡</div>
          <div class="tc-info">
            <span class="tc-lbl">NEXT-GEN ION DRIVE DURATION</span>
            <div class="tc-val">${hohmannDays > 0 ? `${Math.round(hohmannDays * 0.45).toLocaleString()} DAYS` : 'DIRECT'}</div>
            <span class="tc-sub">Continuous low-thrust high-efficiency propulsion</span>
          </div>
        </div>

        <div class="pl-transit-card">
          <div class="tc-icon">📡</div>
          <div class="tc-info">
            <span class="tc-lbl">RADIO COMMUNICATION DELAY</span>
            <div class="tc-val">${lightMinStr} – ${lightMaxStr} MINS</div>
            <span class="tc-sub">Speed-of-light one-way latency (closest vs furthest)</span>
          </div>
        </div>

        <div class="pl-transit-card">
          <div class="tc-icon">☀️</div>
          <div class="tc-info">
            <span class="tc-lbl">SOLAR IRRADIANCE / FLUX</span>
            <div class="tc-val">${solarFlux}% OF EARTH</div>
            <span class="tc-sub">Solar power availability at target destination</span>
          </div>
        </div>
      </div>

      <!-- Mission Planning Dossier -->
      <div class="pl-dossier-card">
        <div class="pl-dossier-header">
          <span class="dossier-tag">MISSION DOSSIER</span>
          <h4 class="dossier-title">SURFACE CONDITIONS & EXPEDITION HAZARDS ON ${dest.name.toUpperCase()}</h4>
        </div>
        <p class="dossier-desc">
          ${dest.funFact}
        </p>
        <div class="dossier-tags">
          <span class="d-chip">SURFACE GRAVITY: ${dest.gravity} m/s²</span>
          <span class="d-chip">AVG TEMP: ${dest.temperatureC}°C</span>
          <span class="d-chip">ATMOSPHERE: ${dest.atmosphere.slice(0, 2).join(', ')}</span>
          <span class="d-chip">DISTANCE: ${dMinKm.toLocaleString()}M km (MIN)</span>
        </div>
        <div class="dossier-actions">
          <button class="pl-fly-btn" data-fly-target="${dest.id}">PLOT TRAJECTORY & FLY TO ${dest.name.toUpperCase()} →</button>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //   EVENT BINDINGS
  // ═══════════════════════════════════════════════════════════════════════

  _bindEvents() {
    this._modal.addEventListener('click', (e) => {
      // Backdrop click
      if (e.target.id === 'pl-backdrop' || e.target.classList.contains('pl-close-btn')) {
        this.close();
        return;
      }

      // Tab switcher
      const tabBtn = e.target.closest('.pl-tab');
      if (tabBtn) {
        const tab = tabBtn.dataset.tab;
        this.switchTab(tab);
        return;
      }

      // Swap button in compare tab
      if (e.target.id === 'pl-swap-btn') {
        const temp = this._bodyAId;
        this._bodyAId = this._bodyBId;
        this._bodyBId = temp;
        this._refreshCurrentPane();
        return;
      }

      // Unit button in biometrics tab
      const unitBtn = e.target.closest('.pl-unit-btn');
      if (unitBtn) {
        this._unit = unitBtn.dataset.unit;
        this._refreshCurrentPane();
        return;
      }

      // Fly-to button
      const flyBtn = e.target.closest('[data-fly-target]');
      if (flyBtn) {
        const targetId = flyBtn.dataset.flyTarget;
        this.close();
        this._onNavigate?.(targetId);
        return;
      }
    });

    // Select dropdown changes
    this._modal.addEventListener('change', (e) => {
      if (e.target.id === 'pl-select-a') {
        this._bodyAId = e.target.value;
        this._refreshCurrentPane();
      } else if (e.target.id === 'pl-select-b') {
        this._bodyBId = e.target.value;
        this._refreshCurrentPane();
      } else if (e.target.id === 'pl-transit-origin') {
        this._transitOrigin = e.target.value;
        this._refreshCurrentPane();
      } else if (e.target.id === 'pl-transit-dest') {
        this._transitDest = e.target.value;
        this._refreshCurrentPane();
      }
    });

    // Number input changes in biometrics
    this._modal.addEventListener('input', (e) => {
      if (e.target.id === 'pl-bio-weight') {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val > 0) {
          this._userWeight = val;
          this._updateBiometricsLive();
        }
      } else if (e.target.id === 'pl-bio-age') {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val > 0) {
          this._userAge = val;
          this._updateBiometricsLive();
        }
      }
    });
  }

  _refreshCurrentPane() {
    const paneCompare = document.getElementById('pl-pane-compare');
    const paneBio = document.getElementById('pl-pane-biometrics');
    const paneTransit = document.getElementById('pl-pane-transit');

    if (this._activeTab === 'compare' && paneCompare) {
      paneCompare.innerHTML = this._renderCompareTab();
    } else if (this._activeTab === 'biometrics' && paneBio) {
      paneBio.innerHTML = this._renderBiometricsTab();
    } else if (this._activeTab === 'transit' && paneTransit) {
      paneTransit.innerHTML = this._renderTransitTab();
    }
  }

  _updateBiometricsLive() {
    const paneBio = document.getElementById('pl-pane-biometrics');
    if (paneBio) {
      paneBio.innerHTML = this._renderBiometricsTab();
    }
  }

  switchTab(tab) {
    this._activeTab = tab;
    const tabs = this._modal.querySelectorAll('.pl-tab');
    tabs.forEach(t => {
      const isAct = t.dataset.tab === tab;
      t.classList.toggle('active', isAct);
      t.setAttribute('aria-selected', isAct);
    });

    const panes = this._modal.querySelectorAll('.pl-tab-pane');
    panes.forEach(p => p.classList.remove('active'));

    const activePane = document.getElementById(`pl-pane-${tab}`);
    if (activePane) {
      activePane.classList.add('active');
      this._refreshCurrentPane();
    }
  }

  open(initialBodyA = 'earth', initialBodyB = 'mars') {
    if (CELESTIAL_BODIES[initialBodyA]) this._bodyAId = initialBodyA;
    if (CELESTIAL_BODIES[initialBodyB]) this._bodyBId = initialBodyB;
    this._isOpen = true;
    this._modal.classList.add('pl-modal--visible');
    this._modal.setAttribute('aria-hidden', 'false');
    this._refreshCurrentPane();
  }

  close() {
    this._isOpen = false;
    this._modal.classList.remove('pl-modal--visible');
    this._modal.setAttribute('aria-hidden', 'true');
  }

  toggle() {
    if (this._isOpen) this.close();
    else this.open();
  }

  isOpen() {
    return this._isOpen;
  }
}
