/**
 * Map Layers - Sector polygons + canal lines rendering
 * Canals drawn on a dedicated higher pane so they always sit on top.
 */
const MapLayers = {
    _map: null,
    _sectorLayers: {},
    _canalLayer: null,
    _layerControl: null,

    init(map, allFeatures, canalLines) {
        this._map = map;

        // Create a custom pane for canals that renders above polygons
        // Default overlayPane z-index is 400; we put canals at 450
        map.createPane('canalPane');
        map.getPane('canalPane').style.zIndex = 450;

        const overlays = {};

        // ── Canal lines first so they appear at top of layer control ──
        if (canalLines && canalLines.features) {
            this._canalLayer = L.geoJSON(canalLines, {
                pane: 'canalPane',
                renderer: L.canvas({ pane: 'canalPane' }),
                style: (feature) => {
                    const name = (feature.properties.Name || '').toLowerCase();
                    const isMain = name.includes('main') || name.includes('gezira');
                    return {
                        color: isMain ? CONFIG.canals.mainColor : CONFIG.canals.minorColor,
                        weight: isMain ? CONFIG.canals.mainWeight : CONFIG.canals.minorWeight,
                        opacity: isMain ? 1.0 : 0.65,
                        dashArray: isMain ? null : '4,3'
                    };
                },
                onEachFeature: (feature, layer) => {
                    const name = feature.properties.Name;
                    if (name && name !== 'Untitled Path') {
                        layer.bindTooltip(name, { sticky: true });
                    }
                }
            });
            this._canalLayer.addTo(map);
            overlays['Canals'] = this._canalLayer;
        }

        // ── Sector polygons (default overlayPane) ──
        for (const [sectorName, sectorConfig] of Object.entries(CONFIG.sectors)) {
            const features = allFeatures.filter(f => f.properties.sector === sectorName);
            const layer = L.geoJSON({
                type: 'FeatureCollection',
                features: features
            }, {
                renderer: L.canvas(),
                style: () => ({
                    fillColor: sectorConfig.color,
                    fillOpacity: 0.30,
                    color: sectorConfig.color,
                    weight: 0.6,
                    opacity: 0.5
                }),
                onEachFeature: (feature, layer) => {
                    const p = feature.properties;
                    const tooltip = `
                        <div class="feature-tooltip">
                            <strong>${p.canalName}</strong>
                            ${p.nameArabic ? `<br><span class="arabic">${p.nameArabic}</span>` : ''}
                            <br>Division: ${p.division}
                            <br>Office: ${p.office}
                            <br>Area: ${p.areaFeddan.toLocaleString()} feddan
                        </div>
                    `;
                    layer.bindTooltip(tooltip, { sticky: true });
                }
            });

            this._sectorLayers[sectorName] = layer;
            layer.addTo(map);
            overlays[sectorConfig.label] = layer;
        }

        // Layer control
        this._layerControl = L.control.layers(null, overlays, {
            position: 'topright',
            collapsed: true
        }).addTo(map);
    }
};
