/**
 * Simulated Data — Gezira problem incident counts per command area
 *
 * Generates realistic complaint/incident counts (integers) per category
 * per year, proportional to area size with sector-specific biases
 * reflecting real conditions in the Gezira Scheme.
 *
 * Problem patterns:
 *   Water Shortage  — worst in East (tail-end), worsening over years
 *   Siltation       — worst in North (oldest canals), steady
 *   Waterlogging    — worst in South (low drainage), seasonal peaks
 *   Canal Damage    — worst in West (poor maintenance), increasing
 *   Land Degradation— worst in South (salinity), gradual increase
 */
const SimulatedData = {
    // Mulberry32 seeded PRNG
    _mulberry32(seed) {
        return function() {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    },

    _hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    },

    // Sector bias multipliers — which problems hit which sectors hardest
    _sectorBias: {
        East:  { waterShortage: 1.8, siltation: 1.0, waterlogging: 0.7, canalDamage: 0.9, landDegradation: 1.1 },
        North: { waterShortage: 0.9, siltation: 1.7, waterlogging: 0.8, canalDamage: 1.2, landDegradation: 0.8 },
        South: { waterShortage: 1.1, siltation: 0.9, waterlogging: 1.8, canalDamage: 1.0, landDegradation: 1.7 },
        West:  { waterShortage: 1.0, siltation: 1.1, waterlogging: 0.9, canalDamage: 1.6, landDegradation: 1.0 }
    },

    // Year-over-year trend multipliers (problems generally worsening)
    _yearTrend: {
        waterShortage:   [1.0, 1.12, 1.25, 1.40],   // getting worse
        siltation:       [1.0, 1.02, 1.05, 1.08],   // slowly increasing
        waterlogging:    [1.0, 0.9,  1.15, 1.05],   // seasonal variation
        canalDamage:     [1.0, 1.08, 1.18, 1.30],   // infrastructure decay
        landDegradation: [1.0, 1.05, 1.12, 1.20]    // gradual
    },

    // Base incident rate per 100 feddan
    _baseRate: {
        waterShortage:   8,
        siltation:       5,
        waterlogging:    6,
        canalDamage:     4,
        landDegradation: 3
    },

    generateForFeature(feature) {
        if (feature._simulated) return feature._simulated;

        const p = feature.properties;
        const seedStr = (p.sector || '') + '_' + (p.objectId || 0);
        const rng = this._mulberry32(this._hashString(seedStr));

        const area = Math.max(p.areaFeddan || 50, 10);
        const sector = p.sector || 'East';
        const bias = this._sectorBias[sector] || this._sectorBias.East;
        const data = {};

        for (const cat of CONFIG.categories) {
            const base = this._baseRate[cat.key] || 5;
            const trend = this._yearTrend[cat.key] || [1, 1, 1, 1];
            const sectorMul = bias[cat.key] || 1.0;

            const yearValues = [];
            for (let y = 0; y < CONFIG.years.length; y++) {
                // Base count proportional to area with randomness
                const areaFactor = area / 100;
                const noise = 0.5 + rng() * 1.0; // 0.5x to 1.5x random
                const count = Math.round(base * areaFactor * sectorMul * trend[y] * noise);
                yearValues.push(Math.max(0, count));
            }
            data[cat.key] = yearValues;
        }

        feature._simulated = data;
        return data;
    },

    /**
     * Aggregate: sum all incident counts across features (like NYC 311 totals)
     */
    aggregate(features) {
        if (!features.length) return null;

        const result = {};
        for (const cat of CONFIG.categories) {
            const yearTotals = new Array(CONFIG.years.length).fill(0);
            for (const f of features) {
                const data = this.generateForFeature(f);
                const vals = data[cat.key];
                for (let y = 0; y < CONFIG.years.length; y++) {
                    yearTotals[y] += vals[y];
                }
            }
            result[cat.key] = yearTotals;
        }

        return result;
    }
};
