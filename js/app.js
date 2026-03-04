/**
 * App — Entry point
 */
(async function() {
    const map = L.map('map', {
        center: CONFIG.map.center,
        zoom: CONFIG.map.zoom,
        minZoom: CONFIG.map.minZoom,
        maxZoom: CONFIG.map.maxZoom,
        preferCanvas: true,
        zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &middot; &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    try {
        const data = await DataLoader.loadAll();
        const allFeatures = DataNormalizer.normalizeAll(data.sectors);
        for (const f of allFeatures) SimulatedData.generateForFeature(f);
        SpatialIndex.build(allFeatures);
        MapLayers.init(map, allFeatures, data.canalLines);

        // Init lens manager (no default lens — user drags icons to create)
        LensManager.init(map);

        // Init UI (icon drag + radius slider)
        UIControls.init(map);

        // New features
        Sparklines.init(allFeatures);
        TimePlayer.init();
        HeatmapLayer.init(map, allFeatures);
        Search.init(map, allFeatures);
        ComparisonPanel.init();
        ExportTool.init();

        UIControls.hideLoading();
    } catch (err) {
        console.error('Init failed:', err);
        UIControls.showError(err.message);
    }
})();
