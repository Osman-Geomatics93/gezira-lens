<div align="center">

# Gezira Lens

**Interactive Geospatial Dashboard for Problem Reporting in Sudan's Gezira Irrigation Scheme**

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-2ea44f?style=for-the-badge&logo=github)](https://osman-geomatics93.github.io/gezira-lens/)
[![JavaScript](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![D3.js](https://img.shields.io/badge/D3.js-F9A03C?style=for-the-badge&logo=d3.js&logoColor=white)](https://d3js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br>

*Drag problem icons onto the map. Watch radial charts appear. Combine categories. Compare areas. Animate through years. This is spatial analysis made intuitive.*

<br>

<img src="https://img.shields.io/badge/1,564-Command_Areas-4393C3?style=flat-square" alt="1564 Areas">
<img src="https://img.shields.io/badge/1,727-Canal_Segments-2171B5?style=flat-square" alt="1727 Canals">
<img src="https://img.shields.io/badge/4-Sectors-66C2A5?style=flat-square" alt="4 Sectors">
<img src="https://img.shields.io/badge/5-Problem_Categories-C67A2E?style=flat-square" alt="5 Categories">
<img src="https://img.shields.io/badge/4-Years_(2021--2024)-333333?style=flat-square" alt="4 Years">

</div>

---

## The Problem

The **Gezira Irrigation Scheme** is one of the largest irrigation systems in the world, covering thousands of square kilometers across central Sudan. Managing infrastructure problems across this vast area — water shortages, siltation, canal damage, waterlogging, and land degradation — requires understanding **where** problems are worst, **when** they're getting worse, and **how** different areas compare.

Spreadsheets and static reports can't capture these spatial-temporal patterns. **Gezira Lens** turns 4 years of incident data into an explorable, interactive experience.

---

## Features

### Core: The Lens System

Drag a problem category icon from the toolbar onto the map. A **circular lens** appears at that location with a **radial D3 chart** showing incident counts for all command areas within the lens radius.

- **Combine** — Drag multiple icons onto the same lens to overlay categories
- **Separate** — Click a category badge to remove just that category
- **Drag** — Reposition any lens by dragging its center
- **Resize** — Adjust focus radius from 5 km to 50 km with the slider

### 7 Visualization Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Radial Charts** | D3-powered polar bar charts inside each lens showing incidents per year with progressive opacity |
| 2 | **Time Player** | Cinematic bottom bar with Play/Pause — auto-advances through 2021-2024 every 1.5s, all visualizations sync |
| 3 | **Heatmap Layer** | Leaflet.heat overlay showing problem density across 1,564 centroids with blue-to-red gradient |
| 4 | **Comparison Panel** | Auto-slides in when 2 lenses exist — per-category bars, % difference arrows, "which area is worse?" summary |
| 5 | **Sparkline Trends** | Tiny 4-point SVG trend lines embedded in each category icon showing global trajectory |
| 6 | **Hover Tooltips** | Hover any bar for exact count, year, and year-over-year % change with color-coded trend arrows |
| 7 | **Search & Focus** | Fuzzy search across canal names, divisions, and offices — select a result to auto-pan and create a full lens |
| 8 | **PNG Export** | One-click screenshot capture with watermark via html2canvas |

---

## Data

### Geographic Coverage — 4 Sectors

| Sector | Command Areas | Known For |
|--------|:---:|-----------|
| **East** | 304 | Worst water shortage (tail-end of canal system) |
| **North** | 522 | Worst siltation (oldest canal infrastructure) |
| **South** | 358 | Worst waterlogging & land degradation (poor drainage, salinity) |
| **West** | 380 | Worst canal damage (maintenance gaps) |

### Problem Categories

| Category | Color | Trend (2021-2024) |
|----------|:-----:|:-----------------:|
| Water Shortage | `#C67A2E` | Worsening (+40%) |
| Siltation | `#9B2D8B` | Slowly increasing (+8%) |
| Waterlogging | `#C0392B` | Seasonal variation |
| Canal Damage | `#27AE60` | Infrastructure decay (+30%) |
| Land Degradation | `#7F8C8D` | Gradual increase (+20%) |

### Canal Network

- **1,727** canal line segments (main canals solid, minor canals dashed)
- **1,836** canal label points

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Leaflet.js](https://leafletjs.com/) `1.9.4` | Interactive map rendering with canvas |
| [D3.js](https://d3js.org/) `7` | Radial bar chart visualization |
| [Turf.js](https://turfjs.org/) `6` | Geospatial distance & centroid calculations |
| [rbush](https://github.com/mourner/rbush) `3` | R-tree spatial indexing for O(log n) range queries |
| [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat) `0.2.0` | Heatmap density overlay |
| [html2canvas](https://html2canvas.hertzen.com/) `1.4.1` | Viewport screenshot capture |
| [CARTO](https://carto.com/) | Light basemap tiles |

**No frameworks. No build tools. No npm.** Pure vanilla JavaScript — open `index.html` and it runs.

---

## Architecture

```
gezira-lens/
├── index.html                 ← Single-page entry point
├── css/
│   └── styles.css             ← All styles (no preprocessor)
├── js/
│   ├── config.js              ← Sectors, categories, colors, thresholds
│   ├── data-loader.js         ← Parallel GeoJSON fetching
│   ├── data-normalizer.js     ← Unifies inconsistent property names
│   ├── simulated-data.js      ← Seeded PRNG incident generation
│   ├── spatial-index.js       ← rbush R-tree + circle queries
│   ├── lens.js                ← Core lens lifecycle & radial charts
│   ├── map-layers.js          ← Sector polygons & canal rendering
│   ├── ui-controls.js         ← Icon drag-and-drop & radius slider
│   ├── sparklines.js          ← SVG trend lines in category icons
│   ├── time-player.js         ← Year animation controller
│   ├── heatmap.js             ← Heat overlay toggle & updates
│   ├── search.js              ← Fuzzy search with auto-complete
│   ├── comparison.js          ← Side-by-side 2-lens panel
│   ├── export.js              ← PNG screenshot with watermark
│   └── app.js                 ← Initialization & orchestration
└── data/
    ├── sectors/               ← 4 GeoJSON FeatureCollections
    │   ├── East.geojson
    │   ├── North.geojson
    │   ├── South.geojson
    │   └── West.geojson
    └── canals/
        ├── canals_line.geojson
        └── canals_labels.geojson
```

### Data Flow

```
GeoJSON Files
     │
     ▼
 DataLoader ──→ DataNormalizer ──→ SimulatedData
                                       │
                                       ▼
                                  SpatialIndex (rbush)
                                       │
                      ┌────────────────┼────────────────┐
                      ▼                ▼                ▼
                 LensManager      HeatmapLayer       Search
                      │
           ┌──────────┼──────────┐
           ▼          ▼          ▼
       D3 Charts  TimePlayer  ComparisonPanel
```

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Osman-Geomatics93/gezira-lens.git

# Open in browser (no build step needed)
cd gezira-lens
# Use any local server:
python -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080` and start dragging icons onto the map.

---

## Usage Guide

| Action | How |
|--------|-----|
| **Create a lens** | Drag any category icon from the top bar onto the map |
| **Combine categories** | Drag another icon onto an existing lens |
| **Remove a category** | Click the colored badge (x) on the lens |
| **Remove entire lens** | Click the lens center |
| **Resize all lenses** | Use the Focus Radius slider (5-50 km) or press `+` / `-` |
| **Animate years** | Click the Play button on the bottom timeline bar |
| **Jump to a year** | Click any year dot (2021 · 2022 · 2023 · 2024) |
| **Toggle heatmap** | Click the flame icon (top-right) |
| **Search** | Type in the search box (top-right) — select a result to auto-focus |
| **Compare areas** | Create exactly 2 lenses — comparison panel appears automatically |
| **Export** | Click the camera icon (left side) to download a PNG screenshot |

---

## Technical Highlights

- **Spatial Indexing** — rbush R-tree enables sub-100ms circular range queries across 1,564 features
- **Seeded PRNG** — Mulberry32 algorithm ensures reproducible incident data across sessions
- **Global State Sync** — Changing the year on the time player simultaneously updates all lenses, heatmap, and comparison panel
- **Canvas Rendering** — Leaflet uses `preferCanvas: true` for smooth performance with 1,500+ polygons
- **Modular Design** — 16 JavaScript files with zero dependencies between feature modules

---

## Author

**Osman** — [@Osman-Geomatics93](https://github.com/Osman-Geomatics93)

Geomatics Engineer | GIS & Remote Sensing | Data Visualization

---

<div align="center">

Built with vanilla JavaScript — no frameworks, no build tools, just clean code.

</div>
