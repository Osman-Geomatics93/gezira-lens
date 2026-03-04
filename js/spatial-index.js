/**
 * Spatial Index - rbush R-tree + centroid distance queries
 */
const SpatialIndex = {
    _tree: null,
    _items: [],

    build(features) {
        this._tree = new RBush();
        this._items = [];

        for (const feature of features) {
            const centroid = turf.centroid(feature);
            const [lng, lat] = centroid.geometry.coordinates;
            feature._centroid = { lat, lng };

            const bbox = turf.bbox(feature);
            const item = {
                minX: bbox[0],
                minY: bbox[1],
                maxX: bbox[2],
                maxY: bbox[3],
                feature
            };
            this._items.push(item);
        }

        this._tree.load(this._items);
    },

    /**
     * Query features whose centroid falls within a circle
     * @param {Object} center - {lat, lng}
     * @param {number} radiusMeters - radius in meters
     * @returns {Array} matching features
     */
    queryCircle(center, radiusMeters) {
        if (!this._tree) return [];

        // Convert radius to approximate degree bbox
        const latDeg = radiusMeters / 111320;
        const lngDeg = radiusMeters / (111320 * Math.cos(center.lat * Math.PI / 180));

        const candidates = this._tree.search({
            minX: center.lng - lngDeg,
            minY: center.lat - latDeg,
            maxX: center.lng + lngDeg,
            maxY: center.lat + latDeg
        });

        // Filter by actual centroid distance
        const from = turf.point([center.lng, center.lat]);
        const results = [];
        for (const item of candidates) {
            const c = item.feature._centroid;
            const to = turf.point([c.lng, c.lat]);
            const dist = turf.distance(from, to, { units: 'meters' });
            if (dist <= radiusMeters) {
                results.push(item.feature);
            }
        }

        return results;
    }
};
