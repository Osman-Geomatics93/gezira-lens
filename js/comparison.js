/**
 * ComparisonPanel — side-by-side comparison when 2 lenses exist
 *
 * Slides in from the right when exactly 2 lenses are on the map.
 * Shows per-category incident totals with horizontal bar charts,
 * % difference with arrows, and an overall summary.
 */
const ComparisonPanel = {
    _panel: null,
    _content: null,
    _visible: false,

    init() {
        this._panel = document.getElementById('comparison-panel');
        this._content = document.getElementById('comparison-content');
    },

    check() {
        const lenses = LensManager._lenses;
        if (lenses.length === 2) {
            this.update(lenses[0], lenses[1]);
        } else {
            this.hide();
        }
    },

    update(lens1, lens2) {
        const data1 = this._computeData(lens1);
        const data2 = this._computeData(lens2);
        const labelA = this._getLensLabel(lens1, data1);
        const labelB = this._getLensLabel(lens2, data2);

        let html = `<table class="comparison-table">`;
        html += `<tr><th></th><th>${labelA}</th><th>${labelB}</th><th></th></tr>`;

        let totalA = 0, totalB = 0;

        for (const cat of CONFIG.categories) {
            const a = data1.data[cat.key];
            const b = data2.data[cat.key];
            totalA += a;
            totalB += b;

            const maxVal = Math.max(a, b) || 1;
            const pctA = (a / maxVal * 100).toFixed(0);
            const pctB = (b / maxVal * 100).toFixed(0);

            const diff = a > 0 ? Math.round((b - a) / a * 100) : (b > 0 ? 100 : 0);
            const arrow = diff > 0 ? '\u2191' : (diff < 0 ? '\u2193' : '');
            const diffColor = diff > 0 ? '#e74c3c' : (diff < 0 ? '#27ae60' : '#999');

            html += `<tr>
                <td class="comp-cat" style="color:${cat.color}">${cat.label}</td>
                <td class="comp-val">${a.toLocaleString()}</td>
                <td class="comp-val">${b.toLocaleString()}</td>
                <td class="comp-diff" style="color:${diffColor}">${diff > 0 ? '+' : ''}${diff}% ${arrow}</td>
            </tr>
            <tr>
                <td></td>
                <td colspan="2" class="comp-bars">
                    <div class="comp-bar-row">
                        <div class="comp-bar" style="width:${pctA}%; background:${cat.color}; opacity:0.5"></div>
                    </div>
                    <div class="comp-bar-row">
                        <div class="comp-bar" style="width:${pctB}%; background:${cat.color}; opacity:0.85"></div>
                    </div>
                </td>
                <td></td>
            </tr>`;
        }

        html += '</table>';

        // Overall summary
        const overallDiff = totalA > 0 ? Math.round((totalB - totalA) / totalA * 100) : 0;
        const worse = totalB > totalA ? labelB : (totalA > totalB ? labelA : null);

        if (worse) {
            html += `<div class="comp-summary">
                <strong>${worse}</strong> has more problems overall
                <span style="color:#e74c3c">(${Math.abs(overallDiff)}% more)</span>
            </div>`;
        } else {
            html += `<div class="comp-summary">Both areas have similar problem levels</div>`;
        }

        // Feature counts
        html += `<div class="comp-counts">${labelA}: ${data1.featureCount} areas &middot; ${labelB}: ${data2.featureCount} areas</div>`;

        this._content.innerHTML = html;
        this._show();
    },

    _computeData(lens) {
        const features = SpatialIndex.queryCircle(
            { lat: lens.center.lat, lng: lens.center.lng },
            lens.radius
        );

        const data = {};
        const highlightYear = LensManager._highlightYear;

        for (const cat of CONFIG.categories) {
            let total = 0;
            for (const f of features) {
                const d = SimulatedData.generateForFeature(f);
                const vals = d[cat.key];
                if (highlightYear !== null) {
                    const yi = CONFIG.years.indexOf(highlightYear);
                    if (yi >= 0) total += vals[yi];
                } else {
                    total += vals.reduce((a, b) => a + b, 0);
                }
            }
            data[cat.key] = total;
        }

        return { data, featureCount: features.length };
    },

    _getLensLabel(lens, lensData) {
        const features = SpatialIndex.queryCircle(
            { lat: lens.center.lat, lng: lens.center.lng },
            lens.radius
        );
        if (features.length > 0 && features[0].properties.canalName) {
            const name = features[0].properties.canalName;
            return name.length > 16 ? name.slice(0, 14) + '\u2026' : name;
        }
        return 'Area ' + (LensManager._lenses.indexOf(lens) + 1);
    },

    _show() {
        if (!this._visible) {
            this._visible = true;
            this._panel.classList.add('visible');
        }
    },

    hide() {
        if (this._visible) {
            this._visible = false;
            this._panel.classList.remove('visible');
        }
    }
};
