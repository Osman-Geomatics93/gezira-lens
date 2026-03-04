/**
 * Sparklines — tiny SVG trend charts inside category icon boxes
 *
 * After data loads, injects a 4-point sparkline (one point per year)
 * into each .cat-icon-box showing the global trend for that category.
 */
const Sparklines = {
    init(allFeatures) {
        // Calculate global totals for each category across ALL features
        const globalTotals = {};
        for (const cat of CONFIG.categories) {
            globalTotals[cat.key] = new Array(CONFIG.years.length).fill(0);
        }

        for (const f of allFeatures) {
            const d = SimulatedData.generateForFeature(f);
            for (const cat of CONFIG.categories) {
                const vals = d[cat.key];
                for (let y = 0; y < CONFIG.years.length; y++) {
                    globalTotals[cat.key][y] += vals[y];
                }
            }
        }

        // Draw sparklines into each icon box
        const icons = document.querySelectorAll('.cat-icon[data-cat]');
        icons.forEach(icon => {
            const catIdx = parseInt(icon.dataset.cat);
            const cat = CONFIG.categories[catIdx];
            const box = icon.querySelector('.cat-icon-box');
            const vals = globalTotals[cat.key];

            this._drawSparkline(box, vals, cat.color);
        });
    },

    _drawSparkline(box, vals, color) {
        const w = 34, h = 12;
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const range = max - min || 1;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('width', w);
        svg.setAttribute('height', h);
        svg.classList.add('sparkline-svg');

        const points = vals.map((v, i) => {
            const x = (i / (vals.length - 1)) * (w - 2) + 1;
            const y = h - 1 - ((v - min) / range) * (h - 2);
            return `${x},${y}`;
        });

        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('points', points.join(' '));
        polyline.setAttribute('fill', 'none');
        polyline.setAttribute('stroke', color);
        polyline.setAttribute('stroke-width', '1.5');
        polyline.setAttribute('stroke-linecap', 'round');
        polyline.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(polyline);

        box.appendChild(svg);

        // Trend arrow
        const lastVal = vals[vals.length - 1];
        const firstVal = vals[0];
        if (lastVal !== firstVal) {
            const arrow = document.createElement('span');
            arrow.className = 'sparkline-trend';
            arrow.textContent = lastVal > firstVal ? '\u25B2' : '\u25BC';
            arrow.style.color = lastVal > firstVal ? '#e74c3c' : '#27ae60';
            box.appendChild(arrow);
        }
    }
};
