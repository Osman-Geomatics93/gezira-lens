/**
 * HeatmapLayer — toggle heat overlay of problem density
 *
 * Uses leaflet.heat plugin to render a heatmap of incident density
 * from all feature centroids. Weight = total incidents across categories.
 * Updates when time player changes year.
 */
const HeatmapLayer = {
    _map: null,
    _allFeatures: null,
    _heatLayer: null,
    _visible: false,
    _currentYear: null,

    init(map, allFeatures) {
        this._map = map;
        this._allFeatures = allFeatures;
        this._currentYear = null;

        // Compute initial points (all years summed)
        const points = this._computePoints(null);

        this._heatLayer = L.heatLayer(points, {
            radius: CONFIG.heatmap.radius,
            blur: CONFIG.heatmap.blur,
            maxZoom: CONFIG.heatmap.maxZoom,
            gradient: CONFIG.heatmap.gradient
        });

        // Add to layer control
        if (MapLayers._layerControl) {
            MapLayers._layerControl.addOverlay(this._heatLayer, 'Problem Heatmap');
        }

        // Toggle button
        document.getElementById('heatmap-toggle').addEventListener('click', () => this.toggle());
    },

    _computePoints(year) {
        const points = [];
        for (const f of this._allFeatures) {
            const c = f._centroid;
            if (!c) continue;

            const d = SimulatedData.generateForFeature(f);
            let weight = 0;

            for (const cat of CONFIG.categories) {
                const vals = d[cat.key];
                if (year !== null) {
                    const yi = CONFIG.years.indexOf(year);
                    if (yi >= 0) weight += vals[yi];
                } else {
                    weight += vals.reduce((a, b) => a + b, 0);
                }
            }

            points.push([c.lat, c.lng, weight]);
        }
        return points;
    },

    toggle() {
        this._visible = !this._visible;
        const btn = document.getElementById('heatmap-toggle');

        if (this._visible) {
            this._heatLayer.addTo(this._map);
            // Refresh with latest year data after layer is on the map
            const points = this._computePoints(this._currentYear);
            this._heatLayer.setLatLngs(points);
            btn.classList.add('active');
        } else {
            this._map.removeLayer(this._heatLayer);
            btn.classList.remove('active');
        }
    },

    updateWeights(year) {
        this._currentYear = year;
        // Only call setLatLngs when the layer is actually on the map
        // to avoid leaflet-heat null _map error
        if (this._heatLayer._map) {
            const points = this._computePoints(year);
            this._heatLayer.setLatLngs(points);
        }
    }
};
