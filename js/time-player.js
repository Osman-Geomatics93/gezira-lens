/**
 * TimePlayer — cinematic timeline bar for year-by-year animation
 *
 * Play/Pause button + year dots (2021-2024).
 * When playing: auto-advances every 1.5s, highlights active year bars.
 * All active lenses update simultaneously.
 */
const TimePlayer = {
    _playing: false,
    _interval: null,
    _currentIdx: -1,

    init() {
        this._playBtn = document.getElementById('play-btn');
        this._yearLabel = document.getElementById('current-year-label');
        this._yearDots = document.querySelectorAll('.year-dot');

        this._playBtn.addEventListener('click', () => {
            this._playing ? this.pause() : this.play();
        });

        this._yearDots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                // Click active year again to deactivate
                if (this._currentIdx === i && !this._playing) {
                    this.reset();
                } else {
                    this.pause();
                    this.setYear(i);
                }
            });
        });
    },

    play() {
        this._playing = true;
        this._updatePlayBtn();
        if (this._currentIdx < 0) this._currentIdx = 0;
        this.setYear(this._currentIdx);

        this._interval = setInterval(() => {
            this._currentIdx = (this._currentIdx + 1) % CONFIG.years.length;
            this.setYear(this._currentIdx);
        }, 1500);
    },

    pause() {
        this._playing = false;
        this._updatePlayBtn();
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
    },

    setYear(idx) {
        this._currentIdx = idx;
        const year = CONFIG.years[idx];

        // Update dots
        this._yearDots.forEach((dot, i) => {
            dot.classList.toggle('active', i === idx);
        });

        // Update large year label
        this._yearLabel.textContent = year;
        this._yearLabel.style.display = 'block';

        // Update all lenses
        LensManager.setHighlightYear(year);

        // Update heatmap if active
        if (typeof HeatmapLayer !== 'undefined') {
            HeatmapLayer.updateWeights(year);
        }

        // Update comparison panel if visible
        if (typeof ComparisonPanel !== 'undefined') {
            ComparisonPanel.check();
        }
    },

    reset() {
        this.pause();
        this._currentIdx = -1;
        this._yearDots.forEach(dot => dot.classList.remove('active'));
        this._yearLabel.style.display = 'none';
        LensManager.setHighlightYear(null);

        if (typeof HeatmapLayer !== 'undefined') {
            HeatmapLayer.updateWeights(null);
        }
        if (typeof ComparisonPanel !== 'undefined') {
            ComparisonPanel.check();
        }
    },

    _updatePlayBtn() {
        this._playBtn.innerHTML = this._playing
            ? '<svg viewBox="0 0 24 24" width="18" height="18"><rect x="6" y="4" width="4" height="16" fill="#333"/><rect x="14" y="4" width="4" height="16" fill="#333"/></svg>'
            : '<svg viewBox="0 0 24 24" width="18" height="18"><polygon points="6,4 20,12 6,20" fill="#333"/></svg>';
    }
};
