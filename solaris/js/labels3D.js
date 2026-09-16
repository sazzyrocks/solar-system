/**
 * labels3D.js — SOLARIS
 * NASA Eyes-style 3D floating labels projected to 2D screen coordinates.
 * Supports celestial bodies (Sun, Planets) and Spacecraft missions.
 */

import * as THREE from 'three';

export class Labels3DManager {
  constructor(camera, container, options = {}) {
    this._camera = camera;
    this._container = container || document.body;
    this._onSelectPlanet = options.onSelectPlanet || (() => {});
    this._onSelectMission = options.onSelectMission || (() => {});
    
    this._items = []; // { id, name, type, getPosition(), el }
    this._tempV = new THREE.Vector3();
    this._visible = true;

    this._setupOverlay();
  }

  _setupOverlay() {
    let overlay = document.getElementById('labels-3d-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'labels-3d-overlay';
      overlay.className = 'labels-3d-overlay';
      this._container.appendChild(overlay);
    }
    this._overlay = overlay;
  }

  /**
   * Register a target object to display a floating 3D label
   * @param {Object} config { id, name, type: 'planet'|'mission'|'star', getPosition: () => THREE.Vector3 }
   */
  register(config) {
    const el = document.createElement('div');
    el.className = `label-3d-item label-type-${config.type}`;
    el.dataset.id = config.id;
    el.dataset.type = config.type;

    const iconHtml = config.type === 'mission' ? '<span class="label-icon">⬡</span> ' : '';
    el.innerHTML = `
      <div class="label-pin"></div>
      <div class="label-text">${iconHtml}${config.name.toUpperCase()}</div>
    `;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (config.type === 'planet' || config.type === 'star') {
        this._onSelectPlanet(config.id);
      } else if (config.type === 'mission') {
        this._onSelectMission(config.id);
      }
    });

    this._overlay.appendChild(el);

    this._items.push({
      id: config.id,
      name: config.name,
      type: config.type,
      getPosition: config.getPosition,
      el,
    });
  }

  /**
   * Toggle visibility of all labels
   */
  toggle() {
    this._visible = !this._visible;
    this._overlay.style.display = this._visible ? 'block' : 'none';
    return this._visible;
  }

  setVisible(visible) {
    this._visible = visible;
    this._overlay.style.display = this._visible ? 'block' : 'none';
  }

  /**
   * Called every animation frame to project 3D coordinates to screen space
   */
  update() {
    if (!this._visible) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const halfW = width / 2;
    const halfH = height / 2;

    for (let i = 0; i < this._items.length; i++) {
      const item = this._items[i];
      const pos = item.getPosition(this._tempV);
      if (!pos) continue;

      if (pos !== this._tempV) {
        this._tempV.copy(pos);
      }

      // Distance from camera
      const dist = this._camera.position.distanceTo(this._tempV);

      // Project to normalized device coordinates (-1 to +1)
      this._tempV.project(this._camera);

      // Check if behind camera or outside clip bounds
      const isBehind = this._tempV.z > 1.0;
      const isOffscreen = (
        this._tempV.x < -1.1 || this._tempV.x > 1.1 ||
        this._tempV.y < -1.1 || this._tempV.y > 1.1
      );

      if (isBehind || isOffscreen) {
        if (!item._hidden) {
          item.el.style.opacity = '0';
          item.el.style.pointerEvents = 'none';
          item._hidden = true;
        }
        continue;
      }

      item._hidden = false;

      // Convert NDC to pixel coordinates
      const screenX = (this._tempV.x * halfW) + halfW;
      const screenY = -(this._tempV.y * halfH) + halfH;

      // Subtle scale factor based on distance
      const scale = Math.max(0.75, Math.min(1.05, 120 / Math.max(10, dist)));
      const opacity = Math.min(1.0, Math.max(0.2, 1.2 - (dist / 350)));

      item.el.style.opacity = opacity.toFixed(2);
      item.el.style.pointerEvents = opacity > 0.3 ? 'auto' : 'none';
      item.el.style.transform = `translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px, 0) translate(-50%, -100%) scale(${scale.toFixed(2)})`;
    }
  }
}
