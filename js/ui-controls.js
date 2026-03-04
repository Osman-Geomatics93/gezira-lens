/**
 * IconDrag — drag category icons from the bar onto the map
 *
 * Drag icon → drop on map → new lens.
 * Drop icon on existing lens → merge into that lens.
 * Click lens center → return categories to bar.
 */
const IconDrag = {
    _ghost: null,
    _draggingCatIdx: null,
    _mapContainer: null,
    _highlightedLens: null,

    init(map) {
        this._mapContainer = map.getContainer();

        // Bind handlers before use so event add/remove uses stable references
        this._onMove = this._onMove.bind(this);
        this._onUp   = this._onUp.bind(this);

        this._setupIcons(map);
    },

    _setupIcons(map) {
        const icons = document.querySelectorAll('.cat-icon[data-cat]');

        icons.forEach(icon => {
            icon.addEventListener('pointerdown', (e) => {
                const idx = parseInt(icon.dataset.cat);
                if (icon.classList.contains('used')) return;

                e.preventDefault();
                this._draggingCatIdx = idx;

                // Create ghost (clone of the icon box)
                this._ghost = icon.querySelector('.cat-icon-box').cloneNode(true);
                this._ghost.classList.add('icon-ghost');
                this._ghost.style.left = e.clientX + 'px';
                this._ghost.style.top  = e.clientY + 'px';
                document.body.appendChild(this._ghost);

                document.addEventListener('pointermove', this._onMove);
                document.addEventListener('pointerup', this._onUp);
            });
        });
    },

    _onMove(e) {
        if (!this._ghost) return;
        this._ghost.style.left = e.clientX + 'px';
        this._ghost.style.top  = e.clientY + 'px';

        // Highlight lens if cursor is near one (merge preview)
        this._updateMergeHighlight(e.clientX, e.clientY);
    },

    _onUp(e) {
        document.removeEventListener('pointermove', this._onMove);
        document.removeEventListener('pointerup', this._onUp);

        // Clear any merge highlight
        this._clearMergeHighlight();

        if (!this._ghost) return;
        this._ghost.remove();
        this._ghost = null;

        const idx = this._draggingCatIdx;
        this._draggingCatIdx = null;

        // Check if dropped over the map
        const rect = this._mapContainer.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right ||
            e.clientY < rect.top  || e.clientY > rect.bottom) {
            return; // dropped outside map
        }

        // Convert to latlng
        const map = LensManager._map;
        const cp  = L.point(e.clientX - rect.left, e.clientY - rect.top);
        const ll  = map.containerPointToLatLng(cp);

        // Check if near an existing lens → merge (generous 140px zone)
        const nearLens = LensManager.findLensNear(ll, 140);
        if (nearLens) {
            LensManager.mergeCategoryIntoLens(nearLens, idx);
        } else {
            LensManager.createLens(ll, idx);
        }

        // Mark icon as used
        this._markUsed(idx);
    },

    /* ── Merge highlight: show glow on nearby lens while dragging ── */
    _updateMergeHighlight(clientX, clientY) {
        const rect = this._mapContainer.getBoundingClientRect();
        if (clientX < rect.left || clientX > rect.right ||
            clientY < rect.top  || clientY > rect.bottom) {
            this._clearMergeHighlight();
            return;
        }

        const map = LensManager._map;
        const cp  = L.point(clientX - rect.left, clientY - rect.top);
        const ll  = map.containerPointToLatLng(cp);
        const nearLens = LensManager.findLensNear(ll, 140);

        if (nearLens && nearLens !== this._highlightedLens) {
            this._clearMergeHighlight();
            nearLens.chartDiv.classList.add('merge-highlight');
            this._highlightedLens = nearLens;
        } else if (!nearLens && this._highlightedLens) {
            this._clearMergeHighlight();
        }
    },

    _clearMergeHighlight() {
        if (this._highlightedLens) {
            this._highlightedLens.chartDiv.classList.remove('merge-highlight');
            this._highlightedLens = null;
        }
    },

    _markUsed(idx) {
        const icon = document.querySelector(`.cat-icon[data-cat="${idx}"]`);
        if (icon) icon.classList.add('used');
    },

    returnIcon(idx) {
        const icon = document.querySelector(`.cat-icon[data-cat="${idx}"]`);
        if (icon) icon.classList.remove('used');
    }
};


/**
 * UIControls — radius slider + keyboard
 */
const UIControls = {
    init(map) {
        IconDrag.init(map);
        this._setupRadiusSlider();
        this._setupRadiusScroll(map);
    },

    _setupRadiusSlider() {
        const slider = document.getElementById('radius-slider');
        const valEl  = document.getElementById('radius-slider-val');
        if (!slider) return;

        slider.addEventListener('input', () => {
            const km = parseInt(slider.value);
            LensManager.updateAllRadii(km * 1000);
            if (valEl) valEl.textContent = km + ' km';
        });
    },

    _setupRadiusScroll(map) {
        document.addEventListener('keydown', (e) => {
            const slider = document.getElementById('radius-slider');
            if (!slider) return;
            let km = parseInt(slider.value);
            if (e.key === '+' || e.key === '=') km = Math.min(50, km + 2);
            else if (e.key === '-' || e.key === '_') km = Math.max(5, km - 2);
            else return;
            slider.value = km;
            LensManager.updateAllRadii(km * 1000);
            const valEl = document.getElementById('radius-slider-val');
            if (valEl) valEl.textContent = km + ' km';
        });
    },

    updateInfo() {},

    hideLoading() {
        const el = document.getElementById('loading-overlay');
        if (el) {
            el.style.opacity = '0';
            setTimeout(() => el.style.display = 'none', 500);
        }
    },

    showError(msg) {
        const el = document.getElementById('loading-overlay');
        if (el) {
            el.innerHTML = `<div class="loading-error">
                <p>Failed to load data</p>
                <p class="error-detail">${msg}</p>
            </div>`;
        }
    }
};
