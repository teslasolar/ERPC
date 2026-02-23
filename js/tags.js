/* ============================================================
   ISA Standards - Tag Instances & Process Simulation
   ERPC Industries | Built for Gary
   ============================================================ */

window.ISA = window.ISA || {};

// ────────────────────────────────────────────────────────────
// Tag Database
// ────────────────────────────────────────────────────────────
ISA.Tags = {
    instances: {},

    add: function(tag) {
        this.instances[tag.tagName] = tag;
        return tag;
    },

    get: function(tagName) { return this.instances[tagName]; },

    getAll: function() { return Object.values(this.instances); },

    getByType: function(type) {
        return this.getAll().filter(function(t) { return t.udtType === type; });
    },

    getByArea: function(area) {
        return this.getAll().filter(function(t) { return t.area === area; });
    },

    getAnalogTags: function() {
        return this.getAll().filter(function(t) { return t.category === 'analog'; });
    },

    getDiscreteTags: function() {
        return this.getAll().filter(function(t) { return t.category === 'discrete'; });
    }
};

// ────────────────────────────────────────────────────────────
// Equipment Hierarchy (ISA-95)
// ────────────────────────────────────────────────────────────
ISA.Hierarchy = {
    enterprise: {
        id: 'ERPC-IND', name: 'ERPC Industries', location: 'New Caney, Texas',
        sites: [{
            id: 'HOU-PLANT', name: 'Houston Process Plant', location: 'Houston, TX',
            areas: [{
                id: 'AREA-100', name: 'Batch Processing Area 100', type: 'Production',
                workCenters: [{
                    id: 'WC-110', name: 'Reactor System', type: 'Batch',
                    workUnits: [{
                        id: 'WU-111', name: 'Reactor Unit 1',
                        equipment: ['R-101', 'HX-101', 'P-101A', 'P-101B', 'M-101', 'T-101', 'T-102']
                    }]
                }, {
                    id: 'WC-120', name: 'Blending System', type: 'Batch',
                    workUnits: [{
                        id: 'WU-121', name: 'Blend Tank Unit',
                        equipment: ['T-201', 'M-201', 'P-201A']
                    }]
                }]
            }, {
                id: 'AREA-200', name: 'Utilities Area 200', type: 'Utility',
                workCenters: [{
                    id: 'WC-210', name: 'Cooling Water System', type: 'Continuous',
                    workUnits: [{
                        id: 'WU-211', name: 'Cooling Tower',
                        equipment: ['CT-301', 'P-301A', 'P-301B']
                    }]
                }]
            }]
        }]
    }
};

// ────────────────────────────────────────────────────────────
// Process Tag Instances
// ────────────────────────────────────────────────────────────

// === AREA 100: Reactor System ===

// Temperature Instruments
ISA.Tags.add({
    tagName: 'TT-101', description: 'Reactor Temperature Transmitter',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'T', succeedingLetters: 'T', loopNumber: 101,
    engUnits: 'degF', rangeLow: 0, rangeHigh: 500,
    pv: 275.3, sp: 280.0, mode: 'Auto',
    alarmHIHI: 350, alarmHI: 320, alarmLO: 180, alarmLOLO: 150,
    alarmState: 'Normal', equipment: 'R-101', location: 'Field'
});

ISA.Tags.add({
    tagName: 'TIC-101', description: 'Reactor Temperature Controller',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'T', succeedingLetters: 'IC', loopNumber: 101,
    engUnits: 'degF', rangeLow: 0, rangeHigh: 500,
    pv: 275.3, sp: 280.0, output: 62.5, mode: 'Auto',
    alarmHIHI: 350, alarmHI: 320, alarmLO: 180, alarmLOLO: 150,
    alarmState: 'Normal', equipment: 'R-101', location: 'DCS'
});

ISA.Tags.add({
    tagName: 'TT-102', description: 'HX Outlet Temperature Transmitter',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'T', succeedingLetters: 'T', loopNumber: 102,
    engUnits: 'degF', rangeLow: 0, rangeHigh: 300,
    pv: 145.8, sp: 150.0, mode: 'Auto',
    alarmHIHI: 250, alarmHI: 220, alarmLO: 80, alarmLOLO: 60,
    alarmState: 'Normal', equipment: 'HX-101', location: 'Field'
});

// Pressure Instruments
ISA.Tags.add({
    tagName: 'PT-101', description: 'Reactor Pressure Transmitter',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'P', succeedingLetters: 'T', loopNumber: 101,
    engUnits: 'PSIG', rangeLow: 0, rangeHigh: 150,
    pv: 45.2, sp: 50.0, mode: 'Auto',
    alarmHIHI: 120, alarmHI: 100, alarmLO: 10, alarmLOLO: 5,
    alarmState: 'Normal', equipment: 'R-101', location: 'Field'
});

ISA.Tags.add({
    tagName: 'PIC-101', description: 'Reactor Pressure Controller',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'P', succeedingLetters: 'IC', loopNumber: 101,
    engUnits: 'PSIG', rangeLow: 0, rangeHigh: 150,
    pv: 45.2, sp: 50.0, output: 35.0, mode: 'Auto',
    alarmHIHI: 120, alarmHI: 100, alarmLO: 10, alarmLOLO: 5,
    alarmState: 'Normal', equipment: 'R-101', location: 'DCS'
});

// Flow Instruments
ISA.Tags.add({
    tagName: 'FT-101', description: 'Feed Flow Transmitter',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'F', succeedingLetters: 'T', loopNumber: 101,
    engUnits: 'GPM', rangeLow: 0, rangeHigh: 200,
    pv: 85.4, sp: 90.0, mode: 'Auto',
    alarmHIHI: 180, alarmHI: 160, alarmLO: 20, alarmLOLO: 10,
    alarmState: 'Normal', equipment: 'P-101A', location: 'Field'
});

ISA.Tags.add({
    tagName: 'FIC-101', description: 'Feed Flow Controller',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'F', succeedingLetters: 'IC', loopNumber: 101,
    engUnits: 'GPM', rangeLow: 0, rangeHigh: 200,
    pv: 85.4, sp: 90.0, output: 48.2, mode: 'Auto',
    alarmHIHI: 180, alarmHI: 160, alarmLO: 20, alarmLOLO: 10,
    alarmState: 'Normal', equipment: 'R-101', location: 'DCS'
});

ISA.Tags.add({
    tagName: 'FT-102', description: 'Product Outlet Flow Transmitter',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'F', succeedingLetters: 'T', loopNumber: 102,
    engUnits: 'GPM', rangeLow: 0, rangeHigh: 150,
    pv: 72.1, sp: 75.0, mode: 'Auto',
    alarmHIHI: 140, alarmHI: 120, alarmLO: 15, alarmLOLO: 5,
    alarmState: 'Normal', equipment: 'R-101', location: 'Field'
});

// Level Instruments
ISA.Tags.add({
    tagName: 'LT-101', description: 'Reactor Level Transmitter',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'L', succeedingLetters: 'T', loopNumber: 101,
    engUnits: '%', rangeLow: 0, rangeHigh: 100,
    pv: 65.8, sp: 70.0, mode: 'Auto',
    alarmHIHI: 95, alarmHI: 85, alarmLO: 15, alarmLOLO: 5,
    alarmState: 'Normal', equipment: 'R-101', location: 'Field'
});

ISA.Tags.add({
    tagName: 'LIC-101', description: 'Reactor Level Controller',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'L', succeedingLetters: 'IC', loopNumber: 101,
    engUnits: '%', rangeLow: 0, rangeHigh: 100,
    pv: 65.8, sp: 70.0, output: 55.0, mode: 'Auto',
    alarmHIHI: 95, alarmHI: 85, alarmLO: 15, alarmLOLO: 5,
    alarmState: 'Normal', equipment: 'R-101', location: 'DCS'
});

ISA.Tags.add({
    tagName: 'LT-102', description: 'Feed Tank Level Transmitter',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'L', succeedingLetters: 'T', loopNumber: 102,
    engUnits: '%', rangeLow: 0, rangeHigh: 100,
    pv: 78.3, sp: 0, mode: 'Monitor',
    alarmHIHI: 95, alarmHI: 90, alarmLO: 10, alarmLOLO: 5,
    alarmState: 'Normal', equipment: 'T-101', location: 'Field'
});

ISA.Tags.add({
    tagName: 'LT-103', description: 'Product Tank Level Transmitter',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'L', succeedingLetters: 'T', loopNumber: 103,
    engUnits: '%', rangeLow: 0, rangeHigh: 100,
    pv: 42.1, sp: 0, mode: 'Monitor',
    alarmHIHI: 95, alarmHI: 90, alarmLO: 10, alarmLOLO: 5,
    alarmState: 'Normal', equipment: 'T-102', location: 'Field'
});

// Analysis Instruments
ISA.Tags.add({
    tagName: 'AT-101', description: 'Reactor pH Analyzer',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'A', succeedingLetters: 'T', loopNumber: 101,
    engUnits: 'pH', rangeLow: 0, rangeHigh: 14,
    pv: 7.2, sp: 7.0, mode: 'Auto',
    alarmHIHI: 12, alarmHI: 10, alarmLO: 4, alarmLOLO: 2,
    alarmState: 'Normal', equipment: 'R-101', location: 'Field'
});

// Discrete / Valve Tags
ISA.Tags.add({
    tagName: 'XV-101', description: 'Reactor Inlet Block Valve',
    category: 'discrete', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'X', succeedingLetters: 'V', loopNumber: 101,
    engUnits: '', state: 'Open', feedback: 'Open',
    equipment: 'R-101', location: 'Field'
});

ISA.Tags.add({
    tagName: 'XV-102', description: 'Reactor Outlet Block Valve',
    category: 'discrete', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'X', succeedingLetters: 'V', loopNumber: 102,
    engUnits: '', state: 'Open', feedback: 'Open',
    equipment: 'R-101', location: 'Field'
});

ISA.Tags.add({
    tagName: 'FCV-101', description: 'Feed Flow Control Valve',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'F', succeedingLetters: 'CV', loopNumber: 101,
    engUnits: '%', rangeLow: 0, rangeHigh: 100,
    pv: 48.2, sp: 48.2, mode: 'Cascade',
    alarmHIHI: 100, alarmHI: 95, alarmLO: 0, alarmLOLO: 0,
    alarmState: 'Normal', equipment: 'R-101', location: 'Field'
});

ISA.Tags.add({
    tagName: 'TCV-101', description: 'Temperature Control Valve (Cooling)',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'T', succeedingLetters: 'CV', loopNumber: 101,
    engUnits: '%', rangeLow: 0, rangeHigh: 100,
    pv: 62.5, sp: 62.5, mode: 'Cascade',
    alarmHIHI: 100, alarmHI: 95, alarmLO: 0, alarmLOLO: 0,
    alarmState: 'Normal', equipment: 'HX-101', location: 'Field'
});

// Motor / Pump Tags
ISA.Tags.add({
    tagName: 'P-101A', description: 'Feed Pump A',
    category: 'discrete', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'P', succeedingLetters: '', loopNumber: 101,
    engUnits: '', state: 'Running', feedback: 'Running',
    amps: 12.5, equipment: 'P-101A', location: 'Field'
});

ISA.Tags.add({
    tagName: 'P-101B', description: 'Feed Pump B (Standby)',
    category: 'discrete', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'P', succeedingLetters: '', loopNumber: 101,
    engUnits: '', state: 'Stopped', feedback: 'Stopped',
    amps: 0, equipment: 'P-101B', location: 'Field'
});

ISA.Tags.add({
    tagName: 'M-101', description: 'Reactor Agitator Motor',
    category: 'discrete', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'M', succeedingLetters: '', loopNumber: 101,
    engUnits: 'RPM', state: 'Running', feedback: 'Running',
    speed: 120, amps: 8.3, equipment: 'M-101', location: 'Field'
});

// Speed
ISA.Tags.add({
    tagName: 'ST-101', description: 'Agitator Speed Transmitter',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'S', succeedingLetters: 'T', loopNumber: 101,
    engUnits: 'RPM', rangeLow: 0, rangeHigh: 300,
    pv: 120, sp: 120, mode: 'Auto',
    alarmHIHI: 280, alarmHI: 250, alarmLO: 30, alarmLOLO: 10,
    alarmState: 'Normal', equipment: 'M-101', location: 'Field'
});

// === AREA 100: Blending System ===

ISA.Tags.add({
    tagName: 'LT-201', description: 'Blend Tank Level Transmitter',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'L', succeedingLetters: 'T', loopNumber: 201,
    engUnits: '%', rangeLow: 0, rangeHigh: 100,
    pv: 55.2, sp: 60.0, mode: 'Auto',
    alarmHIHI: 95, alarmHI: 85, alarmLO: 15, alarmLOLO: 5,
    alarmState: 'Normal', equipment: 'T-201', location: 'Field'
});

ISA.Tags.add({
    tagName: 'TT-201', description: 'Blend Tank Temperature Transmitter',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'T', succeedingLetters: 'T', loopNumber: 201,
    engUnits: 'degF', rangeLow: 0, rangeHigh: 300,
    pv: 165.0, sp: 170.0, mode: 'Auto',
    alarmHIHI: 250, alarmHI: 220, alarmLO: 80, alarmLOLO: 60,
    alarmState: 'Normal', equipment: 'T-201', location: 'Field'
});

ISA.Tags.add({
    tagName: 'M-201', description: 'Blend Tank Agitator',
    category: 'discrete', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-100',
    firstLetter: 'M', succeedingLetters: '', loopNumber: 201,
    engUnits: 'RPM', state: 'Running', feedback: 'Running',
    speed: 80, amps: 5.2, equipment: 'M-201', location: 'Field'
});

// === AREA 200: Cooling Water ===

ISA.Tags.add({
    tagName: 'TT-301', description: 'CW Supply Temperature',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-200',
    firstLetter: 'T', succeedingLetters: 'T', loopNumber: 301,
    engUnits: 'degF', rangeLow: 0, rangeHigh: 200,
    pv: 82.5, sp: 85.0, mode: 'Auto',
    alarmHIHI: 120, alarmHI: 105, alarmLO: 50, alarmLOLO: 40,
    alarmState: 'Normal', equipment: 'CT-301', location: 'Field'
});

ISA.Tags.add({
    tagName: 'TT-302', description: 'CW Return Temperature',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-200',
    firstLetter: 'T', succeedingLetters: 'T', loopNumber: 302,
    engUnits: 'degF', rangeLow: 0, rangeHigh: 200,
    pv: 95.1, sp: 0, mode: 'Monitor',
    alarmHIHI: 140, alarmHI: 120, alarmLO: 50, alarmLOLO: 40,
    alarmState: 'Normal', equipment: 'CT-301', location: 'Field'
});

ISA.Tags.add({
    tagName: 'FT-301', description: 'CW Flow Transmitter',
    category: 'analog', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-200',
    firstLetter: 'F', succeedingLetters: 'T', loopNumber: 301,
    engUnits: 'GPM', rangeLow: 0, rangeHigh: 500,
    pv: 320.5, sp: 350.0, mode: 'Auto',
    alarmHIHI: 480, alarmHI: 450, alarmLO: 100, alarmLOLO: 50,
    alarmState: 'Normal', equipment: 'CT-301', location: 'Field'
});

ISA.Tags.add({
    tagName: 'P-301A', description: 'CW Pump A',
    category: 'discrete', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-200',
    firstLetter: 'P', succeedingLetters: '', loopNumber: 301,
    engUnits: '', state: 'Running', feedback: 'Running',
    amps: 25.3, equipment: 'P-301A', location: 'Field'
});

ISA.Tags.add({
    tagName: 'P-301B', description: 'CW Pump B (Standby)',
    category: 'discrete', udtType: 'ISA5_1_InstrumentTag', area: 'AREA-200',
    firstLetter: 'P', succeedingLetters: '', loopNumber: 301,
    engUnits: '', state: 'Stopped', feedback: 'Stopped',
    amps: 0, equipment: 'P-301B', location: 'Field'
});

// ────────────────────────────────────────────────────────────
// Alarm Definitions (ISA-18.2)
// ────────────────────────────────────────────────────────────
ISA.Alarms = {
    definitions: [],
    activeAlarms: [],

    init: function() {
        var tags = ISA.Tags.getAnalogTags();
        var self = this;
        tags.forEach(function(tag) {
            if (tag.alarmHIHI !== undefined) {
                self.definitions.push({
                    alarmID: tag.tagName + '_HIHI', tagName: tag.tagName,
                    description: tag.description + ' High-High',
                    type: 'HIHI', priority: 'High', setpoint: tag.alarmHIHI,
                    deadband: (tag.rangeHigh - tag.rangeLow) * 0.01,
                    consequence: 'Process upset, potential equipment damage',
                    correctiveAction: 'Reduce input, check controls, verify instruments',
                    enabled: true, responseTime: 5
                });
                self.definitions.push({
                    alarmID: tag.tagName + '_HI', tagName: tag.tagName,
                    description: tag.description + ' High',
                    type: 'HI', priority: 'Medium', setpoint: tag.alarmHI,
                    deadband: (tag.rangeHigh - tag.rangeLow) * 0.01,
                    consequence: 'Approaching process limits',
                    correctiveAction: 'Monitor trend, prepare for corrective action',
                    enabled: true, responseTime: 15
                });
                self.definitions.push({
                    alarmID: tag.tagName + '_LO', tagName: tag.tagName,
                    description: tag.description + ' Low',
                    type: 'LO', priority: 'Medium', setpoint: tag.alarmLO,
                    deadband: (tag.rangeHigh - tag.rangeLow) * 0.01,
                    consequence: 'Below normal operating range',
                    correctiveAction: 'Check supply, verify instruments',
                    enabled: true, responseTime: 15
                });
                self.definitions.push({
                    alarmID: tag.tagName + '_LOLO', tagName: tag.tagName,
                    description: tag.description + ' Low-Low',
                    type: 'LOLO', priority: 'High', setpoint: tag.alarmLOLO,
                    deadband: (tag.rangeHigh - tag.rangeLow) * 0.01,
                    consequence: 'Critical low condition, potential equipment damage',
                    correctiveAction: 'Emergency response, check for loss of supply',
                    enabled: true, responseTime: 5
                });
            }
        });
    }
};

// ────────────────────────────────────────────────────────────
// Batch Records (ISA-88)
// ────────────────────────────────────────────────────────────
ISA.Batches = {
    recipes: [
        {
            recipeID: 'RCP-001', recipeName: 'ERPC Polymer Blend A',
            recipeType: 'Master', version: '2.1', productID: 'PROD-001',
            description: 'Standard polymer blending recipe for Product A',
            status: 'Approved', approvedBy: 'G. Floyd', approvedDate: '2025-06-15',
            formula: [
                { material: 'Base Polymer', quantity: 500, uom: 'kg', lotReq: true },
                { material: 'Catalyst X-42', quantity: 2.5, uom: 'kg', lotReq: true },
                { material: 'Solvent S-10', quantity: 100, uom: 'L', lotReq: false },
                { material: 'Additive A-7', quantity: 12, uom: 'kg', lotReq: false }
            ],
            procedure: [
                { step: 1, phase: 'Charge', description: 'Charge base polymer to reactor R-101', duration: 15 },
                { step: 2, phase: 'Heat', description: 'Heat reactor to 280F at 5F/min ramp', duration: 30 },
                { step: 3, phase: 'Add Catalyst', description: 'Add catalyst X-42 with agitation at 120 RPM', duration: 5 },
                { step: 4, phase: 'React', description: 'Hold at 280F for reaction period', duration: 60 },
                { step: 5, phase: 'Cool', description: 'Cool to 150F via HX-101', duration: 25 },
                { step: 6, phase: 'Transfer', description: 'Transfer product to T-102', duration: 10 },
                { step: 7, phase: 'CIP', description: 'Clean-in-place cycle', duration: 20 }
            ]
        },
        {
            recipeID: 'RCP-002', recipeName: 'Entropy-Regulated Compound B',
            recipeType: 'Master', version: '1.3', productID: 'PROD-002',
            description: 'Advanced compound using entropy-regulated mixing profile',
            status: 'Approved', approvedBy: 'G. Floyd', approvedDate: '2025-08-20',
            formula: [
                { material: 'Base Resin', quantity: 300, uom: 'kg', lotReq: true },
                { material: 'Modifier M-15', quantity: 45, uom: 'kg', lotReq: true },
                { material: 'Stabilizer ST-3', quantity: 8, uom: 'kg', lotReq: false }
            ],
            procedure: [
                { step: 1, phase: 'Charge', description: 'Charge base resin to blend tank T-201', duration: 10 },
                { step: 2, phase: 'Pre-Heat', description: 'Heat to 170F', duration: 20 },
                { step: 3, phase: 'Blend', description: 'Add modifier with ERPC-controlled agitation', duration: 45 },
                { step: 4, phase: 'Stabilize', description: 'Add stabilizer, hold for 15 min', duration: 15 },
                { step: 5, phase: 'Discharge', description: 'Transfer to product storage', duration: 10 }
            ]
        }
    ],
    active: [
        {
            batchID: 'B-2025-0847', recipeID: 'RCP-001', productID: 'PROD-001',
            state: 'Running', unitID: 'R-101',
            startTime: new Date(Date.now() - 3600000).toISOString(),
            currentPhase: 'React', phaseStep: 4,
            batchSize: 614.5, actualSize: 0, qualityStatus: 'Pending'
        }
    ]
};

// ────────────────────────────────────────────────────────────
// Material Lots (ISA-95)
// ────────────────────────────────────────────────────────────
ISA.Materials = {
    definitions: [
        { id: 'MAT-BP01', name: 'Base Polymer', class: 'Raw Material', uom: 'kg', hazard: 'None', shelfLife: 365 },
        { id: 'MAT-CX42', name: 'Catalyst X-42', class: 'Catalyst', uom: 'kg', hazard: 'Flammable', shelfLife: 180 },
        { id: 'MAT-SS10', name: 'Solvent S-10', class: 'Solvent', uom: 'L', hazard: 'Flammable', shelfLife: 730 },
        { id: 'MAT-AA07', name: 'Additive A-7', class: 'Additive', uom: 'kg', hazard: 'None', shelfLife: 545 },
        { id: 'MAT-BR01', name: 'Base Resin', class: 'Raw Material', uom: 'kg', hazard: 'None', shelfLife: 365 },
        { id: 'MAT-MM15', name: 'Modifier M-15', class: 'Modifier', uom: 'kg', hazard: 'Irritant', shelfLife: 270 },
        { id: 'MAT-ST03', name: 'Stabilizer ST-3', class: 'Additive', uom: 'kg', hazard: 'None', shelfLife: 545 }
    ],
    lots: [
        { lotID: 'LOT-2025-1201', materialID: 'MAT-BP01', quantity: 2500, quality: 'Released', location: 'WH-A', mfgDate: '2025-01-15', supplier: 'PolyChem Inc.' },
        { lotID: 'LOT-2025-1202', materialID: 'MAT-CX42', quantity: 50, quality: 'Released', location: 'WH-B', mfgDate: '2025-02-01', supplier: 'CatalystCo' },
        { lotID: 'LOT-2025-1203', materialID: 'MAT-SS10', quantity: 800, quality: 'Released', location: 'TANK-F1', mfgDate: '2025-01-20', supplier: 'SolvTech' },
        { lotID: 'LOT-2025-1204', materialID: 'MAT-AA07', quantity: 200, quality: 'Quarantine', location: 'WH-A', mfgDate: '2025-03-01', supplier: 'AddChem' },
        { lotID: 'LOT-2025-1205', materialID: 'MAT-BR01', quantity: 1800, quality: 'Released', location: 'WH-A', mfgDate: '2025-02-10', supplier: 'ResinWorks' },
        { lotID: 'LOT-2025-1206', materialID: 'MAT-MM15', quantity: 300, quality: 'Released', location: 'WH-B', mfgDate: '2025-02-15', supplier: 'ModChem' }
    ]
};

// ────────────────────────────────────────────────────────────
// Simulation Engine
// ────────────────────────────────────────────────────────────
ISA.Simulation = {
    running: false,
    interval: null,
    scanRate: 1000,
    callbacks: [],

    start: function() {
        if (this.running) return;
        this.running = true;
        var self = this;
        this.interval = setInterval(function() { self.tick(); }, this.scanRate);
        console.log('[SIM] Simulation started at', this.scanRate, 'ms scan rate');
    },

    stop: function() {
        this.running = false;
        if (this.interval) clearInterval(this.interval);
        console.log('[SIM] Simulation stopped');
    },

    onTick: function(cb) { this.callbacks.push(cb); },

    tick: function() {
        // Simulate analog tag value changes
        var analogTags = ISA.Tags.getAnalogTags();
        analogTags.forEach(function(tag) {
            if (tag.mode === 'Monitor' || !tag.sp) {
                // Random walk for monitoring-only tags
                tag.pv += (Math.random() - 0.5) * (tag.rangeHigh - tag.rangeLow) * 0.005;
            } else {
                // Simulate PID-like behavior toward setpoint
                var error = tag.sp - tag.pv;
                var noise = (Math.random() - 0.5) * (tag.rangeHigh - tag.rangeLow) * 0.008;
                tag.pv += error * 0.05 + noise;
            }
            // Clamp to range
            tag.pv = Math.max(tag.rangeLow, Math.min(tag.rangeHigh, tag.pv));
            tag.pv = Math.round(tag.pv * 10) / 10;

            // Check alarms
            if (tag.alarmHIHI !== undefined) {
                if (tag.pv >= tag.alarmHIHI) tag.alarmState = 'HIHI';
                else if (tag.pv >= tag.alarmHI) tag.alarmState = 'HI';
                else if (tag.pv <= tag.alarmLOLO) tag.alarmState = 'LOLO';
                else if (tag.pv <= tag.alarmLO) tag.alarmState = 'LO';
                else tag.alarmState = 'Normal';
            }
        });

        // Simulate discrete tag states
        var discreteTags = ISA.Tags.getDiscreteTags();
        discreteTags.forEach(function(tag) {
            if (tag.state === 'Running' && tag.amps !== undefined) {
                tag.amps += (Math.random() - 0.5) * 0.5;
                tag.amps = Math.max(0, Math.round(tag.amps * 10) / 10);
            }
            if (tag.speed !== undefined && tag.state === 'Running') {
                tag.speed += (Math.random() - 0.5) * 2;
                tag.speed = Math.max(0, Math.round(tag.speed));
            }
        });

        // Update active alarms list
        ISA.Alarms.activeAlarms = [];
        analogTags.forEach(function(tag) {
            if (tag.alarmState && tag.alarmState !== 'Normal') {
                ISA.Alarms.activeAlarms.push({
                    tagName: tag.tagName,
                    description: tag.description,
                    state: tag.alarmState,
                    priority: (tag.alarmState === 'HIHI' || tag.alarmState === 'LOLO') ? 'High' : 'Medium',
                    value: tag.pv,
                    engUnits: tag.engUnits,
                    time: new Date().toLocaleTimeString()
                });
            }
        });

        // Notify callbacks
        this.callbacks.forEach(function(cb) { cb(); });
    }
};

// Initialize alarm definitions
ISA.Alarms.init();

console.log('[ISA] Tags loaded:', Object.keys(ISA.Tags.instances).length, 'tags');
console.log('[ISA] Alarms configured:', ISA.Alarms.definitions.length, 'alarm points');
