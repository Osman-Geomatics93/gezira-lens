/**
 * Search — search & auto-focus on canals, divisions, offices
 *
 * Fuzzy matching with dropdown showing top 5 results.
 * On select: pan map to feature centroid, create a lens with all categories.
 */
const Search = {
    _map: null,
    _allFeatures: null,
    _index: [],
    _debounceTimer: null,

    init(map, allFeatures) {
        this._map = map;
        this._allFeatures = allFeatures;
        this._buildIndex();

        const input = document.getElementById('search-input');
        const results = document.getElementById('search-results');

        input.addEventListener('input', () => {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => {
                this._search(input.value.trim(), results);
            }, 200);
        });

        input.addEventListener('focus', () => {
            if (input.value.trim().length >= 2) {
                this._search(input.value.trim(), results);
            }
        });

        // Close results on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#search-box')) {
                results.style.display = 'none';
            }
        });
    },

    _buildIndex() {
        const seen = new Set();
        for (const f of this._allFeatures) {
            const p = f.properties;
            const entries = [
                { name: p.canalName, type: 'Canal' },
                { name: p.division, type: 'Division' },
                { name: p.office, type: 'Office' }
            ];
            for (const { name, type } of entries) {
                if (!name || !name.trim()) continue;
                const key = name.toLowerCase() + '|' + type;
                if (seen.has(key)) continue;
                seen.add(key);
                this._index.push({ name, type, feature: f });
            }
        }
    },

    _search(query, resultsDiv) {
        if (!query || query.length < 2) {
            resultsDiv.style.display = 'none';
            return;
        }

        const q = query.toLowerCase();
        const matches = [];

        for (const item of this._index) {
            const score = this._fuzzyScore(q, item.name.toLowerCase());
            if (score > 0) {
                matches.push({ ...item, score });
            }
        }

        matches.sort((a, b) => b.score - a.score);
        const top5 = matches.slice(0, 5);

        if (top5.length === 0) {
            resultsDiv.innerHTML = '<div class="search-result-item search-empty">No results found</div>';
            resultsDiv.style.display = 'block';
            return;
        }

        resultsDiv.innerHTML = '';
        for (const m of top5) {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
                <strong>${this._highlight(m.name, query)}</strong>
                <span class="search-type">${m.type}</span>
                <br><span class="search-meta">${m.feature.properties.sector} Sector</span>
            `;
            div.addEventListener('click', () => {
                this._selectResult(m.feature);
                resultsDiv.style.display = 'none';
                document.getElementById('search-input').value = m.name;
            });
            resultsDiv.appendChild(div);
        }
        resultsDiv.style.display = 'block';
    },

    _fuzzyScore(needle, haystack) {
        // Exact substring match scores highest
        if (haystack.includes(needle)) return 2 + (needle.length / haystack.length);
        // Starts-with bonus
        if (haystack.startsWith(needle)) return 3;
        // Character sequence match
        let j = 0;
        for (let i = 0; i < haystack.length && j < needle.length; i++) {
            if (haystack[i] === needle[j]) j++;
        }
        return j === needle.length ? 1 : 0;
    },

    _highlight(text, query) {
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx >= 0) {
            return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
        }
        return text;
    },

    _selectResult(feature) {
        const c = feature._centroid;
        if (!c) return;

        const latlng = L.latLng(c.lat, c.lng);
        this._map.setView(latlng, 11, { animate: true });

        // Create a lens with all available (unused) categories
        const availableCats = [];
        for (let i = 0; i < CONFIG.categories.length; i++) {
            const icon = document.querySelector(`.cat-icon[data-cat="${i}"]`);
            if (icon && !icon.classList.contains('used')) {
                availableCats.push(i);
            }
        }

        if (availableCats.length > 0) {
            // Create lens with first available category
            const lens = LensManager.createLens(latlng, availableCats[0]);
            IconDrag._markUsed(availableCats[0]);

            // Add remaining categories
            for (let i = 1; i < availableCats.length; i++) {
                LensManager.mergeCategoryIntoLens(lens, availableCats[i]);
                IconDrag._markUsed(availableCats[i]);
            }
        }
    }
};
