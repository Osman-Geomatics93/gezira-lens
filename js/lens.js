/**
 * LensManager — multiple independent lenses created by dragging icons
 *
 * Drag an icon from the bar → drop on map → new lens for that category.
 * Drag an icon onto an existing lens → merge (combine categories).
 * Click a category badge on lens → remove just that category (separate).
 * Click lens center → remove entire lens.
 */
const LensManager = {
    _map: null,
    _lenses: [],
    _nextId: 0,
    _container: null,
    _highlightYear: null,
    _tooltipDiv: null,

    init(map) {
        this._map = map;
        this._container = document.getElementById('lens-container');

        // Bar hover tooltip
        this._tooltipDiv = document.createElement('div');
        this._tooltipDiv.id = 'bar-tooltip';
        this._tooltipDiv.style.display = 'none';
        document.body.appendChild(this._tooltipDiv);

        map.on('move zoom viewreset zoomend moveend resize', () => {
            this._lenses.forEach(l => this._positionLens(l));
        });
    },

    /* ══════════════════════════════════════════════════
       Create a new lens
       ══════════════════════════════════════════════════ */
    createLens(latlng, catIndex) {
        const id = this._nextId++;
        const radius = parseInt(document.getElementById('radius-slider').value) * 1000
                       || CONFIG.lens.defaultRadius;

        const circle = L.circle(latlng, {
            radius, color: CONFIG.lens.strokeColor,
            weight: CONFIG.lens.strokeWeight,
            fillColor: '#999', fillOpacity: CONFIG.lens.fillOpacity,
            dashArray: '6,4', interactive: false
        }).addTo(this._map);

        // Chart container
        const chartDiv = document.createElement('div');
        chartDiv.className = 'lens-chart-instance';
        chartDiv.id = `lens-chart-${id}`;
        this._container.appendChild(chartDiv);

        // Drag handle
        const dragDiv = document.createElement('div');
        dragDiv.className = 'lens-drag-instance';
        dragDiv.id = `lens-drag-${id}`;
        dragDiv.title = 'Drag to move · Click to remove all';
        this._container.appendChild(dragDiv);

        // Category badges container (for separate action)
        const badgesDiv = document.createElement('div');
        badgesDiv.className = 'lens-badges';
        badgesDiv.id = `lens-badges-${id}`;
        this._container.appendChild(badgesDiv);

        // Radius label
        const labelDiv = document.createElement('div');
        labelDiv.className = 'lens-focus-label';
        labelDiv.id = `lens-label-${id}`;
        labelDiv.textContent = (radius / 1000).toFixed(0) + ' km';
        this._container.appendChild(labelDiv);

        const lens = {
            id, center: latlng, radius,
            categories: new Set([catIndex]),
            circle, chartDiv, dragDiv, badgesDiv, labelDiv,
            chart: null, _wasDragged: false
        };

        lens.chart = this._createChart(chartDiv);
        this._lenses.push(lens);

        this._setupLensDrag(lens);
        this._setupLensClick(lens);

        this._positionLens(lens);
        this._updateLens(lens);

        if (typeof ComparisonPanel !== 'undefined') ComparisonPanel.check();
        return lens;
    },

    /* ══════════════════════════════════════════════════
       Merge a category into an existing lens
       ══════════════════════════════════════════════════ */
    mergeCategoryIntoLens(lens, catIndex) {
        lens.categories.add(catIndex);
        this._updateLens(lens);
        if (typeof ComparisonPanel !== 'undefined') ComparisonPanel.check();
    },

    /* ══════════════════════════════════════════════════
       Remove ONE category from a lens (separate)
       ══════════════════════════════════════════════════ */
    removeCategoryFromLens(lens, catIndex) {
        IconDrag.returnIcon(catIndex);
        lens.categories.delete(catIndex);

        if (lens.categories.size === 0) {
            this._removeLensDOM(lens);
        } else {
            this._updateLens(lens);
        }
        if (typeof ComparisonPanel !== 'undefined') ComparisonPanel.check();
    },

    /* ══════════════════════════════════════════════════
       Remove entire lens and return ALL categories
       ══════════════════════════════════════════════════ */
    removeLens(lens) {
        lens.categories.forEach(ci => IconDrag.returnIcon(ci));
        this._removeLensDOM(lens);
    },

    _removeLensDOM(lens) {
        this._map.removeLayer(lens.circle);
        lens.chartDiv.remove();
        lens.dragDiv.remove();
        lens.badgesDiv.remove();
        lens.labelDiv.remove();
        this._lenses = this._lenses.filter(l => l.id !== lens.id);
        if (typeof ComparisonPanel !== 'undefined') ComparisonPanel.check();
    },

    /* ══════════════════════════════════════════════════ */
    findLensNear(latlng, thresholdPx) {
        for (const lens of this._lenses) {
            const p1 = this._map.latLngToContainerPoint(lens.center);
            const p2 = this._map.latLngToContainerPoint(latlng);
            if (p1.distanceTo(p2) < thresholdPx) return lens;
        }
        return null;
    },

    /* ── D3 chart instance ── */
    _createChart(el) {
        const size = CONFIG.lens.chartSize;
        el.style.width  = size + 'px';
        el.style.height = size + 'px';

        const svg = d3.select(el)
            .append('svg')
            .attr('width', size).attr('height', size)
            .style('overflow', 'visible');

        const g = svg.append('g')
            .attr('transform', `translate(${size / 2},${size / 2})`);

        return { svg, g, size };
    },

    /* ── Update lens: query data, draw chart, update badges ── */
    _updateLens(lens) {
        const features = SpatialIndex.queryCircle(
            { lat: lens.center.lat, lng: lens.center.lng },
            lens.radius
        );
        const data = this._aggregateForCategories(features, lens.categories);
        this._drawChart(lens, data, features.length);
        this._updateBadges(lens);
    },

    _aggregateForCategories(features, catSet) {
        if (!features.length) return null;
        const cats = CONFIG.categories.filter((_, i) => catSet.has(i));
        const result = {};
        for (const cat of cats) {
            const totals = new Array(CONFIG.years.length).fill(0);
            for (const f of features) {
                const d = SimulatedData.generateForFeature(f);
                const v = d[cat.key];
                for (let y = 0; y < CONFIG.years.length; y++) totals[y] += v[y];
            }
            result[cat.key] = totals;
        }
        return result;
    },

    /* ══════════════════════════════════════════════════
       Category badges — colored dots around the lens
       Click a badge → remove that single category
       ══════════════════════════════════════════════════ */
    _updateBadges(lens) {
        // Clear old badges
        lens.badgesDiv.innerHTML = '';

        const cats = [...lens.categories].sort((a, b) => a - b);
        const n = cats.length;
        const badgeR = 22; // distance from center for badges
        const size = CONFIG.lens.chartSize;

        cats.forEach((catIdx, i) => {
            const cat = CONFIG.categories[catIdx];
            const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
            const bx = size / 2 + badgeR * Math.cos(angle);
            const by = size / 2 + badgeR * Math.sin(angle);

            const badge = document.createElement('div');
            badge.className = 'lens-badge';
            badge.style.background = cat.color;
            badge.style.left = bx + 'px';
            badge.style.top  = by + 'px';
            badge.title = n > 1
                ? `Remove ${cat.label}`
                : `Remove ${cat.label} (removes lens)`;

            // "x" icon inside
            badge.innerHTML = '<svg viewBox="0 0 10 10" width="8" height="8"><line x1="2" y1="2" x2="8" y2="8" stroke="white" stroke-width="1.8" stroke-linecap="round"/><line x1="8" y1="2" x2="2" y2="8" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>';

            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeCategoryFromLens(lens, catIdx);
            });

            lens.badgesDiv.appendChild(badge);
        });
    },

    /* ══════════════════════════════════════════════════
       Draw compact radial chart
       ══════════════════════════════════════════════════ */
    _drawChart(lens, data, count) {
        const g = lens.chart.g;
        g.selectAll('*').remove();

        if (!data || count === 0) {
            g.append('text')
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('fill', '#999')
                .attr('font-size', '10px').attr('font-weight', '600')
                .attr('font-family', 'Inter, sans-serif')
                .text('No data');
            return;
        }

        const allCats    = CONFIG.categories;
        const years      = CONFIG.years;
        const nYears     = years.length;
        const activeCats = allCats.filter((_, i) => lens.categories.has(i));
        const nActive    = activeCats.length;
        if (!nActive) return;

        const R        = lens.chart.size / 2;
        const innerR   = CONFIG.lens.innerRadius;
        const maxOuterR = R - 8;
        const maxBarLen = maxOuterR - innerR;

        const catAngle = (Math.PI * 2) / nActive;
        const catPad   = 0.06;
        const barPad   = 0.015;
        const usable   = catAngle - catPad;
        const barAngle = (usable - (nYears - 1) * barPad) / nYears;

        const arcGen = d3.arc().cornerRadius(2);

        let globalMax = 0;
        activeCats.forEach(cat => {
            globalMax = Math.max(globalMax, ...data[cat.key]);
        });
        if (globalMax === 0) globalMax = 1;

        activeCats.forEach((cat, ci) => {
            const sg   = g.append('g');
            const vals = data[cat.key];

            // Background sweep
            sg.append('path')
                .attr('d', arcGen({
                    innerRadius: innerR,
                    outerRadius: innerR + maxBarLen * 0.08,
                    startAngle: ci * catAngle + catPad / 2,
                    endAngle: (ci + 1) * catAngle - catPad / 2
                }))
                .attr('fill', cat.color).attr('opacity', 0.08);

            years.forEach((yr, yi) => {
                const pct    = Math.min(vals[yi] / globalMax, 1);
                const barLen = Math.max(6, maxBarLen * pct);
                const outerR = innerR + barLen;
                let opa    = 0.35 + (yi / (nYears - 1)) * 0.60;
                if (this._highlightYear !== null) {
                    opa = (yr === this._highlightYear) ? 0.95 : 0.15;
                }

                const sa = ci * catAngle + catPad / 2 + yi * (barAngle + barPad);
                const ea = sa + barAngle;

                sg.append('path')
                    .attr('d', arcGen({
                        innerRadius: innerR, outerRadius: outerR,
                        startAngle: sa, endAngle: ea
                    }))
                    .attr('fill', cat.color).attr('opacity', opa);

                // Hover target for tooltip
                const prevVal = yi > 0 ? vals[yi - 1] : null;
                const pctChange = prevVal !== null && prevVal > 0
                    ? Math.round((vals[yi] - prevVal) / prevVal * 100)
                    : null;
                const catLabel = cat.label;
                const barVal = vals[yi];

                sg.append('path')
                    .attr('d', arcGen({
                        innerRadius: Math.max(innerR - 3, 0),
                        outerRadius: outerR + 6,
                        startAngle: sa - 0.02,
                        endAngle: ea + 0.02
                    }))
                    .attr('fill', 'transparent')
                    .attr('class', 'bar-hover-target')
                    .style('pointer-events', 'all')
                    .style('cursor', 'pointer')
                    .on('mouseenter', (event) => {
                        this._showBarTooltip(event, catLabel, yr, barVal, pctChange, cat.color);
                    })
                    .on('mousemove', (event) => {
                        this._moveBarTooltip(event);
                    })
                    .on('mouseleave', () => {
                        this._hideBarTooltip();
                    });

                const midA = (sa + ea) / 2 - Math.PI / 2;
                const cosM = Math.cos(midA), sinM = Math.sin(midA);
                const degM = midA * 180 / Math.PI;
                const flip = (degM > 90 || degM < -90) ? 180 : 0;

                // Year label
                if (barLen > 20) {
                    const yrR = innerR + barLen * 0.45;
                    sg.append('text')
                        .attr('x', yrR * cosM).attr('y', yrR * sinM)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('fill', 'white')
                        .attr('font-size', '7px').attr('font-weight', '800')
                        .attr('font-family', 'Inter, sans-serif')
                        .attr('paint-order', 'stroke')
                        .attr('stroke', cat.color).attr('stroke-width', 1.5)
                        .attr('stroke-opacity', opa * 0.5)
                        .attr('transform', `rotate(${degM + 90 + flip},${yrR * cosM},${yrR * sinM})`)
                        .text(yr);
                }

                // Value at tip
                const vR   = outerR + 8;
                const vStr = vals[yi] >= 1000
                    ? (vals[yi] / 1000).toFixed(1) + 'K'
                    : Math.round(vals[yi]).toString();
                sg.append('text')
                    .attr('x', vR * cosM).attr('y', vR * sinM)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .attr('fill', cat.color)
                    .attr('font-size', '7px').attr('font-weight', '800')
                    .attr('font-family', 'Inter, sans-serif')
                    .attr('transform', `rotate(${degM + 90 + flip},${vR * cosM},${vR * sinM})`)
                    .text(vStr);
            });

            // Category label
            const lblR  = innerR + 6;
            const arcId = `clbl-${lens.id}-${ci}`;
            const lSA   = ci * catAngle + catPad / 2 + 0.08;
            const lEA   = (ci + 1) * catAngle - catPad / 2 - 0.08;
            const mA    = (lSA + lEA) / 2;
            const mDeg  = (mA * 180 / Math.PI) - 90;
            const needF = mDeg > 90 && mDeg < 270;

            const ap = g.append('path').attr('id', arcId)
                .attr('fill', 'none').attr('stroke', 'none');
            if (needF) ap.attr('d', this._svgArc(0, 0, lblR, lEA, lSA, true));
            else       ap.attr('d', this._svgArc(0, 0, lblR, lSA, lEA, false));

            sg.append('text')
                .attr('font-size', '8px').attr('font-weight', '800')
                .attr('fill', cat.color).attr('opacity', 0.9)
                .append('textPath')
                .attr('href', `#${arcId}`)
                .attr('startOffset', '50%')
                .attr('text-anchor', 'middle')
                .text(cat.label);
        });

        // Inner circle
        g.append('circle')
            .attr('r', innerR)
            .attr('fill', 'rgba(255,255,255,0.85)')
            .attr('stroke', '#555').attr('stroke-width', 1.5);

        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('y', -4).attr('fill', '#333')
            .attr('font-size', '13px').attr('font-weight', '900')
            .attr('font-family', 'Inter, sans-serif')
            .text(count);

        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('y', 9).attr('fill', '#888')
            .attr('font-size', '7px').attr('font-weight', '600')
            .attr('font-family', 'Inter, sans-serif')
            .text('areas');
    },

    /* ── Position all lens elements ── */
    _positionLens(lens) {
        const pt   = this._map.latLngToContainerPoint(lens.center);
        const rect = this._map.getContainer().getBoundingClientRect();
        const px   = rect.left + pt.x;
        const py   = rect.top  + pt.y;
        const size = CONFIG.lens.chartSize;

        lens.chartDiv.style.left = (px - size / 2) + 'px';
        lens.chartDiv.style.top  = (py - size / 2) + 'px';

        const hs = 50;
        lens.dragDiv.style.left = (px - hs / 2) + 'px';
        lens.dragDiv.style.top  = (py - hs / 2) + 'px';

        // Badges container same position as chart
        lens.badgesDiv.style.left = (px - size / 2) + 'px';
        lens.badgesDiv.style.top  = (py - size / 2) + 'px';

        lens.labelDiv.style.left = px + 'px';
        lens.labelDiv.style.top  = (py + size / 2 + 6) + 'px';
    },

    /* ── Drag ── */
    _setupLensDrag(lens) {
        let dragging = false;

        const onDown = (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            dragging = true;
            lens._wasDragged = false;
            lens.dragDiv.classList.add('dragging');
            this._map.dragging.disable();
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
        };

        const onMove = (e) => {
            if (!dragging) return;
            lens._wasDragged = true;
            const rect = this._map.getContainer().getBoundingClientRect();
            const cp = L.point(e.clientX - rect.left, e.clientY - rect.top);
            lens.center = this._map.containerPointToLatLng(cp);
            lens.circle.setLatLng(lens.center);
            this._positionLens(lens);
        };

        const onUp = () => {
            if (!dragging) return;
            dragging = false;
            lens.dragDiv.classList.remove('dragging');
            this._map.dragging.enable();
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            if (lens._wasDragged) this._updateLens(lens);
        };

        lens.dragDiv.addEventListener('pointerdown', onDown);
    },

    /* ── Click center → remove entire lens ── */
    _setupLensClick(lens) {
        lens.dragDiv.addEventListener('click', () => {
            if (lens._wasDragged) return;
            this.removeLens(lens);
        });
    },

    /* ── Radius update ── */
    updateAllRadii(meters) {
        this._lenses.forEach(lens => {
            lens.radius = meters;
            lens.circle.setRadius(meters);
            lens.labelDiv.textContent = (meters / 1000).toFixed(0) + ' km';
            this._positionLens(lens);
            this._updateLens(lens);
        });
    },

    /* ── Highlight year for time player ── */
    setHighlightYear(year) {
        this._highlightYear = year;
        this._lenses.forEach(l => this._updateLens(l));
    },

    /* ── Bar tooltip helpers ── */
    _showBarTooltip(event, catLabel, year, count, pctChange, color) {
        const tt = this._tooltipDiv;
        let changeHTML = '';
        if (pctChange !== null) {
            const sign = pctChange > 0 ? '+' : '';
            const arrow = pctChange > 0 ? '\u25B2' : (pctChange < 0 ? '\u25BC' : '');
            const trendColor = pctChange > 0 ? '#e74c3c' : (pctChange < 0 ? '#27ae60' : '#999');
            changeHTML = '<div class="tt-change" style="color:' + trendColor + '">' + sign + pctChange + '% from ' + (year - 1) + ' ' + arrow + '</div>';
        }
        tt.innerHTML =
            '<div class="tt-cat" style="color:' + color + '">' + catLabel + '</div>' +
            '<div class="tt-value">' + count.toLocaleString() + ' <span style="font-size:11px;font-weight:500;color:#aaa">incidents</span></div>' +
            '<div style="font-size:11px;color:#aaa">' + year + '</div>' +
            changeHTML;
        tt.style.display = 'block';
        this._moveBarTooltip(event);
    },

    _moveBarTooltip(event) {
        const tt = this._tooltipDiv;
        tt.style.left = (event.clientX + 14) + 'px';
        tt.style.top = (event.clientY - 14) + 'px';
    },

    _hideBarTooltip() {
        this._tooltipDiv.style.display = 'none';
    },

    _svgArc(cx, cy, r, sa, ea, ccw) {
        const t  = a => a - Math.PI / 2;
        const a1 = t(sa), a2 = t(ea);
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
        const d  = ccw ? (a1 - a2) : (a2 - a1);
        const lg = Math.abs(d) > Math.PI ? 1 : 0;
        const sw = ccw ? 0 : 1;
        return `M ${x1} ${y1} A ${r} ${r} 0 ${lg} ${sw} ${x2} ${y2}`;
    }
};
