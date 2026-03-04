/**
 * Data Normalizer - Unify property names across 4 sectors
 */
const DataNormalizer = {
    // South sector division name cleanup mapping
    _southDivisionMap: {
        'Albsatna':      'Al Basatna',
        'albsatna':      'Al Basatna',
        'Al_Basatna':    'Al Basatna',
        'Al Basatna':    'Al Basatna',
        'Almaselmia':    'Al Masalmiya',
        'almaselmia':    'Al Masalmiya',
        'Al_Masalmiya':  'Al Masalmiya',
        'Al Masalmiya':  'Al Masalmiya',
        'Alhosh':        'Al Hosh',
        'alhosh':        'Al Hosh',
        'Al_Hosh':       'Al Hosh',
        'Al Hosh':       'Al Hosh',
        'Alhadag':       'Al Hadag',
        'alhadag':       'Al Hadag',
        'Al_Hadag':      'Al Hadag',
        'Al Hadag':      'Al Hadag',
        'Alazazi':       'Al Azazi',
        'alazazi':       'Al Azazi',
        'Al_Azazi':      'Al Azazi',
        'Al Azazi':      'Al Azazi'
    },

    SQMETERS_PER_FEDDAN: 4200.833,

    normalizeAll(sectors) {
        const allFeatures = [];
        for (const [sectorName, geojson] of Object.entries(sectors)) {
            for (const feature of geojson.features) {
                this._normalizeFeature(feature, sectorName);
                allFeatures.push(feature);
            }
        }
        return allFeatures;
    },

    _normalizeFeature(feature, sector) {
        const p = feature.properties;
        const n = {};

        n.sector = sector;
        n.objectId = p.OBJECTID_1 || p.OBJECTID || p.OID_ || 0;
        n.id = p.Id || p.id || n.objectId;
        n.canalName = p.Canal_Name || '';
        n.office = p.Office || '';
        n.noNemra = p.No_Nemra || 0;
        n.nameArabic = p.Name_AR || p.Arab_Name || '';
        n.remarks = p.Remarks || p.Remarks_1 || '';
        n.shapeLeng = p.Shape_Leng || p.Shape_Le_1 || 0;
        n.shapeArea = p.Shape_Area || 0;

        // Division: clean up South sector inconsistencies
        let division = p.Division || '';
        if (sector === 'South' && this._southDivisionMap[division]) {
            division = this._southDivisionMap[division];
        }
        n.division = division;

        // Area in feddan: different field names per sector
        if (p.Area_Fedda && p.Area_Fedda > 0) {
            n.areaFeddan = p.Area_Fedda;
        } else if (p.Design_A_F && p.Design_A_F > 0) {
            n.areaFeddan = p.Design_A_F;
        } else if (p.Area_Desig && p.Area_Desig > 0) {
            n.areaFeddan = p.Area_Desig;
        } else {
            // Fallback: compute from Shape_Area (sq meters → feddan)
            n.areaFeddan = n.shapeArea > 0
                ? Math.round((n.shapeArea / this.SQMETERS_PER_FEDDAN) * 100) / 100
                : 0;
        }

        feature.properties = n;
    }
};
