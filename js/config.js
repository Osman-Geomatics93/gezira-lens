/**
 * Configuration — Gezira Irrigation Scheme Problem Reports
 */
const CONFIG = {
    map: {
        center: [14.45, 33.04],
        zoom: 9,
        minZoom: 7,
        maxZoom: 15
    },

    sectors: {
        East:  { color: '#4393C3', label: 'East Sector' },
        North: { color: '#66C2A5', label: 'North Sector' },
        South: { color: '#FC8D62', label: 'South Sector' },
        West:  { color: '#E78AC3', label: 'West Sector' }
    },

    categories: [
        { key: 'waterShortage',   label: 'Water Shortage',   color: '#C67A2E', type: 'absolute' },
        { key: 'siltation',       label: 'Siltation',        color: '#9B2D8B', type: 'absolute' },
        { key: 'waterlogging',    label: 'Waterlogging',     color: '#C0392B', type: 'absolute' },
        { key: 'canalDamage',     label: 'Canal Damage',     color: '#27AE60', type: 'absolute' },
        { key: 'landDegradation', label: 'Land Degradation', color: '#7F8C8D', type: 'absolute' }
    ],

    years: [2021, 2022, 2023, 2024],

    lens: {
        defaultRadius: 15000,
        minRadius: 5000,
        maxRadius: 50000,
        strokeColor: '#333333',
        strokeWeight: 2,
        fillOpacity: 0.04,
        chartSize: 280,       // compact — fits nicely on map
        innerRadius: 40,      // px — the circle in the center
        debounceMs: 50
    },

    canals: {
        mainColor: '#2171B5',
        mainWeight: 2.5,
        minorColor: '#6BAED6',
        minorWeight: 1
    },

    heatmap: {
        radius: 25,
        blur: 15,
        maxZoom: 12,
        gradient: { 0.2: 'blue', 0.4: 'cyan', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }
    },

    dataPaths: {
        sectors: {
            East:  'data/sectors/East.geojson',
            North: 'data/sectors/North.geojson',
            South: 'data/sectors/South.geojson',
            West:  'data/sectors/West.geojson'
        },
        canals: {
            lines:  'data/canals/canals_line.geojson',
            labels: 'data/canals/canals_labels.geojson'
        }
    }
};
