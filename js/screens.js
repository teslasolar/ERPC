/* ============================================================
   ISA Standards - Screen Renderers
   ERPC Industries | Built for Gary
   ============================================================ */

window.ISA = window.ISA || {};
ISA.Screens = {};

// ────────────────────────────────────────────────────────────
// Helper: escape HTML
// ────────────────────────────────────────────────────────────
function h(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function alarmColor(state) {
    var m = { 'HIHI':'var(--alarm-high)', 'HI':'var(--alarm-medium)', 'LO':'var(--alarm-medium)', 'LOLO':'var(--alarm-high)', 'Normal':'var(--color-running)' };
    return m[state] || 'var(--text-muted)';
}

function priorityClass(p) {
    return (p || '').toLowerCase();
}

function percent(val, lo, hi) {
    if (hi === lo) return 50;
    return Math.max(0, Math.min(100, ((val - lo) / (hi - lo)) * 100));
}

// ────────────────────────────────────────────────────────────
// DASHBOARD
// ────────────────────────────────────────────────────────────
ISA.Screens.dashboard = function() {
    var tags = ISA.Tags.getAll();
    var analogCount = ISA.Tags.getAnalogTags().length;
    var discreteCount = ISA.Tags.getDiscreteTags().length;
    var alarmCount = ISA.Alarms.activeAlarms.length;
    var udtCount = Object.keys(ISA.UDT.definitions).length;

    var html = '';
    html += '<div class="screen-title">Dashboard <span class="std-badge">OVERVIEW</span></div>';
    html += '<div class="screen-subtitle">ISA Standards Explorer - ERPC Industries Process Plant</div>';

    // Stats row
    html += '<div class="card-grid cols-5">';
    html += '<div class="card stat-card"><div class="stat-value">5</div><div class="stat-label">ISA Standards</div><div class="stat-sub">95 / 88 / 101 / 18.2 / 5.1</div></div>';
    html += '<div class="card stat-card"><div class="stat-value">' + udtCount + '</div><div class="stat-label">UDT Definitions</div><div class="stat-sub">Across all standards</div></div>';
    html += '<div class="card stat-card"><div class="stat-value">' + tags.length + '</div><div class="stat-label">Total Tags</div><div class="stat-sub">' + analogCount + ' analog / ' + discreteCount + ' discrete</div></div>';
    html += '<div class="card stat-card"><div class="stat-value">' + ISA.Alarms.definitions.length + '</div><div class="stat-label">Alarm Points</div><div class="stat-sub">' + alarmCount + ' currently active</div></div>';
    html += '<div class="card stat-card"><div class="stat-value">' + ISA.Batches.recipes.length + '</div><div class="stat-label">Recipes</div><div class="stat-sub">' + ISA.Batches.active.length + ' batch active</div></div>';
    html += '</div>';

    // Standards cards
    html += '<div class="section"><div class="section-title">ISA Standards Reference</div>';
    html += '<div class="card-grid cols-3">';

    var standards = [
        { id: 'isa95', name: 'ISA-95', title: 'Enterprise-Control Integration', desc: 'Defines the interface between enterprise (business) systems and control systems. Establishes equipment hierarchy (Enterprise > Site > Area > Line > Cell) and data models for operations, materials, and personnel.', count: ISA.UDT.getByStandard('ISA-95').length },
        { id: 'isa88', name: 'ISA-88', title: 'Batch Control', desc: 'Standardizes batch process control with physical model (ProcessCell > Unit > EquipmentModule > ControlModule), procedural model (Procedure > UnitProcedure > Operation > Phase), and recipe management.', count: ISA.UDT.getByStandard('ISA-88').length },
        { id: 'isa101', name: 'ISA-101', title: 'Human Machine Interfaces', desc: 'Defines HMI design standards including 4-level display hierarchy, standardized color palettes, faceplate designs, alarm presentation, and navigation patterns for operator effectiveness.', count: ISA.UDT.getByStandard('ISA-101').length },
        { id: 'isa182', name: 'ISA-18.2', title: 'Alarm Management', desc: 'Lifecycle management of alarms from identification through rationalization, design, implementation, operation, monitoring, and change management. Defines alarm states and priorities.', count: ISA.UDT.getByStandard('ISA-18.2').length },
        { id: 'isa51', name: 'ISA-5.1', title: 'Instrumentation Symbols & ID', desc: 'Standardizes instrument tag identification (first letter = measured variable, succeeding letters = functions) and P&ID symbol representation for process documentation.', count: ISA.UDT.getByStandard('ISA-5.1').length }
    ];

    standards.forEach(function(s) {
        html += '<div class="card clickable" onclick="ISA.App.navigate(\'' + s.id + '\')">';
        html += '<div class="card-header"><div class="card-title">' + h(s.title) + '</div><span class="card-badge" style="background:var(--color-accent);color:var(--bg-primary)">' + h(s.name) + '</span></div>';
        html += '<div class="card-body">' + h(s.desc) + '</div>';
        html += '<div style="margin-top:10px;font-size:11px;color:var(--text-muted)">' + s.count + ' UDT definitions</div>';
        html += '</div>';
    });
    html += '</div></div>';

    // Active batch
    html += '<div class="section"><div class="section-title">Active Batch <span class="section-badge">ISA-88</span></div>';
    if (ISA.Batches.active.length > 0) {
        var batch = ISA.Batches.active[0];
        var recipe = ISA.Batches.recipes.find(function(r) { return r.recipeID === batch.recipeID; });
        html += '<div class="card">';
        html += '<div class="card-header"><div class="card-title">' + h(batch.batchID) + ' - ' + h(recipe ? recipe.recipeName : '') + '</div>';
        html += '<span class="card-badge" style="background:var(--color-running);color:white">' + h(batch.state) + '</span></div>';
        html += '<div class="card-body">';
        html += '<div style="display:flex;gap:30px;flex-wrap:wrap">';
        html += '<div><span style="color:var(--text-muted)">Recipe:</span> ' + h(batch.recipeID) + '</div>';
        html += '<div><span style="color:var(--text-muted)">Unit:</span> ' + h(batch.unitID) + '</div>';
        html += '<div><span style="color:var(--text-muted)">Phase:</span> ' + h(batch.currentPhase) + ' (Step ' + batch.phaseStep + ')</div>';
        html += '<div><span style="color:var(--text-muted)">Batch Size:</span> ' + batch.batchSize + ' kg</div>';
        html += '</div>';
        if (recipe) {
            html += '<div style="margin-top:12px">';
            recipe.procedure.forEach(function(step) {
                var isActive = step.step === batch.phaseStep;
                var isDone = step.step < batch.phaseStep;
                html += '<div class="recipe-step' + (isActive ? ' active' : '') + '">';
                html += '<div class="recipe-step-num" style="' + (isDone ? 'background:var(--color-running);color:white' : '') + '">' + (isDone ? '&#10003;' : step.step) + '</div>';
                html += '<div style="color:' + (isActive ? 'var(--color-accent)' : isDone ? 'var(--text-muted)' : 'var(--text-secondary)') + '">' + h(step.phase) + ' - ' + h(step.description) + '</div>';
                html += '</div>';
            });
            html += '</div>';
        }
        html += '</div></div>';
    }
    html += '</div>';

    // Live tags
    html += '<div class="section"><div class="section-title">Live Process Tags <span class="section-badge">' + analogCount + ' analog / ' + discreteCount + ' discrete</span></div>';
    html += renderFaceplateGrid(ISA.Tags.getAnalogTags().slice(0, 8));
    html += '</div>';

    return html;
};

// ────────────────────────────────────────────────────────────
// ISA-95 Screen
// ────────────────────────────────────────────────────────────
ISA.Screens.isa95 = function() {
    var html = '';
    html += '<div class="screen-title">ISA-95: Enterprise-Control System Integration <span class="std-badge">ISA-95</span></div>';
    html += '<div class="screen-subtitle">Equipment hierarchy, material management, and operations integration</div>';

    html += '<div class="info-box"><strong>ISA-95</strong> (IEC 62264) defines models and terminology for the interface between enterprise (business/ERP) and control systems. It establishes a 5-level functional hierarchy and standardized data exchange models for manufacturing operations management.</div>';

    // Functional Hierarchy
    html += '<div class="section"><div class="section-title">Functional Hierarchy Levels</div>';
    html += '<div class="hierarchy-levels">';
    ISA.ISA95_Levels.forEach(function(lvl) {
        html += '<div class="hierarchy-level">';
        html += '<span class="level-num">' + lvl.level + '</span>';
        html += '<span class="level-name">' + h(lvl.name) + '</span>';
        html += '<span style="color:var(--color-accent);font-size:11px;min-width:200px">' + h(lvl.systems) + '</span>';
        html += '<span class="level-desc">' + h(lvl.description) + '</span>';
        html += '</div>';
    });
    html += '</div></div>';

    // Equipment Hierarchy Tree
    html += '<div class="section"><div class="section-title">Equipment Hierarchy (Role-Based)</div>';
    html += '<div class="split-layout">';
    html += '<div class="card">';
    html += '<div class="card-header"><div class="card-title">Equipment Tree</div></div>';
    html += renderEquipmentTree(ISA.Hierarchy.enterprise);
    html += '</div>';

    // Equipment UDTs
    html += '<div class="card">';
    html += '<div class="card-header"><div class="card-title">ISA-95 UDT Definitions</div><span class="card-badge" style="background:var(--bg-tertiary);color:var(--text-muted)">' + ISA.UDT.getByStandard('ISA-95').length + '</span></div>';
    html += renderUDTList('ISA-95');
    html += '</div>';
    html += '</div></div>';

    // Materials
    html += '<div class="section"><div class="section-title">Material Management <span class="section-badge">ISA-95 Part 2</span></div>';
    html += '<div class="split-layout">';

    // Material Definitions
    html += '<div class="card"><div class="card-header"><div class="card-title">Material Definitions</div></div>';
    html += '<table class="data-table"><thead><tr><th>ID</th><th>Material</th><th>Class</th><th>UOM</th><th>Hazard</th></tr></thead><tbody>';
    ISA.Materials.definitions.forEach(function(m) {
        html += '<tr><td class="tag-name">' + h(m.id) + '</td><td>' + h(m.name) + '</td><td>' + h(m.class) + '</td><td class="mono">' + h(m.uom) + '</td>';
        html += '<td><span style="color:' + (m.hazard === 'None' ? 'var(--color-running)' : 'var(--color-warning)') + '">' + h(m.hazard) + '</span></td></tr>';
    });
    html += '</tbody></table></div>';

    // Material Lots
    html += '<div class="card"><div class="card-header"><div class="card-title">Material Lots</div></div>';
    html += '<table class="data-table"><thead><tr><th>Lot ID</th><th>Material</th><th>Qty</th><th>Quality</th><th>Location</th></tr></thead><tbody>';
    ISA.Materials.lots.forEach(function(lot) {
        var mat = ISA.Materials.definitions.find(function(m) { return m.id === lot.materialID; });
        var qColor = lot.quality === 'Released' ? 'var(--color-running)' : lot.quality === 'Quarantine' ? 'var(--color-warning)' : 'var(--color-alarm)';
        html += '<tr><td class="tag-name">' + h(lot.lotID) + '</td><td>' + h(mat ? mat.name : lot.materialID) + '</td><td class="mono">' + lot.quantity + ' ' + h(mat ? mat.uom : '') + '</td>';
        html += '<td><span style="color:' + qColor + '">' + h(lot.quality) + '</span></td><td>' + h(lot.location) + '</td></tr>';
    });
    html += '</tbody></table></div>';
    html += '</div></div>';

    return html;
};

// ────────────────────────────────────────────────────────────
// ISA-88 Screen
// ────────────────────────────────────────────────────────────
ISA.Screens.isa88 = function() {
    var html = '';
    html += '<div class="screen-title">ISA-88: Batch Control <span class="std-badge">ISA-88</span></div>';
    html += '<div class="screen-subtitle">Batch process control models, state machines, recipes, and procedural control</div>';

    html += '<div class="info-box"><strong>ISA-88</strong> (IEC 61512) provides a standard for batch process control. It defines the physical model (equipment), procedural model (how to make), and recipe model (what to make). The state machine model defines standard states and transitions for batch entities.</div>';

    // State Machine
    html += '<div class="section"><div class="section-title">S88 State Machine Model</div>';
    html += '<div class="card"><div class="card-body">';
    html += '<div class="state-machine">';
    ISA.ISA88_States.forEach(function(st, i) {
        var isActive = (ISA.Batches.active.length > 0 && ISA.Batches.active[0].state === st.name);
        html += '<div class="state-box ' + st.name.toLowerCase() + (isActive ? ' active-state' : '') + '" title="' + h(st.description) + '">';
        html += st.name;
        if (st.commands.length > 0) {
            html += '<div style="font-size:8px;margin-top:3px;color:var(--text-muted);font-weight:400">' + st.commands.join(', ') + '</div>';
        }
        html += '</div>';
        if (i < ISA.ISA88_States.length - 1) html += '<div class="state-arrow">&#8594;</div>';
    });
    html += '</div>';
    html += '<div style="margin-top:12px;font-size:11px;color:var(--text-muted)">';
    html += '<strong>States:</strong> Idle &rarr; Running &rarr; Complete (normal flow) | Hold/Restart (process hold) | Pause/Resume (operator hold) | Stop (controlled shutdown) | Abort (emergency)';
    html += '</div>';
    html += '</div></div></div>';

    // Physical Model & Procedural Model side-by-side
    html += '<div class="section"><div class="section-title">ISA-88 Models</div>';
    html += '<div class="split-layout">';

    // Physical Model
    html += '<div class="card"><div class="card-header"><div class="card-title">Physical Model</div></div>';
    html += '<div class="tree">';
    html += '<div class="tree-node"><span class="tree-icon">&#9670;</span><span class="tree-label" style="font-weight:700">Process Cell</span><span class="tree-badge">Top Level</span></div>';
    html += '<div class="tree-children">';
    html += '<div class="tree-node"><span class="tree-icon">&#9670;</span><span class="tree-label" style="font-weight:600">Unit</span><span class="tree-badge">Processes 1 batch</span></div>';
    html += '<div class="tree-children">';
    html += '<div class="tree-node"><span class="tree-icon">&#9670;</span><span class="tree-label">Equipment Module</span><span class="tree-badge">Minor activity</span></div>';
    html += '<div class="tree-children">';
    html += '<div class="tree-node"><span class="tree-icon">&#9670;</span><span class="tree-label">Control Module</span><span class="tree-badge">Direct control</span></div>';
    html += '</div></div></div></div>';
    html += '</div></div>';

    // Procedural Model
    html += '<div class="card"><div class="card-header"><div class="card-title">Procedural Model</div></div>';
    html += '<div class="tree">';
    html += '<div class="tree-node"><span class="tree-icon">&#9654;</span><span class="tree-label" style="font-weight:700">Procedure</span><span class="tree-badge">Full batch sequence</span></div>';
    html += '<div class="tree-children">';
    html += '<div class="tree-node"><span class="tree-icon">&#9654;</span><span class="tree-label" style="font-weight:600">Unit Procedure</span><span class="tree-badge">Contiguous ops on 1 unit</span></div>';
    html += '<div class="tree-children">';
    html += '<div class="tree-node"><span class="tree-icon">&#9654;</span><span class="tree-label">Operation</span><span class="tree-badge">Independent activity</span></div>';
    html += '<div class="tree-children">';
    html += '<div class="tree-node"><span class="tree-icon">&#9654;</span><span class="tree-label">Phase</span><span class="tree-badge">Equipment-oriented action</span></div>';
    html += '</div></div></div></div>';
    html += '</div></div>';

    html += '</div></div>';

    // Recipe Management
    html += '<div class="section"><div class="section-title">Recipe Management <span class="section-badge">' + ISA.Batches.recipes.length + ' recipes</span></div>';
    ISA.Batches.recipes.forEach(function(recipe) {
        html += '<div class="recipe-block">';
        html += '<div class="recipe-header"><div class="recipe-name">' + h(recipe.recipeName) + '</div>';
        html += '<div><span class="card-badge" style="background:var(--color-running);color:white;margin-right:6px">' + h(recipe.status) + '</span>';
        html += '<span class="recipe-type">' + h(recipe.recipeID) + ' v' + h(recipe.version) + ' | ' + h(recipe.recipeType) + '</span></div></div>';
        html += '<div style="margin-bottom:8px;font-size:11px;color:var(--text-secondary)">' + h(recipe.description) + '</div>';

        // Formula
        html += '<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">FORMULA</div>';
        html += '<table class="data-table"><thead><tr><th>Material</th><th>Qty</th><th>UOM</th><th>Lot Req</th></tr></thead><tbody>';
        recipe.formula.forEach(function(f) {
            html += '<tr><td>' + h(f.material) + '</td><td class="mono">' + f.quantity + '</td><td>' + h(f.uom) + '</td><td>' + (f.lotReq ? 'Yes' : 'No') + '</td></tr>';
        });
        html += '</tbody></table></div>';

        // Procedure
        html += '<div><div style="font-size:10px;color:var(--text-muted);font-weight:700;margin-bottom:4px">PROCEDURE</div>';
        recipe.procedure.forEach(function(step) {
            var batch = ISA.Batches.active.find(function(b) { return b.recipeID === recipe.recipeID; });
            var isActive = batch && batch.phaseStep === step.step;
            var isDone = batch && step.step < batch.phaseStep;
            html += '<div class="recipe-step' + (isActive ? ' active' : '') + '">';
            html += '<div class="recipe-step-num" style="' + (isDone ? 'background:var(--color-running);color:white' : '') + '">' + (isDone ? '&#10003;' : step.step) + '</div>';
            html += '<div style="flex:1"><strong>' + h(step.phase) + '</strong> - ' + h(step.description) + '</div>';
            html += '<div style="font-size:10px;color:var(--text-muted)">' + step.duration + ' min</div>';
            html += '</div>';
        });
        html += '</div>';
        html += '</div>';
    });
    html += '</div>';

    // UDTs
    html += '<div class="section"><div class="section-title">ISA-88 UDT Definitions</div>';
    html += renderUDTList('ISA-88');
    html += '</div>';

    return html;
};

// ────────────────────────────────────────────────────────────
// ISA-101 Screen
// ────────────────────────────────────────────────────────────
ISA.Screens.isa101 = function() {
    var html = '';
    html += '<div class="screen-title">ISA-101: Human Machine Interfaces <span class="std-badge">ISA-101</span></div>';
    html += '<div class="screen-subtitle">HMI design principles, display hierarchy, color standards, and faceplate design</div>';

    html += '<div class="info-box"><strong>ISA-101</strong> addresses the design, implementation, operation, and maintenance of Human Machine Interfaces for process manufacturing. It establishes standards for display hierarchy, color usage, element animation, alarm presentation, and navigation to maximize operator effectiveness and situational awareness.</div>';

    // Display Hierarchy
    html += '<div class="section"><div class="section-title">4-Level Display Hierarchy</div>';
    html += '<div class="card-grid cols-4">';
    var levels = [
        { level: 1, name: 'Level 1 Overview', desc: 'Plant/area overview. Entire process at a glance. Abnormal situation detection. Minimal detail, maximum awareness.', color: 'var(--color-info)' },
        { level: 2, name: 'Level 2 Area Overview', desc: 'Unit/area detail. Process section with key values and equipment states. Primary operator workspace.', color: 'var(--color-accent)' },
        { level: 3, name: 'Level 3 Unit Detail', desc: 'Detailed equipment view with faceplates, trends, and control elements. Used for troubleshooting and tuning.', color: 'var(--color-running)' },
        { level: 4, name: 'Level 4 Diagnostic', desc: 'Detailed diagnostics, device configuration, historical data, and maintenance information.', color: 'var(--color-manual)' }
    ];
    levels.forEach(function(lvl) {
        html += '<div class="card"><div class="card-header"><div class="card-title" style="color:' + lvl.color + '">L' + lvl.level + '</div></div>';
        html += '<div style="font-weight:600;margin-bottom:6px;font-size:12px">' + h(lvl.name) + '</div>';
        html += '<div class="card-body">' + h(lvl.desc) + '</div></div>';
    });
    html += '</div></div>';

    // Color Standards
    html += '<div class="section"><div class="section-title">ISA-101 Color Standards</div>';
    var categories = ['Equipment', 'Alarm', 'Data', 'Piping', 'Display', 'Trend'];
    categories.forEach(function(cat) {
        var colors = ISA.ISA101_Colors.filter(function(c) { return c.category === cat; });
        if (colors.length === 0) return;
        html += '<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:700;color:var(--text-muted);margin-bottom:6px;letter-spacing:1px">' + cat.toUpperCase() + '</div>';
        html += '<div class="color-swatches">';
        colors.forEach(function(c) {
            html += '<div class="color-swatch">';
            html += '<div class="color-swatch-box" style="background:' + c.color + '"></div>';
            html += '<div><div style="font-weight:600;font-size:11px;color:var(--text-primary)">' + h(c.name) + '</div>';
            html += '<div style="font-size:9px;color:var(--text-muted)">' + h(c.usage) + '</div></div>';
            html += '</div>';
        });
        html += '</div></div>';
    });
    html += '</div>';

    // Faceplate Examples
    html += '<div class="section"><div class="section-title">ISA-101 Faceplate Design</div>';
    html += '<div class="info-box">Faceplates provide a standardized, compact view of a control loop. They show the process value (PV), setpoint (SP), output (OP), mode, alarm status, and engineering units in a consistent layout across the entire HMI system.</div>';
    html += renderFaceplateGrid(ISA.Tags.getAnalogTags().filter(function(t) { return t.succeedingLetters && t.succeedingLetters.indexOf('IC') >= 0; }));
    html += '</div>';

    // Design Principles
    html += '<div class="section"><div class="section-title">Key Design Principles</div>';
    html += '<div class="card-grid cols-3">';
    var principles = [
        { title: 'High Performance', desc: 'Use gray backgrounds, minimal color, and analog indicators. Color is reserved for abnormal situations to avoid alarm fatigue and draw attention where needed.' },
        { title: 'Situational Awareness', desc: 'Operators should detect abnormal situations at Level 1 within seconds. Use bar graphs, trend indicators, and deviation colors to highlight process deviations.' },
        { title: 'Consistent Navigation', desc: 'Provide consistent navigation patterns: L1 > L2 > L3 > L4 drill-down. Every display must have clear breadcrumbs and parent/child relationships.' },
        { title: 'Alarm Presentation', desc: 'Follow ISA-18.2 alarm colors and priorities. Blinking reserved for unacknowledged alarms only. Alarm banners visible on all display levels.' },
        { title: 'Effective Animation', desc: 'Limit animation to convey process state changes. Running = green, Stopped = gray, Fault = red. Avoid gratuitous animation that distracts.' },
        { title: 'User-Centered Design', desc: 'Design for the operator workflow. Task analysis determines display content. Information density matched to operator needs at each hierarchy level.' }
    ];
    principles.forEach(function(p) {
        html += '<div class="card"><div class="card-title" style="margin-bottom:6px">' + h(p.title) + '</div>';
        html += '<div class="card-body">' + h(p.desc) + '</div></div>';
    });
    html += '</div></div>';

    // UDTs
    html += '<div class="section"><div class="section-title">ISA-101 UDT Definitions</div>';
    html += renderUDTList('ISA-101');
    html += '</div>';

    return html;
};

// ────────────────────────────────────────────────────────────
// ISA-18.2 Screen
// ────────────────────────────────────────────────────────────
ISA.Screens.isa182 = function() {
    var html = '';
    html += '<div class="screen-title">ISA-18.2: Alarm Management <span class="std-badge">ISA-18.2</span></div>';
    html += '<div class="screen-subtitle">Alarm lifecycle management, state model, prioritization, and rationalization</div>';

    html += '<div class="info-box"><strong>ISA-18.2</strong> (IEC 62682) provides a framework for alarm management throughout the alarm lifecycle: identification, rationalization, detailed design, implementation, operation, monitoring, management of change, and audit. It defines alarm states, priorities, and metrics.</div>';

    // Alarm State Model
    html += '<div class="section"><div class="section-title">Alarm State Model</div>';
    html += '<div class="card"><div class="card-body">';
    html += '<table class="data-table"><thead><tr><th>From State</th><th></th><th>To State</th><th>Trigger</th><th>Auto</th></tr></thead><tbody>';
    ISA.ISA182_StateModel.forEach(function(t) {
        html += '<tr><td class="mono">' + h(t.from) + '</td><td style="text-align:center">&#8594;</td>';
        html += '<td class="mono" style="color:var(--color-accent)">' + h(t.to) + '</td>';
        html += '<td>' + h(t.trigger) + '</td>';
        html += '<td>' + (t.auto ? '<span style="color:var(--color-running)">Auto</span>' : '<span style="color:var(--color-manual)">Manual</span>') + '</td></tr>';
    });
    html += '</tbody></table>';
    html += '</div></div></div>';

    // Alarm Priority Matrix
    html += '<div class="section"><div class="section-title">Alarm Priority Matrix</div>';
    html += '<div class="card-grid cols-4">';
    var priorities = [
        { name: 'Emergency', color: 'var(--alarm-emergency)', response: '< 5 min', desc: 'Immediate threat to life, environment, or major equipment. Requires immediate operator action.', notification: 'Screen + Horn + Light' },
        { name: 'High', color: 'var(--alarm-high)', response: '< 10 min', desc: 'Serious process upset requiring prompt action to prevent escalation. Equipment damage possible.', notification: 'Screen + Horn' },
        { name: 'Medium', color: 'var(--alarm-medium)', response: '< 30 min', desc: 'Abnormal situation requiring awareness. Process deviation that needs correction.', notification: 'Screen' },
        { name: 'Low', color: 'var(--alarm-low)', response: '< 60 min', desc: 'Information or advisory. No immediate action but awareness needed.', notification: 'Screen' }
    ];
    priorities.forEach(function(p) {
        html += '<div class="card" style="border-top:3px solid ' + p.color + '">';
        html += '<div class="card-title" style="color:' + p.color + '">' + h(p.name) + '</div>';
        html += '<div style="font-family:var(--font-mono);font-size:11px;margin:6px 0;color:var(--text-primary)">Response: ' + h(p.response) + '</div>';
        html += '<div class="card-body">' + h(p.desc) + '</div>';
        html += '<div style="font-size:10px;margin-top:6px;color:var(--text-muted)">' + h(p.notification) + '</div>';
        html += '</div>';
    });
    html += '</div></div>';

    // Active Alarm List
    html += '<div class="section"><div class="section-title">Active Alarm List <span class="section-badge" id="active-alarm-count">' + ISA.Alarms.activeAlarms.length + ' active</span></div>';
    html += '<div class="card" id="alarm-list-container">';
    html += renderAlarmList();
    html += '</div></div>';

    // Alarm Definitions
    html += '<div class="section"><div class="section-title">Alarm Point Database <span class="section-badge">' + ISA.Alarms.definitions.length + ' alarm points</span></div>';
    html += '<div class="scroll-container" style="max-height:300px">';
    html += '<table class="data-table"><thead><tr><th>Alarm ID</th><th>Tag</th><th>Type</th><th>Priority</th><th>Setpoint</th><th>Consequence</th></tr></thead><tbody>';
    ISA.Alarms.definitions.forEach(function(a) {
        var pColor = a.priority === 'High' ? 'var(--alarm-high)' : a.priority === 'Medium' ? 'var(--alarm-medium)' : 'var(--alarm-low)';
        html += '<tr><td class="tag-name">' + h(a.alarmID) + '</td><td class="mono">' + h(a.tagName) + '</td>';
        html += '<td>' + h(a.type) + '</td><td style="color:' + pColor + '">' + h(a.priority) + '</td>';
        html += '<td class="mono">' + a.setpoint + '</td><td style="font-size:11px">' + h(a.consequence) + '</td></tr>';
    });
    html += '</tbody></table></div></div>';

    // Alarm Lifecycle
    html += '<div class="section"><div class="section-title">Alarm Lifecycle Stages</div>';
    html += '<div class="card-grid cols-4">';
    var lifecycle = [
        { name: 'Identification', desc: 'Identify potential alarm conditions from HAZOP, P&HA, process design, and operational experience.' },
        { name: 'Rationalization', desc: 'Determine cause, consequence, corrective action, priority, and classification for each alarm.' },
        { name: 'Design & Implementation', desc: 'Configure alarms in DCS/PLC with proper setpoints, deadbands, delays, and priorities.' },
        { name: 'Operation & Monitoring', desc: 'Monitor alarm KPIs: alarm rate, standing alarms, chattering, priority distribution, response time.' },
        { name: 'MOC (Management of Change)', desc: 'All alarm changes go through MOC. Document reason, review, approval, and implementation.' },
        { name: 'Audit', desc: 'Periodic audit of alarm system against ISA-18.2 benchmarks. Identify and resolve issues.' },
        { name: 'Benchmarking', desc: 'Target < 6 alarms/hr avg, < 12 alarms in 10 min, < 2 standing alarms per operator position.' },
        { name: 'Continuous Improvement', desc: 'Analyze bad actors, chattering alarms, and nuisance alarms. Remove or retune as needed.' }
    ];
    lifecycle.forEach(function(stage) {
        html += '<div class="card"><div class="card-title" style="margin-bottom:4px">' + h(stage.name) + '</div>';
        html += '<div class="card-body">' + h(stage.desc) + '</div></div>';
    });
    html += '</div></div>';

    // UDTs
    html += '<div class="section"><div class="section-title">ISA-18.2 UDT Definitions</div>';
    html += renderUDTList('ISA-18.2');
    html += '</div>';

    return html;
};

// ────────────────────────────────────────────────────────────
// ISA-5.1 Screen
// ────────────────────────────────────────────────────────────
ISA.Screens.isa51 = function() {
    var html = '';
    html += '<div class="screen-title">ISA-5.1: Instrumentation Symbols & Identification <span class="std-badge">ISA-5.1</span></div>';
    html += '<div class="screen-subtitle">Tag naming conventions, instrument letter codes, and P&ID symbol reference</div>';

    html += '<div class="info-box"><strong>ISA-5.1</strong> establishes uniform methods for designating instruments and instrumentation systems on flow diagrams and other documents. It defines tag number structure, letter designations for measured variables and functions, and standard symbols for P&ID drawings.</div>';

    // Tag Structure
    html += '<div class="section"><div class="section-title">Tag Number Structure</div>';
    html += '<div class="card"><div class="card-body">';
    html += '<div class="tag-builder">';
    html += '<div class="tag-segment" title="First Letter: Measured Variable" style="border-color:var(--color-accent);color:var(--color-accent)">T</div>';
    html += '<div class="tag-segment" title="Succeeding Letters: Functions" style="border-color:var(--color-running);color:var(--color-running)">IC</div>';
    html += '<div class="tag-separator">-</div>';
    html += '<div class="tag-segment" title="Loop Number" style="border-color:var(--color-manual);color:var(--color-manual)">101</div>';
    html += '<div class="tag-segment" title="Suffix (optional)" style="border-color:var(--text-muted);color:var(--text-muted)">A</div>';
    html += '</div>';
    html += '<div style="display:flex;justify-content:center;gap:40px;margin-top:12px;font-size:11px">';
    html += '<div style="text-align:center"><div style="color:var(--color-accent);font-weight:700">First Letter</div><div style="color:var(--text-muted)">Measured Variable</div><div style="color:var(--text-secondary)">T = Temperature</div></div>';
    html += '<div style="text-align:center"><div style="color:var(--color-running);font-weight:700">Succeeding Letters</div><div style="color:var(--text-muted)">Readout/Function</div><div style="color:var(--text-secondary)">I = Indicate, C = Control</div></div>';
    html += '<div style="text-align:center"><div style="color:var(--color-manual);font-weight:700">Loop Number</div><div style="color:var(--text-muted)">Identification</div><div style="color:var(--text-secondary)">Unique within area</div></div>';
    html += '<div style="text-align:center"><div style="color:var(--text-muted);font-weight:700">Suffix</div><div style="color:var(--text-muted)">Optional</div><div style="color:var(--text-secondary)">A/B for redundant</div></div>';
    html += '</div>';
    html += '</div></div></div>';

    // First Letter Table
    html += '<div class="section"><div class="section-title">ISA-5.1 First Letter Designations</div>';
    html += '<div class="scroll-container" style="max-height:400px">';
    html += '<table class="data-table"><thead><tr><th>Letter</th><th>Measured Variable</th><th>Modifier/Function</th></tr></thead><tbody>';
    Object.keys(ISA.ISA51_FirstLetters).forEach(function(letter) {
        var def = ISA.ISA51_FirstLetters[letter];
        html += '<tr><td style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--color-accent)">' + letter + '</td>';
        html += '<td>' + h(def.variable) + '</td><td>' + h(def.modifier) + '</td></tr>';
    });
    html += '</tbody></table></div></div>';

    // Function Letters
    html += '<div class="section"><div class="section-title">Succeeding Letter Functions</div>';
    html += '<div class="card-grid cols-4">';
    Object.keys(ISA.ISA51_FunctionLetters).forEach(function(letter) {
        html += '<div class="card" style="padding:10px;text-align:center">';
        html += '<div style="font-family:var(--font-mono);font-size:24px;font-weight:800;color:var(--color-accent)">' + letter + '</div>';
        html += '<div style="font-size:11px;color:var(--text-secondary)">' + h(ISA.ISA51_FunctionLetters[letter]) + '</div>';
        html += '</div>';
    });
    html += '</div></div>';

    // P&ID Symbols
    html += '<div class="section"><div class="section-title">P&ID Symbol Reference</div>';
    html += '<div class="pid-symbols">';

    var symbols = [
        { tag: 'TIC-101', label: 'Field Mounted', type: 'circle', desc: 'Circle = Field mounted instrument' },
        { tag: 'PIC-101', label: 'Panel Mounted', type: 'circle-line', desc: 'Circle + horizontal line = Panel/CR' },
        { tag: 'FIC-101', label: 'DCS/Shared Display', type: 'circle-dashed', desc: 'Circle + dashed line = DCS/Shared' },
        { tag: 'LIC-101', label: 'PLC Function', type: 'square', desc: 'Square = PLC-based function' },
        { tag: 'XV-101', label: 'On/Off Valve', type: 'diamond', desc: 'Diamond = On/off valve' },
        { tag: 'FCV-101', label: 'Control Valve', type: 'valve', desc: 'Bow-tie = Control valve' }
    ];

    symbols.forEach(function(sym) {
        html += '<div class="pid-symbol">';
        html += renderPIDSymbol(sym.type, sym.tag);
        html += '<div class="pid-symbol-tag">' + h(sym.tag) + '</div>';
        html += '<div class="pid-symbol-label">' + h(sym.label) + '</div>';
        html += '<div style="font-size:9px;color:var(--text-muted);margin-top:2px">' + h(sym.desc) + '</div>';
        html += '</div>';
    });
    html += '</div></div>';

    // Tag Examples from our database
    html += '<div class="section"><div class="section-title">Tag Database Examples <span class="section-badge">' + ISA.Tags.getAll().length + ' tags</span></div>';
    html += '<div class="scroll-container" style="max-height:300px">';
    html += '<table class="data-table"><thead><tr><th>Tag</th><th>1st Letter</th><th>Functions</th><th>Loop #</th><th>Description</th><th>Location</th></tr></thead><tbody>';
    ISA.Tags.getAll().forEach(function(tag) {
        html += '<tr><td class="tag-name">' + h(tag.tagName) + '</td>';
        html += '<td class="mono" style="color:var(--color-accent)">' + h(tag.firstLetter) + ' (' + h(ISA.ISA51_FirstLetters[tag.firstLetter] ? ISA.ISA51_FirstLetters[tag.firstLetter].variable : '') + ')</td>';
        html += '<td class="mono">' + h(tag.succeedingLetters) + '</td>';
        html += '<td class="mono">' + tag.loopNumber + '</td>';
        html += '<td>' + h(tag.description) + '</td>';
        html += '<td>' + h(tag.location) + '</td></tr>';
    });
    html += '</tbody></table></div></div>';

    // UDTs
    html += '<div class="section"><div class="section-title">ISA-5.1 UDT Definitions</div>';
    html += renderUDTList('ISA-5.1');
    html += '</div>';

    return html;
};

// ────────────────────────────────────────────────────────────
// UDT Browser Screen
// ────────────────────────────────────────────────────────────
ISA.Screens['udt-browser'] = function() {
    var html = '';
    html += '<div class="screen-title">UDT Browser <span class="std-badge">ALL STANDARDS</span></div>';
    html += '<div class="screen-subtitle">Browse all User Defined Type definitions across ISA-95, ISA-88, ISA-101, ISA-18.2, and ISA-5.1</div>';

    var standards = ['ISA-95', 'ISA-88', 'ISA-101', 'ISA-18.2', 'ISA-5.1'];
    html += '<div class="info-box"><strong>User Defined Types (UDTs)</strong> are reusable data structure templates that define the members (fields) of a complex tag. Each UDT maps to an ISA standard concept - equipment models, alarm definitions, instrument tags, recipe structures, etc. Instances of UDTs become the actual tags in the control system.</div>';

    // Summary stats
    html += '<div class="card-grid cols-5" style="margin-bottom:16px">';
    standards.forEach(function(std) {
        var udts = ISA.UDT.getByStandard(std);
        html += '<div class="card stat-card" style="padding:12px"><div class="stat-value" style="font-size:24px">' + udts.length + '</div><div class="stat-label">' + h(std) + '</div></div>';
    });
    html += '</div>';

    // All UDTs by standard
    standards.forEach(function(std) {
        html += '<div class="section"><div class="section-title">' + h(std) + ' UDT Definitions</div>';
        html += renderUDTList(std);
        html += '</div>';
    });

    return html;
};

// ────────────────────────────────────────────────────────────
// Tag Browser Screen
// ────────────────────────────────────────────────────────────
ISA.Screens['tag-browser'] = function() {
    var html = '';
    var allTags = ISA.Tags.getAll();
    html += '<div class="screen-title">Tag Browser <span class="std-badge">' + allTags.length + ' TAGS</span></div>';
    html += '<div class="screen-subtitle">Browse all tag instances with live simulated values</div>';

    // Analog tags table
    html += '<div class="section"><div class="section-title">Analog Tags <span class="section-badge">' + ISA.Tags.getAnalogTags().length + ' tags</span></div>';
    html += '<div class="scroll-container" style="max-height:400px">';
    html += '<table class="data-table" id="analog-tag-table"><thead><tr><th>Tag</th><th>Description</th><th>PV</th><th>SP</th><th>Units</th><th>Output</th><th>Mode</th><th>Alarm</th><th>Equipment</th></tr></thead><tbody>';
    ISA.Tags.getAnalogTags().forEach(function(tag) {
        html += '<tr>';
        html += '<td class="tag-name">' + h(tag.tagName) + '</td>';
        html += '<td>' + h(tag.description) + '</td>';
        html += '<td class="value-cell" style="color:' + alarmColor(tag.alarmState) + '">' + tag.pv.toFixed(1) + '</td>';
        html += '<td class="value-cell">' + (tag.sp || '-') + '</td>';
        html += '<td class="mono">' + h(tag.engUnits) + '</td>';
        html += '<td class="value-cell">' + (tag.output !== undefined ? tag.output.toFixed(1) + '%' : '-') + '</td>';
        html += '<td><span class="faceplate-mode ' + (tag.mode || '').toLowerCase() + '">' + h(tag.mode) + '</span></td>';
        html += '<td style="color:' + alarmColor(tag.alarmState) + '">' + h(tag.alarmState) + '</td>';
        html += '<td class="mono">' + h(tag.equipment) + '</td>';
        html += '</tr>';
    });
    html += '</tbody></table></div></div>';

    // Discrete tags
    html += '<div class="section"><div class="section-title">Discrete Tags <span class="section-badge">' + ISA.Tags.getDiscreteTags().length + ' tags</span></div>';
    html += '<div class="scroll-container" style="max-height:300px">';
    html += '<table class="data-table" id="discrete-tag-table"><thead><tr><th>Tag</th><th>Description</th><th>State</th><th>Feedback</th><th>Amps</th><th>Speed</th><th>Equipment</th></tr></thead><tbody>';
    ISA.Tags.getDiscreteTags().forEach(function(tag) {
        var stateColor = tag.state === 'Running' ? 'var(--color-running)' : 'var(--color-stopped)';
        html += '<tr>';
        html += '<td class="tag-name">' + h(tag.tagName) + '</td>';
        html += '<td>' + h(tag.description) + '</td>';
        html += '<td style="color:' + stateColor + ';font-weight:600">' + h(tag.state) + '</td>';
        html += '<td style="color:' + stateColor + '">' + h(tag.feedback) + '</td>';
        html += '<td class="value-cell">' + (tag.amps !== undefined ? tag.amps + ' A' : '-') + '</td>';
        html += '<td class="value-cell">' + (tag.speed !== undefined ? tag.speed + ' RPM' : '-') + '</td>';
        html += '<td class="mono">' + h(tag.equipment) + '</td>';
        html += '</tr>';
    });
    html += '</tbody></table></div></div>';

    // Faceplates for controllers
    html += '<div class="section"><div class="section-title">Controller Faceplates (Live)</div>';
    html += renderFaceplateGrid(ISA.Tags.getAnalogTags().filter(function(t) { return t.output !== undefined; }));
    html += '</div>';

    return html;
};

// ────────────────────────────────────────────────────────────
// Process Overview Screen
// ────────────────────────────────────────────────────────────
ISA.Screens['process-overview'] = function() {
    var html = '';
    html += '<div class="screen-title">Process Overview <span class="std-badge">LEVEL 1</span></div>';
    html += '<div class="screen-subtitle">ISA-101 Level 1 - Plant overview for situational awareness</div>';

    // Process flow
    html += '<div class="section"><div class="section-title">Area 100 - Batch Reactor System</div>';
    html += '<div class="process-view">';
    html += '<div class="process-equipment">';

    // Feed Tank
    var lt102 = ISA.Tags.get('LT-102');
    html += renderEquipmentBox('T-101', 'Feed Tank', '&#9638;', lt102 ? lt102.pv.toFixed(1) + '%' : '--', 'running');
    html += '<div class="pipe-connector">&#9472;&#9472;&#9654;</div>';

    // Pump
    var p101a = ISA.Tags.get('P-101A');
    html += renderEquipmentBox('P-101A', 'Feed Pump A', '&#9881;', p101a ? p101a.state : '--', p101a && p101a.state === 'Running' ? 'running' : 'stopped');
    html += '<div class="pipe-connector">&#9472;&#9472;&#9654;</div>';

    // Reactor
    var tt101 = ISA.Tags.get('TT-101');
    var lt101 = ISA.Tags.get('LT-101');
    var pt101 = ISA.Tags.get('PT-101');
    html += '<div class="equipment-box running" style="min-width:160px">';
    html += '<div class="equipment-icon">&#9883;</div>';
    html += '<div class="equipment-tag">R-101</div>';
    html += '<div class="equipment-name">Reactor</div>';
    if (tt101 && lt101 && pt101) {
        html += '<div style="font-size:10px;margin-top:6px;text-align:left;width:100%">';
        html += '<div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Temp:</span><span class="equipment-value" style="font-size:12px;color:' + alarmColor(tt101.alarmState) + '">' + tt101.pv.toFixed(1) + ' ' + tt101.engUnits + '</span></div>';
        html += '<div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Level:</span><span class="equipment-value" style="font-size:12px;color:' + alarmColor(lt101.alarmState) + '">' + lt101.pv.toFixed(1) + ' %</span></div>';
        html += '<div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Press:</span><span class="equipment-value" style="font-size:12px;color:' + alarmColor(pt101.alarmState) + '">' + pt101.pv.toFixed(1) + ' PSIG</span></div>';
        html += '</div>';
    }
    html += '</div>';
    html += '<div class="pipe-connector">&#9472;&#9472;&#9654;</div>';

    // Heat Exchanger
    var tt102 = ISA.Tags.get('TT-102');
    html += renderEquipmentBox('HX-101', 'Heat Exchanger', '&#10005;', tt102 ? tt102.pv.toFixed(1) + ' degF' : '--', 'running');
    html += '<div class="pipe-connector">&#9472;&#9472;&#9654;</div>';

    // Product Tank
    var lt103 = ISA.Tags.get('LT-103');
    html += renderEquipmentBox('T-102', 'Product Tank', '&#9638;', lt103 ? lt103.pv.toFixed(1) + '%' : '--', 'running');

    html += '</div></div></div>';

    // Agitator status
    var m101 = ISA.Tags.get('M-101');
    var st101 = ISA.Tags.get('ST-101');
    var at101 = ISA.Tags.get('AT-101');
    var ft101 = ISA.Tags.get('FT-101');
    var ft102 = ISA.Tags.get('FT-102');

    html += '<div class="section"><div class="section-title">Key Process Indicators</div>';
    html += '<div class="card-grid cols-5">';
    if (m101) html += '<div class="card stat-card"><div class="stat-value" style="font-size:22px;color:' + (m101.state === 'Running' ? 'var(--color-running)' : 'var(--color-stopped)') + '">' + (st101 ? st101.pv : '--') + '</div><div class="stat-label">Agitator RPM</div><div class="stat-sub">M-101 ' + m101.state + '</div></div>';
    if (at101) html += '<div class="card stat-card"><div class="stat-value" style="font-size:22px;color:' + alarmColor(at101.alarmState) + '">' + at101.pv.toFixed(1) + '</div><div class="stat-label">Reactor pH</div><div class="stat-sub">AT-101 SP: ' + at101.sp + '</div></div>';
    if (ft101) html += '<div class="card stat-card"><div class="stat-value" style="font-size:22px;color:' + alarmColor(ft101.alarmState) + '">' + ft101.pv.toFixed(1) + '</div><div class="stat-label">Feed Flow GPM</div><div class="stat-sub">FT-101 SP: ' + ft101.sp + '</div></div>';
    if (ft102) html += '<div class="card stat-card"><div class="stat-value" style="font-size:22px;color:' + alarmColor(ft102.alarmState) + '">' + ft102.pv.toFixed(1) + '</div><div class="stat-label">Product Flow GPM</div><div class="stat-sub">FT-102 SP: ' + ft102.sp + '</div></div>';
    // Batch status
    if (ISA.Batches.active.length > 0) {
        var batch = ISA.Batches.active[0];
        html += '<div class="card stat-card"><div class="stat-value" style="font-size:16px;color:var(--color-running)">' + h(batch.batchID) + '</div><div class="stat-label">Active Batch</div><div class="stat-sub">Phase: ' + h(batch.currentPhase) + '</div></div>';
    }
    html += '</div></div>';

    // Controller faceplates
    html += '<div class="section"><div class="section-title">Loop Controllers</div>';
    html += renderFaceplateGrid(ISA.Tags.getAnalogTags().filter(function(t) { return t.output !== undefined; }));
    html += '</div>';

    // Cooling Water
    html += '<div class="section"><div class="section-title">Area 200 - Cooling Water System</div>';
    html += '<div class="process-view">';
    html += '<div class="process-equipment">';
    var tt301 = ISA.Tags.get('TT-301');
    var tt302 = ISA.Tags.get('TT-302');
    var ft301 = ISA.Tags.get('FT-301');
    var p301a = ISA.Tags.get('P-301A');
    var p301b = ISA.Tags.get('P-301B');

    html += renderEquipmentBox('CT-301', 'Cooling Tower', '&#9730;', tt301 ? tt301.pv.toFixed(1) + ' degF' : '--', 'running');
    html += '<div class="pipe-connector">&#9472;&#9472;&#9654;</div>';
    html += renderEquipmentBox('P-301A', 'CW Pump A', '&#9881;', p301a ? p301a.state : '--', p301a && p301a.state === 'Running' ? 'running' : 'stopped');
    html += renderEquipmentBox('P-301B', 'CW Pump B', '&#9881;', p301b ? p301b.state : '--', p301b && p301b.state === 'Running' ? 'running' : 'stopped');
    html += '<div class="pipe-connector">&#9472;&#9472;&#9654;</div>';
    html += renderEquipmentBox('SUPPLY', 'CW Supply', '&#8594;', ft301 ? ft301.pv.toFixed(0) + ' GPM' : '--', 'running');
    html += '<div class="pipe-connector">&#9472;&#9472;&#9654;</div>';
    html += renderEquipmentBox('RETURN', 'CW Return', '&#8592;', tt302 ? tt302.pv.toFixed(1) + ' degF' : '--', 'running');

    html += '</div></div></div>';

    return html;
};

// ────────────────────────────────────────────────────────────
// Shared Renderers
// ────────────────────────────────────────────────────────────

function renderUDTList(standard) {
    var udts = ISA.UDT.getByStandard(standard);
    var html = '<div class="card-grid cols-2">';
    udts.forEach(function(udt) {
        html += '<div class="card">';
        html += '<div class="card-header"><div class="card-title" style="font-family:var(--font-mono)">' + h(udt.name) + '</div>';
        html += '<span class="card-badge" style="background:var(--bg-tertiary);color:var(--text-muted)">' + udt.members.length + ' members</span></div>';
        html += '<div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px">' + h(udt.description) + '</div>';
        html += '<table class="udt-member-table"><thead><tr><th>Member</th><th>Type</th><th>Description</th><th>Default</th></tr></thead><tbody>';
        udt.members.forEach(function(m) {
            var defVal = m.defaultValue;
            if (Array.isArray(defVal)) defVal = '[]';
            else if (typeof defVal === 'object' && defVal !== null) defVal = '{}';
            else if (typeof defVal === 'boolean') defVal = defVal ? 'true' : 'false';
            else if (defVal === '') defVal = "''";
            html += '<tr><td class="member-name">' + h(m.name) + '</td>';
            html += '<td class="member-type">' + h(m.type) + '</td>';
            html += '<td>' + h(m.description) + '</td>';
            html += '<td style="font-family:var(--font-mono);font-size:10px">' + h(String(defVal)) + '</td></tr>';
        });
        html += '</tbody></table></div>';
    });
    html += '</div>';
    return html;
}

function renderFaceplateGrid(tags) {
    var html = '<div class="card-grid">';
    tags.forEach(function(tag) {
        var pct = percent(tag.pv, tag.rangeLow, tag.rangeHigh);
        var barColor = tag.alarmState === 'Normal' ? 'var(--color-running)' : alarmColor(tag.alarmState);
        html += '<div class="faceplate">';
        html += '<div class="faceplate-header">';
        html += '<div class="faceplate-tag">' + h(tag.tagName) + '</div>';
        html += '<span class="faceplate-mode ' + (tag.mode || '').toLowerCase() + '">' + h(tag.mode) + '</span>';
        html += '</div>';
        html += '<div class="faceplate-pv" style="color:' + alarmColor(tag.alarmState) + '">' + tag.pv.toFixed(1) + '<span class="faceplate-unit">' + h(tag.engUnits) + '</span></div>';
        html += '<div class="faceplate-bar"><div class="faceplate-bar-fill" style="width:' + pct + '%;background:' + barColor + '"></div></div>';
        html += '<div class="faceplate-row"><span class="faceplate-label">SP</span><span class="faceplate-value">' + (tag.sp || '-') + '</span></div>';
        if (tag.output !== undefined) {
            html += '<div class="faceplate-row"><span class="faceplate-label">OP</span><span class="faceplate-value">' + tag.output.toFixed(1) + '%</span></div>';
        }
        html += '<div class="faceplate-row"><span class="faceplate-label">Range</span><span class="faceplate-value">' + tag.rangeLow + ' - ' + tag.rangeHigh + '</span></div>';
        html += '<div class="faceplate-row"><span class="faceplate-label">Alarm</span><span class="faceplate-value" style="color:' + alarmColor(tag.alarmState) + '">' + h(tag.alarmState) + '</span></div>';
        html += '<div class="faceplate-desc">' + h(tag.description) + '</div>';
        html += '</div>';
    });
    html += '</div>';
    return html;
}

function renderAlarmList() {
    var alarms = ISA.Alarms.activeAlarms;
    if (alarms.length === 0) {
        return '<div style="padding:20px;text-align:center;color:var(--text-muted)">No active alarms - all systems normal</div>';
    }
    var html = '';
    alarms.forEach(function(a) {
        var pClass = (a.state === 'HIHI' || a.state === 'LOLO') ? 'high' : 'medium';
        html += '<div class="alarm-row">';
        html += '<div class="alarm-priority-bar ' + pClass + '"></div>';
        html += '<div class="alarm-time">' + h(a.time) + '</div>';
        html += '<div class="alarm-tag">' + h(a.tagName) + '</div>';
        html += '<div class="alarm-msg">' + h(a.description) + ' - ' + h(a.state) + ' (' + a.value.toFixed(1) + ' ' + h(a.engUnits) + ')</div>';
        html += '<div class="alarm-state-badge active">' + h(a.state) + '</div>';
        html += '</div>';
    });
    return html;
}

function renderEquipmentTree(enterprise) {
    var html = '<div class="tree">';
    html += '<div class="tree-node"><span class="tree-icon">&#9632;</span><span class="tree-label" style="font-weight:700">' + h(enterprise.name) + '</span><span class="tree-badge">Enterprise</span></div>';
    html += '<div class="tree-children">';
    (enterprise.sites || []).forEach(function(site) {
        html += '<div class="tree-node"><span class="tree-icon">&#9670;</span><span class="tree-label" style="font-weight:600">' + h(site.name) + '</span><span class="tree-badge">Site</span></div>';
        html += '<div class="tree-children">';
        (site.areas || []).forEach(function(area) {
            html += '<div class="tree-node"><span class="tree-icon">&#9670;</span><span class="tree-label">' + h(area.name) + '</span><span class="tree-badge">' + h(area.type) + '</span></div>';
            html += '<div class="tree-children">';
            (area.workCenters || []).forEach(function(wc) {
                html += '<div class="tree-node"><span class="tree-icon">&#9654;</span><span class="tree-label">' + h(wc.name) + '</span><span class="tree-badge">' + h(wc.type) + '</span></div>';
                html += '<div class="tree-children">';
                (wc.workUnits || []).forEach(function(wu) {
                    html += '<div class="tree-node"><span class="tree-icon">&#9654;</span><span class="tree-label">' + h(wu.name) + '</span></div>';
                    html += '<div class="tree-children">';
                    (wu.equipment || []).forEach(function(eq) {
                        html += '<div class="tree-node"><span class="tree-icon">&#9675;</span><span class="tree-label" style="font-family:var(--font-mono);color:var(--color-accent)">' + h(eq) + '</span></div>';
                    });
                    html += '</div>';
                });
                html += '</div>';
            });
            html += '</div>';
        });
        html += '</div>';
    });
    html += '</div></div>';
    return html;
}

function renderEquipmentBox(tag, name, icon, value, state) {
    return '<div class="equipment-box ' + state + '">' +
        '<div class="equipment-icon">' + icon + '</div>' +
        '<div class="equipment-tag">' + h(tag) + '</div>' +
        '<div class="equipment-name">' + h(name) + '</div>' +
        '<div class="equipment-value">' + h(value) + '</div>' +
        '</div>';
}

function renderPIDSymbol(type, tag) {
    var svg = '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">';
    var stroke = '#58a6ff';
    var fill = 'none';
    switch (type) {
        case 'circle':
            svg += '<circle cx="30" cy="30" r="22" stroke="' + stroke + '" stroke-width="2" fill="' + fill + '"/>';
            svg += '<text x="30" y="34" text-anchor="middle" fill="' + stroke + '" font-size="10" font-family="monospace" font-weight="bold">' + h(tag.split('-')[0]) + '</text>';
            break;
        case 'circle-line':
            svg += '<circle cx="30" cy="30" r="22" stroke="' + stroke + '" stroke-width="2" fill="' + fill + '"/>';
            svg += '<line x1="8" y1="30" x2="52" y2="30" stroke="' + stroke + '" stroke-width="1"/>';
            svg += '<text x="30" y="26" text-anchor="middle" fill="' + stroke + '" font-size="9" font-family="monospace" font-weight="bold">' + h(tag.split('-')[0]) + '</text>';
            svg += '<text x="30" y="42" text-anchor="middle" fill="' + stroke + '" font-size="8" font-family="monospace">' + h(tag.split('-')[1] || '') + '</text>';
            break;
        case 'circle-dashed':
            svg += '<circle cx="30" cy="30" r="22" stroke="' + stroke + '" stroke-width="2" stroke-dasharray="4 2" fill="' + fill + '"/>';
            svg += '<line x1="8" y1="30" x2="52" y2="30" stroke="' + stroke + '" stroke-width="1" stroke-dasharray="4 2"/>';
            svg += '<text x="30" y="26" text-anchor="middle" fill="' + stroke + '" font-size="9" font-family="monospace" font-weight="bold">' + h(tag.split('-')[0]) + '</text>';
            svg += '<text x="30" y="42" text-anchor="middle" fill="' + stroke + '" font-size="8" font-family="monospace">' + h(tag.split('-')[1] || '') + '</text>';
            break;
        case 'square':
            svg += '<rect x="8" y="8" width="44" height="44" stroke="' + stroke + '" stroke-width="2" fill="' + fill + '"/>';
            svg += '<text x="30" y="34" text-anchor="middle" fill="' + stroke + '" font-size="10" font-family="monospace" font-weight="bold">' + h(tag.split('-')[0]) + '</text>';
            break;
        case 'diamond':
            svg += '<polygon points="30,6 54,30 30,54 6,30" stroke="' + stroke + '" stroke-width="2" fill="' + fill + '"/>';
            svg += '<text x="30" y="34" text-anchor="middle" fill="' + stroke + '" font-size="10" font-family="monospace" font-weight="bold">' + h(tag.split('-')[0]) + '</text>';
            break;
        case 'valve':
            svg += '<polygon points="10,15 30,35 50,15" stroke="' + stroke + '" stroke-width="2" fill="' + fill + '"/>';
            svg += '<polygon points="10,45 30,25 50,45" stroke="' + stroke + '" stroke-width="2" fill="' + fill + '"/>';
            svg += '<line x1="30" y1="15" x2="30" y2="6" stroke="' + stroke + '" stroke-width="2"/>';
            svg += '<line x1="20" y1="6" x2="40" y2="6" stroke="' + stroke + '" stroke-width="2"/>';
            break;
    }
    svg += '</svg>';
    return svg;
}

// ────────────────────────────────────────────────────────────
// ERPC LIVE Screen - Real-time sensor data
// ────────────────────────────────────────────────────────────
ISA.Screens['erpc-live'] = function() {
    var conn = ISA.Connector;
    var d = conn.data;
    var status = conn.getStatus();
    var html = '';

    html += '<div class="screen-title">ERPC Live <span class="std-badge">SENSOR DATA</span></div>';
    html += '<div class="screen-subtitle">Entropy-Regulated Power Control - Guided Entropy Principle (GEP) | Real-time from hardware or simulation</div>';

    // Connection bar
    html += '<div class="card" style="margin-bottom:16px;padding:12px">';
    html += '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">';
    html += '<div style="display:flex;align-items:center;gap:8px">';
    html += '<span class="status-indicator ' + (conn.connected ? 'running' : 'stopped') + '"></span>';
    html += '<strong style="font-size:12px">' + (conn.connected ? 'CONNECTED' : 'DISCONNECTED') + '</strong>';
    html += '<span style="color:var(--text-muted);font-size:11px">Mode: ' + h(status.mode.toUpperCase()) + '</span>';
    html += '<span style="color:var(--text-muted);font-size:11px">Points: ' + status.dataPoints + '</span>';
    html += '</div>';
    html += '<div style="display:flex;gap:8px;margin-left:auto">';

    if (conn.serialSupported()) {
        if (conn.mode === 'serial' && conn.connected) {
            html += '<button class="filter-btn active" onclick="ISA.Connector.disconnectSerial()">Disconnect Serial</button>';
            html += '<button class="filter-btn" onclick="ISA.Connector.sendSerialCommand(\'d\')">Toggle Debug</button>';
            html += '<button class="filter-btn" onclick="ISA.Connector.sendSerialCommand(\'r\')">Reset Counters</button>';
        } else {
            html += '<button class="filter-btn" onclick="ISA.Connector.connectSerial()" style="border-color:var(--color-accent);color:var(--color-accent)">&#9211; Connect USB Serial</button>';
        }
    } else {
        html += '<span style="color:var(--text-muted);font-size:10px">WebSerial: Use Chrome/Edge for USB</span>';
    }

    if (conn.mode === 'demo' && !conn.connected) {
        html += '<button class="filter-btn" onclick="ISA.Connector.startDemo()" style="border-color:var(--color-running);color:var(--color-running)">&#9654; Start Demo</button>';
    } else if (conn.mode === 'demo' && conn.connected) {
        html += '<button class="filter-btn active" onclick="ISA.Connector.stopDemo()">&#9632; Stop Demo</button>';
    }

    html += '<button class="filter-btn" onclick="ISA.App.exportERPC()">Export JSON</button>';
    html += '</div></div></div>';

    // GEP values - big numbers
    html += '<div class="card-grid cols-5">';
    var gateColor = d.gate ? 'var(--color-running)' : 'var(--color-stopped)';
    var fields = [
        { label: 'Vout',      value: d.vout.toFixed(3),       unit: 'V',  color: 'var(--color-accent)' },
        { label: 'Iload',     value: d.iload.toFixed(3),      unit: 'A',  color: 'var(--color-info)' },
        { label: 'E(t) Error',value: d.error.toFixed(4),      unit: '',   color: Math.abs(d.error) > 0.5 ? 'var(--color-alarm)' : 'var(--color-running)' },
        { label: '\u0394S Entropy', value: d.entropy.toFixed(4), unit: '', color: Math.abs(d.entropy) > 0.5 ? 'var(--color-warning)' : 'var(--color-running)' },
        { label: 'Gate',      value: d.gate ? 'ON' : 'OFF',   unit: 'PWM:' + d.pwm, color: gateColor }
    ];
    fields.forEach(function(f) {
        html += '<div class="card stat-card">';
        html += '<div class="stat-value" style="font-size:24px;color:' + f.color + '">' + f.value + '</div>';
        html += '<div class="stat-label">' + h(f.label) + '</div>';
        html += '<div class="stat-sub">' + h(f.unit) + '</div>';
        html += '</div>';
    });
    html += '</div>';

    // Secondary values
    html += '<div class="card-grid cols-4" style="margin-bottom:16px">';
    var secondary = [
        { label: 'A(t) Salience',   value: d.salience.toFixed(4),   color: '#f0883e' },
        { label: '|\u2207S| Gradient', value: d.gradient.toFixed(4), color: '#da3633' },
        { label: 'Correction',      value: d.correction.toFixed(4), color: '#d29922' },
        { label: 'Samples',         value: d.samples,               color: 'var(--text-secondary)' }
    ];
    secondary.forEach(function(f) {
        html += '<div class="card" style="padding:10px;text-align:center">';
        html += '<div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:' + f.color + '">' + f.value + '</div>';
        html += '<div style="font-size:10px;color:var(--text-muted);margin-top:2px">' + h(f.label) + '</div>';
        html += '</div>';
    });
    html += '</div>';

    // Trend canvases
    html += '<div class="section"><div class="section-title">Voltage & Current</div>';
    html += '<div class="card" style="padding:8px"><canvas id="trend-vi" style="width:100%;height:180px"></canvas></div></div>';

    html += '<div class="split-layout">';
    html += '<div class="section"><div class="section-title">GEP Signals</div>';
    html += '<div class="card" style="padding:8px"><canvas id="trend-gep" style="width:100%;height:180px"></canvas></div></div>';

    html += '<div class="section"><div class="section-title">Entropy Field & Gate</div>';
    html += '<div class="card" style="padding:8px"><canvas id="trend-entropy" style="width:100%;height:180px"></canvas></div></div>';
    html += '</div>';

    // GEP Equation reference
    html += '<div class="section"><div class="section-title">GEP Algorithm Reference</div>';
    html += '<div class="info-box">';
    html += '<strong>Guided Entropy Principle (GEP)</strong> - Gary W. Floyd, Lumiea Systems Research<br><br>';
    html += '<div style="font-family:var(--font-mono);font-size:12px;line-height:2">';
    html += '<strong>E(t)</strong> = V<sub>ref</sub> - V<sub>out</sub> &nbsp;&nbsp;&nbsp; <span style="color:var(--text-muted)">// Error signal</span><br>';
    html += '<strong>A(t)</strong> = |P(t) - P(t-1)| &nbsp;&nbsp;&nbsp; <span style="color:var(--text-muted)">// Salience (power change rate)</span><br>';
    html += '<strong>|\u2207S(t)|</strong> = |V(t) - V(t-1)| &nbsp;&nbsp;&nbsp; <span style="color:var(--text-muted)">// Gradient (voltage change rate)</span><br>';
    html += '<strong>Correction</strong> = 1 + \u03B1\u00B7A(t) - \u03B2\u00B7|\u2207S(t)| &nbsp;&nbsp;&nbsp; <span style="color:var(--text-muted)">// \u03B1=0.3, \u03B2=0.5</span><br>';
    html += '<strong>\u0394S(t)</strong> = E(t) \u00D7 Correction &nbsp;&nbsp;&nbsp; <span style="color:var(--text-muted)">// Entropy field</span><br>';
    html += '<strong>Gate</strong> = |\u0394S(t)| > Threshold &nbsp;&nbsp;&nbsp; <span style="color:var(--text-muted)">// Threshold=0.5V &rarr; switch or skip</span><br>';
    html += '</div>';
    html += '<div style="margin-top:8px;color:var(--text-muted);font-size:11px">"The math is already done. This is just plugging in connections." - GWF</div>';
    html += '</div></div>';

    // After render, schedule canvas drawing
    requestAnimationFrame(function() { ISA.App.drawERPCTrends(); });

    return html;
};

// Called after ERPC screen renders to draw the canvas trends
ISA.App = ISA.App || {};
ISA.App.drawERPCTrends = function() {
    var hist = ISA.Connector.history;
    if (hist.time.length < 2) return;

    // Voltage & Current
    ISA.TrendCanvas.draw('trend-vi', [
        { data: hist.vout,  color: '#58a6ff', label: 'Vout',  width: 2 },
        { data: hist.iload, color: '#2ea043', label: 'Iload', width: 1.5 }
    ], { title: 'Vout (V) / Iload (A)', autoScale: true });

    // GEP Signals
    ISA.TrendCanvas.draw('trend-gep', [
        { data: hist.error,      color: '#da3633', label: 'E(t)',   width: 1.5 },
        { data: hist.salience,   color: '#f0883e', label: 'A(t)',   width: 1 },
        { data: hist.gradient,   color: '#d29922', label: '\u2207S', width: 1 },
        { data: hist.correction, color: '#8b949e', label: 'Corr',   width: 1, alpha: 0.6 }
    ], { title: 'GEP Components', autoScale: true });

    // Entropy & Gate
    ISA.TrendCanvas.draw('trend-entropy', [
        { data: hist.entropy, color: '#58a6ff', label: '\u0394S', width: 2 },
        { data: hist.gate.map(function(g) { return g ? 1 : 0; }), color: '#2ea043', label: 'Gate', width: 1.5 }
    ], { title: 'Entropy Field / Gate State', autoScale: true });
};

ISA.App.exportERPC = function() {
    var json = ISA.Connector.exportHistory();
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'erpc-data-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
    a.click();
    URL.revokeObjectURL(url);
};

// ────────────────────────────────────────────────────────────
// DEVICE SCANNER Screen
// ────────────────────────────────────────────────────────────
ISA.Screens['device-scanner'] = function() {
    var scanner = ISA.Scanner;
    var caps = scanner.getCapabilities();
    var html = '';

    html += '<div class="screen-title">Device Scanner <span class="std-badge">DISCOVERY</span></div>';
    html += '<div class="screen-subtitle">Scan for ERPC devices and ISA-compatible sensors across all available channels</div>';

    // Capabilities bar
    html += '<div class="card" style="margin-bottom:16px;padding:12px">';
    html += '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">';

    var channels = [
        { key: 'serial',    label: 'WebSerial',    icon: '&#9211;' },
        { key: 'usb',       label: 'WebUSB',       icon: '&#9783;' },
        { key: 'bluetooth', label: 'Bluetooth LE',  icon: '&#9784;' },
        { key: 'nfc',       label: 'Web NFC',       icon: '&#9889;' },
        { key: 'mqtt',      label: 'MQTT/WS',       icon: '&#9729;' },
        { key: 'network',   label: 'Network',        icon: '&#9881;' }
    ];
    channels.forEach(function(ch) {
        var avail = caps[ch.key];
        html += '<div style="display:flex;align-items:center;gap:4px;padding:4px 8px;border-radius:3px;background:' + (avail ? 'rgba(46,160,67,0.1)' : 'rgba(139,148,158,0.1)') + ';font-size:11px">';
        html += '<span class="status-indicator ' + (avail ? 'running' : 'stopped') + '"></span>';
        html += '<span style="color:' + (avail ? 'var(--color-running)' : 'var(--text-muted)') + '">' + ch.label + '</span>';
        html += '</div>';
    });

    if (!caps.secure) {
        html += '<div style="color:var(--color-warning);font-size:10px;margin-left:8px">&#9888; HTTPS required for WebSerial/USB/BLE - serve via GitHub Pages or localhost</div>';
    }
    html += '</div></div>';

    // Scan buttons
    html += '<div class="section"><div class="section-title">Scan Controls</div>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">';

    html += '<button class="filter-btn" onclick="ISA.App.runScanAll()" style="border-color:var(--color-accent);color:var(--color-accent);font-weight:600">';
    html += (scanner.scanning ? '&#9211; Scanning...' : '&#9654; Scan All Channels');
    html += '</button>';

    if (caps.serial) {
        html += '<button class="filter-btn" onclick="ISA.App.runScanSerial()">&#9211; Pair Serial Port</button>';
    }
    if (caps.usb) {
        html += '<button class="filter-btn" onclick="ISA.App.runScanUSB()">&#9783; Authorize USB</button>';
    }
    if (caps.bluetooth) {
        html += '<button class="filter-btn" onclick="ISA.App.runScanBLE()">&#9784; Scan BLE</button>';
    }

    html += '<button class="filter-btn" onclick="ISA.App.runScanMQTT()">&#9729; MQTT Discovery</button>';
    html += '<button class="filter-btn" onclick="ISA.App.runScanRange()">&#9881; Scan IP Range</button>';
    html += '<button class="filter-btn" onclick="ISA.Scanner.clearDevices();ISA.App.navigate(\'device-scanner\')" style="color:var(--text-muted)">Clear</button>';
    html += '</div></div>';

    // Discovered devices table
    html += '<div class="section"><div class="section-title">Discovered Devices <span class="section-badge">' + scanner.devices.length + ' found</span></div>';
    if (scanner.devices.length === 0) {
        html += '<div class="card" style="padding:40px;text-align:center;color:var(--text-muted)">';
        html += '<div style="font-size:40px;margin-bottom:12px">&#9211;</div>';
        html += '<div style="font-size:14px;margin-bottom:4px">No devices discovered yet</div>';
        html += '<div style="font-size:11px">Click "Scan All Channels" to search for ERPC devices<br>or use individual channel buttons above</div>';
        html += '</div>';
    } else {
        html += '<div class="scroll-container" style="max-height:400px">';
        html += '<table class="data-table"><thead><tr>';
        html += '<th></th><th>Device</th><th>Channel</th><th>IDs</th><th>Status</th><th>ERPC</th><th>Found</th><th>Action</th>';
        html += '</tr></thead><tbody>';

        scanner.devices.forEach(function(dev) {
            var erpcColor = dev.erpcSignature ? 'var(--color-running)' : 'var(--text-muted)';
            var statusColor = dev.status.indexOf('ERPC') >= 0 ? 'var(--color-running)' :
                              dev.status === 'reachable' || dev.status === 'connected' || dev.status === 'found' || dev.status === 'paired' ? 'var(--color-accent)' :
                              dev.status === 'listening' ? 'var(--color-info)' : 'var(--text-secondary)';

            html += '<tr>';
            html += '<td><span class="status-indicator ' + (dev.status === 'ERPC detected' ? 'running' : dev.canConnect ? 'running' : 'stopped') + '"></span></td>';
            html += '<td class="tag-name">' + h(dev.name) + '</td>';
            html += '<td>' + h(dev.channel) + '</td>';
            html += '<td class="mono" style="font-size:10px">';
            if (dev.vendorId) html += 'VID:' + dev.vendorId + ' ';
            if (dev.productId) html += 'PID:' + dev.productId + ' ';
            if (dev.host) html += dev.host + ':' + dev.port + ' ';
            if (dev.bleId) html += 'BLE:' + dev.bleId.substring(0, 8) + '... ';
            if (dev.latency) html += '(' + dev.latency + ')';
            html += '</td>';
            html += '<td style="color:' + statusColor + '">' + h(dev.status) + '</td>';
            html += '<td style="text-align:center">';
            if (dev.erpcSignature) {
                html += '<span style="color:var(--color-running);font-weight:700">&#10003; ERPC</span>';
            } else {
                html += '<span style="color:var(--text-muted)">-</span>';
            }
            html += '</td>';
            html += '<td style="font-size:10px;color:var(--text-muted)">' + h(dev.discoveredAt || '') + '</td>';
            html += '<td>';
            if (dev.canConnect && dev.channel === 'WebSerial') {
                html += '<button class="filter-btn" onclick="ISA.App.connectScannedDevice(\'' + h(dev.id) + '\')" style="font-size:10px;padding:2px 8px">Connect</button>';
            } else if (dev.canConnect && dev.channel === 'Network' && dev.host) {
                html += '<button class="filter-btn" onclick="ISA.App.connectNetworkDevice(\'' + h(dev.host) + '\',' + (dev.port||80) + ',' + (dev.telemPort||8767) + ')" style="font-size:10px;padding:2px 8px">' + (dev.erpcSignature ? 'Connect ERPC' : 'Probe') + '</button>';
            }
            html += '</td>';
            html += '</tr>';
            // If ERPC device with node info, show detail row
            if (dev.erpcSignature && dev.nodeInfo) {
                var ni = dev.nodeInfo;
                html += '<tr><td></td><td colspan="7" style="padding:4px 10px 8px;font-size:10px">';
                html += '<div style="display:flex;gap:16px;flex-wrap:wrap;color:var(--text-secondary)">';
                if (ni.node) html += '<span>Node: <strong style="color:var(--color-accent)">' + h(ni.node) + '</strong></span>';
                if (ni.axis) html += '<span>Axis: <strong>' + h(ni.axis) + '</strong></span>';
                if (ni.erpcMode) html += '<span>ERPC: <strong style="color:' + (ni.erpcMode === 'ALLOW' ? 'var(--color-running)' : 'var(--color-warning)') + '">' + h(ni.erpcMode) + '</strong></span>';
                if (ni.buffer) html += '<span>Buffer: <strong>' + h(ni.buffer) + '</strong></span>';
                if (ni.telemPort) html += '<span>Telem: <strong>:' + ni.telemPort + '</strong></span>';
                if (ni.formFields) html += '<span>' + ni.formFields + ' config fields</span>';
                if (dev.pageSize) html += '<span>' + dev.pageSize + ' bytes</span>';
                if (dev.matchedSignatures && dev.matchedSignatures.length > 0) {
                    html += '<span>Signatures: ' + dev.matchedSignatures.map(function(s){return '<em>'+h(s)+'</em>';}).join(', ') + '</span>';
                }
                html += '</div></td></tr>';
            }
        });
        html += '</tbody></table></div>';
    }
    html += '</div>';

    // Scan log
    html += '<div class="section"><div class="section-title">Scan Log <span class="section-badge">' + scanner.scanLog.length + ' entries</span></div>';
    html += '<div class="card scroll-container" style="max-height:250px;padding:0;font-family:var(--font-mono);font-size:11px">';
    if (scanner.scanLog.length === 0) {
        html += '<div style="padding:16px;color:var(--text-muted);text-align:center">No scan activity yet</div>';
    }
    scanner.scanLog.forEach(function(entry) {
        var color = entry.level === 'success' ? 'var(--color-running)' :
                    entry.level === 'warn' ? 'var(--color-warning)' :
                    entry.level === 'error' ? 'var(--color-alarm)' : 'var(--text-secondary)';
        var prefix = entry.level === 'success' ? '[+]' : entry.level === 'warn' ? '[!]' : entry.level === 'error' ? '[x]' : '[-]';
        html += '<div style="padding:3px 10px;border-bottom:1px solid var(--border);display:flex;gap:8px">';
        html += '<span style="color:var(--text-muted);min-width:60px">' + h(entry.time) + '</span>';
        html += '<span style="color:var(--color-accent);min-width:60px;font-weight:600">' + h(entry.channel) + '</span>';
        html += '<span style="color:' + color + '">' + prefix + ' ' + h(entry.message) + '</span>';
        html += '</div>';
    });
    html += '</div></div>';

    // How it works
    html += '<div class="section"><div class="section-title">How Device Discovery Works</div>';
    html += '<div class="card-grid cols-3">';
    var howItWorks = [
        { ch: 'WebSerial', desc: 'Enumerates USB serial ports paired with the browser. Opens port at 115200 baud, sends "?" command, reads response looking for ERPC signature strings like "Entropy-Regulated Power Control" or "GEP Algorithm".', req: 'Chrome/Edge, HTTPS' },
        { ch: 'WebUSB', desc: 'Queries USB devices authorized by the user. Matches vendor/product IDs against known Arduino, ESP32, CH340, FTDI, and CP210x chips. Can authorize new devices through the browser picker.', req: 'Chrome/Edge, HTTPS' },
        { ch: 'Bluetooth LE', desc: 'Scans for BLE devices and checks for ERPC custom service UUID. Reads device information service for manufacturer and firmware details. Can connect to HM-10, BT05, or ESP32 BLE modules.', req: 'Chrome/Edge, HTTPS' },
        { ch: 'MQTT/WS', desc: 'Connects to an MQTT broker over WebSocket and subscribes to erpc/discovery/# topic. Devices announce themselves with JSON payloads containing deviceId, name, type, and topic info.', req: 'Any browser' },
        { ch: 'Network Probe', desc: 'Sends fetch requests to common local IP addresses and mDNS hostnames (erpc.local, arduino.local, esp32.local). Uses timing to detect responding hosts. Can scan custom IP ranges.', req: 'Any browser' },
        { ch: 'Web NFC', desc: 'Reads NFC tags containing ERPC configuration data. Tags can store device IDs, WiFi credentials, MQTT broker URLs, or calibration data. Tap tag to phone to read.', req: 'Chrome Android' }
    ];
    howItWorks.forEach(function(item) {
        html += '<div class="card">';
        html += '<div class="card-title" style="margin-bottom:4px;color:var(--color-accent)">' + h(item.ch) + '</div>';
        html += '<div class="card-body">' + h(item.desc) + '</div>';
        html += '<div style="margin-top:6px;font-size:10px;color:var(--text-muted)">Requires: ' + h(item.req) + '</div>';
        html += '</div>';
    });
    html += '</div></div>';

    return html;
};

// Scanner action handlers
ISA.App.runScanAll = async function() {
    await ISA.Scanner.scanAll();
    ISA.App.navigate('device-scanner');
};
ISA.App.runScanSerial = async function() {
    await ISA.Scanner.requestSerialPort();
    ISA.App.navigate('device-scanner');
};
ISA.App.runScanUSB = async function() {
    await ISA.Scanner.requestUSBDevice();
    ISA.App.navigate('device-scanner');
};
ISA.App.runScanBLE = async function() {
    await ISA.Scanner.scanBLE();
    ISA.App.navigate('device-scanner');
};
ISA.App.runScanMQTT = function() {
    var broker = prompt('MQTT Broker WebSocket URL:', 'wss://broker.hivemq.com:8884/mqtt');
    if (broker) {
        ISA.Scanner.scanMQTT(broker, 'erpc/discovery/#');
        setTimeout(function() { ISA.App.navigate('device-scanner'); }, 1000);
    }
};
ISA.App.runScanRange = function() {
    var base = prompt('Base IP (e.g., 192.168.1):', '192.168.1');
    if (!base) return;
    var start = parseInt(prompt('Start host number:', '1'), 10);
    var end = parseInt(prompt('End host number:', '20'), 10);
    if (isNaN(start) || isNaN(end)) return;
    ISA.Scanner.scanRange(base, start, end, 80).then(function() {
        ISA.App.navigate('device-scanner');
    });
};
ISA.App.connectScannedDevice = function(deviceId) {
    var device = ISA.Scanner.devices.find(function(d) { return d.id === deviceId; });
    if (!device || !device.port) return;
    // Hand off the port to the connector and navigate to ERPC Live
    ISA.Connector.port = device.port;
    ISA.Connector.connectSerial().then(function() {
        ISA.App.navigate('erpc-live');
    });
};
ISA.App.connectNetworkDevice = function(host, port, telemPort) {
    ISA.Connector.connectHTTP(host, { port: port, telemPort: telemPort });
    ISA.App.navigate('erpc-live');
};

console.log('[ISA] Screens loaded:', Object.keys(ISA.Screens).length, 'screens');
