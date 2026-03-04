/**
 * Data Loader - Fetches all GeoJSON files via Promise.all
 */
const DataLoader = {
    async loadAll() {
        const sectorKeys = Object.keys(CONFIG.dataPaths.sectors);
        const sectorPromises = sectorKeys.map(key =>
            fetch(CONFIG.dataPaths.sectors[key])
                .then(r => { if (!r.ok) throw new Error(`Failed to load ${key}`); return r.json(); })
                .then(geojson => ({ key, geojson }))
        );

        const canalLinesPromise = fetch(CONFIG.dataPaths.canals.lines)
            .then(r => { if (!r.ok) throw new Error('Failed to load canal lines'); return r.json(); });

        const canalLabelsPromise = fetch(CONFIG.dataPaths.canals.labels)
            .then(r => { if (!r.ok) throw new Error('Failed to load canal labels'); return r.json(); });

        const [sectorResults, canalLines, canalLabels] = await Promise.all([
            Promise.all(sectorPromises),
            canalLinesPromise,
            canalLabelsPromise
        ]);

        const sectors = {};
        for (const { key, geojson } of sectorResults) {
            sectors[key] = geojson;
        }

        return { sectors, canalLines, canalLabels };
    }
};
