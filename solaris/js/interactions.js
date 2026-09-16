/**
 * interactions.js — SOLARIS Phase C & D Upgrades
 * Responsibility:
 *   - Raycasting for planet hover + click
 *   - Smooth real-time camera tracking on planet selection
 *   - Saturn ring tooltip
 *   - ESC and Back buttons to reset
 *   - Search & AI Assistant navigation integration
 */

import * as THREE from 'three';

// ─── Saturn ring composition zones ────────────────────────────────────────────
const RING_ZONES = [
  { maxRatio: 1.60, label: 'C Ring — fine dust & dark particles' },
  { maxRatio: 1.85, label: 'B Ring — dense water-ice particles'  },
  { maxRatio: 2.05, label: 'Cassini Division — sparse debris gap' },
  { maxRatio: 2.28, label: 'A Ring — ice & rocky aggregates'     },
  { maxRatio: 2.60, label: 'F Ring — braided, narrow outer ring' },
];

export class InteractionManager {
  constructor({ scene, camera, renderer, planetManager, ui, cameraCtrl }) {
    this._scene         = scene;
    this._camera        = camera;
    this._renderer      = renderer;
    this._planetManager = planetManager;
    this._ui            = ui;
    this._cameraCtrl    = cameraCtrl;

    this._raycaster     = new THREE.Raycaster();
    this._pointer       = new THREE.Vector2(-9999, -9999);

    this._hoveredId     = null;
    this._selectedId    = null;
    this._sceneReady    = false;

    this._mouseDownPos  = new THREE.Vector2();

    this._ringTip       = this._createRingTooltip();
    this._missions3D    = null;
    this._hoveredMissionId = null;

    this._pointerDirty  = false;
    this._lastClientX   = 0;
    this._lastClientY   = 0;

    // Wire search selection
    this._ui.onPlanetSelect((id) => this.navigateTo(id));
  }

  setMissions3D(missions3D) {
    this._missions3D = missions3D;
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  setSceneReady() {
    this._sceneReady = true;
    this._bindEvents();
  }

  // ─── Ring Tooltip (Inline DOM) ───────────────────────────────────────────────

  _createRingTooltip() {
    const el = document.createElement('div');
    el.id    = 'ring-tooltip';
    Object.assign(el.style, {
      position:        'fixed',
      zIndex:          '450',
      pointerEvents:   'none',
      userSelect:      'none',
      padding:         '5px 12px',
      background:      'rgba(5,12,28,0.88)',
      border:          '1px solid rgba(74,158,255,0.22)',
      borderRadius:    '6px',
      fontFamily:      "'Space Mono', monospace",
      fontSize:        '0.60rem',
      letterSpacing:   '0.10em',
      color:           '#00D4FF',
      backdropFilter:  'blur(12px)',
      whiteSpace:      'nowrap',
      opacity:         '0',
      transition:      'opacity 0.18s ease',
    });
    document.body.appendChild(el);
    return el;
  }

  _showRingTip(text, cx, cy) {
    this._ringTip.textContent   = text;
    this._ringTip.style.left    = `${cx + 16}px`;
    this._ringTip.style.top     = `${cy - 24}px`;
    this._ringTip.style.opacity = '1';
  }

  _hideRingTip() {
    this._ringTip.style.opacity = '0';
  }

  // ─── Event Binding ───────────────────────────────────────────────────────────

  _bindEvents() {
    const el = this._renderer.domElement;

    el.addEventListener('pointerdown', (e) => {
      this._mouseDownPos.set(e.clientX, e.clientY);
      // Cancel tour if user initiates mouse drag
      if (this._cameraCtrl.isTouring()) {
        this._cameraCtrl.stopTour();
        this._ui.endTourUI();
      }
    });

    el.addEventListener('pointermove', (e) => this._onPointerMove(e));

    el.addEventListener('click', (e) => {
      const dx = e.clientX - this._mouseDownPos.x;
      const dy = e.clientY - this._mouseDownPos.y;
      if (Math.hypot(dx, dy) < 6) this._onClick();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this._onEscape();
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  _getPlanetMeshes() {
    return this._planetManager.getPlanetObjects()
      .map((obj, i) => ({
        mesh:  obj.group.getObjectByName(`${obj.data.id}-sphere`),
        data:  obj.data,
        order: i + 1,
        obj,
      }))
      .filter(x => x.mesh != null);
  }

  _worldToScreen(wp) {
    const v = wp.clone().project(this._camera);
    return {
      x: ( v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  _updatePointer(event) {
    const rect = this._renderer.domElement.getBoundingClientRect();
    this._pointer.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
    this._pointer.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;
  }

  // ─── Pointer Move ─────────────────────────────────────────────────────────

  _onPointerMove(event) {
    this._updatePointer(event);
    this._pointerDirty = true;
    this._lastClientX = event.clientX;
    this._lastClientY = event.clientY;
  }

  _performRaycast() {
    if (this._cameraCtrl._isAnimating || this._cameraCtrl.isTouring()) return;

    this._raycaster.setFromCamera(this._pointer, this._camera);
    const targets  = this._getPlanetMeshes();
    const meshList = targets.map(t => t.mesh);
    const hits     = this._raycaster.intersectObjects(meshList, false);

    if (hits.length > 0) {
      const hit   = targets.find(t => t.mesh === hits[0].object);
      if (!hit) return;

      const newId = hit.data.id;

      if (this._hoveredId !== newId) {
        if (this._hoveredId) this._planetManager.unhighlightPlanet(this._hoveredId);

        this._hoveredId = newId;
        this._planetManager.highlightPlanet(newId);

        const wp     = this._planetManager.getPlanetWorldPosition(newId);
        const screen = this._worldToScreen(wp);
        this._ui.showHoverCard(hit.data, screen.x, screen.y, hit.order);
        this._renderer.domElement.style.cursor = 'pointer';
      }
    } else {
      if (this._hoveredId !== null) {
        this._planetManager.unhighlightPlanet(this._hoveredId);
        this._hoveredId = null;
        this._ui.hideHoverCard();
        this._renderer.domElement.style.cursor = 'grab';
      }
    }
  }

  _updateRingTooltip(cx, cy) {
    const saturnObj = this._planetManager.getPlanetObjects()
      .find(o => o.data.id === 'saturn');
    if (!saturnObj) { this._hideRingTip(); return; }

    const ringMesh = saturnObj.group.getObjectByName('saturn-rings');
    if (!ringMesh) { this._hideRingTip(); return; }

    this._raycaster.setFromCamera(this._pointer, this._camera);
    const hits = this._raycaster.intersectObject(ringMesh, false);

    if (hits.length === 0) { this._hideRingTip(); return; }

    const hitPt     = hits[0].point;
    const saturnPos = this._planetManager.getPlanetWorldPosition('saturn');
    const dist      = hitPt.distanceTo(saturnPos);
    const ratio     = dist / saturnObj.data.size;

    const zone = RING_ZONES.find(z => ratio <= z.maxRatio);
    this._showRingTip(zone ? zone.label : 'Outer ring boundary', cx, cy);
  }

  // ─── Click ────────────────────────────────────────────────────────────────────

  _onClick() {
    if (this._hoveredMissionId && this._missions3D) {
      this.navigateTo(this._hoveredMissionId);
      return;
    }
    if (!this._hoveredId) return;
    const targets = this._getPlanetMeshes();
    const hit     = targets.find(t => t.data.id === this._hoveredId);
    if (hit) this._selectPlanet(hit.data.id);
  }

  // ─── ESC ──────────────────────────────────────────────────────────────────────

  _onEscape() {
    if (this._cameraCtrl.isTouring()) {
      this._cameraCtrl.stopTour();
      this._ui.endTourUI();
    }
    if (!this._selectedId) return;
    this._hideRingTip();
    this._selectedId = null;
    this._ui.hideDetailPanel();
    this._cameraCtrl.clearTrackedPlanet();
    this._cameraCtrl.resetView();
    this._renderer.domElement.style.cursor = 'grab';
  }

  // ─── Planet Selection & Real-Time Tracking ────────────────────────────────────

  navigateTo(id) {
    if (this._missions3D) {
      const sc = this._missions3D.getSpacecraft(id);
      if (sc) {
        if (this._cameraCtrl.isTouring()) {
          this._cameraCtrl.stopTour();
          this._ui.endTourUI();
        }
        this._selectedId = null;
        this._ui.hideHoverCard();
        this._hideRingTip();
        this._ui.hideDetailPanel();
        this._cameraCtrl.flyToSpacecraft(sc);
        return;
      }
    }
    this._selectPlanet(id);
  }

  _selectPlanet(id) {
    if (this._cameraCtrl.isTouring()) {
      this._cameraCtrl.stopTour();
      this._ui.endTourUI();
    }

    if (id === 'sun') {
      if (this._hoveredId) {
        this._planetManager.unhighlightPlanet(this._hoveredId);
        this._hoveredId = null;
      }
      this._selectedId = null;
      this._ui.hideHoverCard();
      this._hideRingTip();
      this._ui.hideDetailPanel();
      this._cameraCtrl.clearTrackedPlanet();
      this._cameraCtrl.moveTo(new THREE.Vector3(0, 14, 28), new THREE.Vector3(0, 0, 0), 2.5);
      return;
    }

    const targets = this._getPlanetMeshes();
    const hit     = targets.find(t => t.data.id === id);
    if (!hit) return;

    if (this._hoveredId) {
      this._planetManager.unhighlightPlanet(this._hoveredId);
      this._hoveredId = null;
    }

    this._selectedId = id;
    this._ui.hideHoverCard();
    this._hideRingTip();
    this._renderer.domElement.style.cursor = 'grab';

    const pObj = this._planetManager.getPlanetObject(id);
    if (!pObj) return;

    // Smoothly fly to the moving planet and lock real-time tracking
    this._cameraCtrl.flyToPlanet(pObj, 'standard');

    // Show detail panel
    this._ui.showDetailPanel(hit.data, hit.order, {
      onOrbit: () => {
        this._cameraCtrl.flyToPlanet(pObj, 'orbit');
      },
      onExplore: () => {
        this._cameraCtrl.flyToPlanet(pObj, 'explore');
      },
      onBack: () => {
        this._selectedId = null;
        this._hideRingTip();
        this._cameraCtrl.clearTrackedPlanet();
        this._cameraCtrl.resetView();
        this._renderer.domElement.style.cursor = 'grab';
      },
    });
  }

  // ─── Per-Frame Update ─────────────────────────────────────────────────────────

  update(_delta) {
    if (!this._sceneReady) return;

    if (this._selectedId) {
      if (this._selectedId === 'saturn' && this._pointerDirty) {
        this._updateRingTooltip(this._lastClientX, this._lastClientY);
        this._pointerDirty = false;
      }
      return;
    }

    // Synchronize raycast to animation frame instead of mouse-event frequency
    if (this._pointerDirty) {
      this._performRaycast();
      this._pointerDirty = false;
    }

    if (this._hoveredId) {
      const wp = this._planetManager.getPlanetWorldPosition(this._hoveredId);
      if (wp) this._ui.updateHoverCardPosition(...Object.values(this._worldToScreen(wp)));
    }
  }
}
