/* ============================================================
   ISA Standards - User Defined Types (UDTs)
   Covers: ISA-95, ISA-88, ISA-101, ISA-18.2, ISA-5.1
   ERPC Industries | Built for Gary
   ============================================================ */

window.ISA = window.ISA || {};

// ────────────────────────────────────────────────────────────
// UDT Definition Helper
// ────────────────────────────────────────────────────────────
ISA.UDT = {
    definitions: {},

    define: function(name, standard, description, members) {
        this.definitions[name] = {
            name: name,
            standard: standard,
            description: description,
            members: members,
            created: new Date().toISOString()
        };
        return this.definitions[name];
    },

    get: function(name) { return this.definitions[name]; },

    getByStandard: function(standard) {
        return Object.values(this.definitions).filter(function(u) { return u.standard === standard; });
    },

    getAll: function() { return Object.values(this.definitions); },

    createInstance: function(udtName, values) {
        var udt = this.definitions[udtName];
        if (!udt) return null;
        var instance = { _udtType: udtName, _standard: udt.standard };
        udt.members.forEach(function(m) {
            instance[m.name] = (values && values[m.name] !== undefined) ? values[m.name] : m.defaultValue;
        });
        return instance;
    }
};

// ============================================================
// ISA-95: Enterprise-Control System Integration
// ============================================================

ISA.UDT.define('ISA95_Enterprise', 'ISA-95',
    'Top level of the role-based equipment hierarchy. Represents the entire organization.',
    [
        { name: 'EnterpriseID',   type: 'STRING',   description: 'Unique enterprise identifier',         defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Enterprise description',                defaultValue: '' },
        { name: 'Location',       type: 'STRING',   description: 'Geographic location',                   defaultValue: '' },
        { name: 'Sites',          type: 'STRING[]',  description: 'List of site IDs',                     defaultValue: [] },
        { name: 'Status',         type: 'ENUM',     description: 'Operational status',                    defaultValue: 'Active' }
    ]
);

ISA.UDT.define('ISA95_Site', 'ISA-95',
    'Physical or logical grouping within an enterprise. Typically a plant or factory.',
    [
        { name: 'SiteID',         type: 'STRING',   description: 'Unique site identifier',                defaultValue: '' },
        { name: 'EnterpriseID',   type: 'STRING',   description: 'Parent enterprise ID',                  defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Site description',                      defaultValue: '' },
        { name: 'Location',       type: 'STRING',   description: 'Physical address',                      defaultValue: '' },
        { name: 'Areas',          type: 'STRING[]',  description: 'List of area IDs',                     defaultValue: [] },
        { name: 'Status',         type: 'ENUM',     description: 'Operational status',                    defaultValue: 'Active' },
        { name: 'Timezone',       type: 'STRING',   description: 'Site timezone',                          defaultValue: 'UTC' }
    ]
);

ISA.UDT.define('ISA95_Area', 'ISA-95',
    'Physical, geographical, or logical grouping within a site for production.',
    [
        { name: 'AreaID',         type: 'STRING',   description: 'Unique area identifier',                defaultValue: '' },
        { name: 'SiteID',         type: 'STRING',   description: 'Parent site ID',                        defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Area description',                      defaultValue: '' },
        { name: 'WorkCenters',    type: 'STRING[]',  description: 'List of work center IDs',              defaultValue: [] },
        { name: 'AreaType',       type: 'ENUM',     description: 'Production/Storage/Utility',            defaultValue: 'Production' },
        { name: 'Status',         type: 'ENUM',     description: 'Operational status',                    defaultValue: 'Active' }
    ]
);

ISA.UDT.define('ISA95_WorkCenter', 'ISA-95',
    'Equipment grouped for production. Contains work units (ISA-95 Level 3).',
    [
        { name: 'WorkCenterID',   type: 'STRING',   description: 'Unique work center identifier',         defaultValue: '' },
        { name: 'AreaID',         type: 'STRING',   description: 'Parent area ID',                        defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Work center description',               defaultValue: '' },
        { name: 'WorkCenterType', type: 'ENUM',     description: 'Continuous/Batch/Discrete/Storage',     defaultValue: 'Batch' },
        { name: 'WorkUnits',      type: 'STRING[]',  description: 'List of work unit IDs',                defaultValue: [] },
        { name: 'Capacity',       type: 'REAL',     description: 'Production capacity',                   defaultValue: 0 },
        { name: 'CapacityUOM',    type: 'STRING',   description: 'Capacity unit of measure',              defaultValue: 'units/hr' },
        { name: 'Status',         type: 'ENUM',     description: 'Operational status',                    defaultValue: 'Idle' }
    ]
);

ISA.UDT.define('ISA95_WorkUnit', 'ISA-95',
    'Smallest element of work center. Maps to ISA-88 Process Cell or Production Unit.',
    [
        { name: 'WorkUnitID',     type: 'STRING',   description: 'Unique work unit identifier',            defaultValue: '' },
        { name: 'WorkCenterID',   type: 'STRING',   description: 'Parent work center ID',                 defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Work unit description',                 defaultValue: '' },
        { name: 'Equipment',      type: 'STRING[]',  description: 'List of equipment IDs',                defaultValue: [] },
        { name: 'OperationalStatus', type: 'ENUM',  description: 'Running/Idle/Maintenance/Fault',        defaultValue: 'Idle' },
        { name: 'CurrentProduct', type: 'STRING',   description: 'Current product being produced',        defaultValue: '' },
        { name: 'CurrentBatch',   type: 'STRING',   description: 'Current batch ID',                      defaultValue: '' }
    ]
);

ISA.UDT.define('ISA95_MaterialDefinition', 'ISA-95',
    'Definition of a material including properties and quality specifications.',
    [
        { name: 'MaterialDefID',  type: 'STRING',   description: 'Unique material definition ID',         defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Material description',                  defaultValue: '' },
        { name: 'MaterialClass',  type: 'STRING',   description: 'Classification category',               defaultValue: '' },
        { name: 'UnitOfMeasure',  type: 'STRING',   description: 'Primary UOM',                           defaultValue: '' },
        { name: 'Properties',     type: 'STRUCT[]', description: 'Material properties list',              defaultValue: [] },
        { name: 'StorageRequirements', type: 'STRING', description: 'Storage conditions',                 defaultValue: '' },
        { name: 'HazardClass',    type: 'STRING',   description: 'Hazard classification',                 defaultValue: 'None' },
        { name: 'ShelfLife',      type: 'INT',      description: 'Shelf life in days',                    defaultValue: 0 }
    ]
);

ISA.UDT.define('ISA95_MaterialLot', 'ISA-95',
    'Specific instance of a material with lot tracking and quality status.',
    [
        { name: 'LotID',          type: 'STRING',   description: 'Unique lot identifier',                 defaultValue: '' },
        { name: 'MaterialDefID',  type: 'STRING',   description: 'Reference to material definition',      defaultValue: '' },
        { name: 'Quantity',       type: 'REAL',     description: 'Current quantity',                      defaultValue: 0 },
        { name: 'UnitOfMeasure',  type: 'STRING',   description: 'Quantity UOM',                          defaultValue: '' },
        { name: 'QualityStatus',  type: 'ENUM',     description: 'Released/Quarantine/Rejected/Pending',  defaultValue: 'Pending' },
        { name: 'StorageLocation',type: 'STRING',   description: 'Current storage location',              defaultValue: '' },
        { name: 'ManufactureDate',type: 'DATETIME', description: 'Date of manufacture',                   defaultValue: '' },
        { name: 'ExpirationDate', type: 'DATETIME', description: 'Expiration date',                       defaultValue: '' },
        { name: 'SupplierID',     type: 'STRING',   description: 'Supplier identifier',                   defaultValue: '' }
    ]
);

ISA.UDT.define('ISA95_PersonnelClass', 'ISA-95',
    'Classification of personnel with qualifications and capabilities.',
    [
        { name: 'PersonnelClassID', type: 'STRING', description: 'Unique personnel class ID',             defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Class description',                     defaultValue: '' },
        { name: 'Qualifications', type: 'STRING[]', description: 'Required qualifications',               defaultValue: [] },
        { name: 'TrainingReqs',   type: 'STRING[]', description: 'Training requirements',                 defaultValue: [] },
        { name: 'CertificationExpiry', type: 'INT', description: 'Cert renewal period (days)',            defaultValue: 365 },
        { name: 'SecurityLevel',  type: 'INT',      description: 'Access security level (1-5)',           defaultValue: 1 }
    ]
);

ISA.UDT.define('ISA95_OperationsDefinition', 'ISA-95',
    'Definition of an operations activity that can be scheduled and tracked.',
    [
        { name: 'OperationsDefID', type: 'STRING',  description: 'Unique operations definition ID',       defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Operations description',                defaultValue: '' },
        { name: 'OperationsType', type: 'ENUM',     description: 'Production/Maintenance/Quality/Inventory', defaultValue: 'Production' },
        { name: 'Duration',       type: 'REAL',     description: 'Expected duration (minutes)',            defaultValue: 0 },
        { name: 'MaterialReqs',   type: 'STRUCT[]', description: 'Material requirements',                 defaultValue: [] },
        { name: 'PersonnelReqs',  type: 'STRUCT[]', description: 'Personnel requirements',                defaultValue: [] },
        { name: 'EquipmentReqs',  type: 'STRING[]', description: 'Equipment requirements',                defaultValue: [] },
        { name: 'Segments',       type: 'STRING[]', description: 'Process segment IDs',                   defaultValue: [] }
    ]
);

ISA.UDT.define('ISA95_OperationsSchedule', 'ISA-95',
    'Schedule of operations requests with timing and resource allocation.',
    [
        { name: 'ScheduleID',     type: 'STRING',   description: 'Unique schedule identifier',            defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Schedule description',                  defaultValue: '' },
        { name: 'StartTime',      type: 'DATETIME', description: 'Scheduled start time',                  defaultValue: '' },
        { name: 'EndTime',        type: 'DATETIME', description: 'Scheduled end time',                    defaultValue: '' },
        { name: 'Priority',       type: 'INT',      description: 'Schedule priority (1=highest)',         defaultValue: 5 },
        { name: 'Status',         type: 'ENUM',     description: 'Planned/Released/Running/Complete',     defaultValue: 'Planned' },
        { name: 'Requests',       type: 'STRUCT[]', description: 'List of operations requests',           defaultValue: [] }
    ]
);

ISA.UDT.define('ISA95_ProductDefinition', 'ISA-95',
    'Definition of a product with bill of materials and bill of resources.',
    [
        { name: 'ProductDefID',   type: 'STRING',   description: 'Unique product definition ID',          defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Product description',                   defaultValue: '' },
        { name: 'ProductClass',   type: 'STRING',   description: 'Product classification',                defaultValue: '' },
        { name: 'Version',        type: 'STRING',   description: 'Product version/revision',              defaultValue: '1.0' },
        { name: 'BillOfMaterials',type: 'STRUCT[]', description: 'Required materials',                    defaultValue: [] },
        { name: 'BillOfResources',type: 'STRUCT[]', description: 'Required resources',                    defaultValue: [] },
        { name: 'QualitySpecs',   type: 'STRUCT[]', description: 'Quality specifications',                defaultValue: [] },
        { name: 'UnitOfMeasure',  type: 'STRING',   description: 'Product UOM',                           defaultValue: '' }
    ]
);

// ============================================================
// ISA-88: Batch Control
// ============================================================

ISA.UDT.define('ISA88_ProcessCell', 'ISA-88',
    'Top of ISA-88 physical model. Contains units, equipment modules, and control modules.',
    [
        { name: 'ProcessCellID',  type: 'STRING',   description: 'Unique process cell identifier',        defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Process cell description',              defaultValue: '' },
        { name: 'Units',          type: 'STRING[]', description: 'List of unit IDs',                      defaultValue: [] },
        { name: 'State',          type: 'ENUM',     description: 'Current state per S88 state model',     defaultValue: 'Idle' },
        { name: 'Mode',           type: 'ENUM',     description: 'Automatic/Semi-Auto/Manual',            defaultValue: 'Automatic' },
        { name: 'ActiveRecipe',   type: 'STRING',   description: 'Currently active recipe ID',            defaultValue: '' },
        { name: 'ActiveBatch',    type: 'STRING',   description: 'Currently active batch ID',             defaultValue: '' }
    ]
);

ISA.UDT.define('ISA88_Unit', 'ISA-88',
    'A major processing entity within a process cell. Operates on one batch at a time.',
    [
        { name: 'UnitID',         type: 'STRING',   description: 'Unique unit identifier',                defaultValue: '' },
        { name: 'ProcessCellID',  type: 'STRING',   description: 'Parent process cell ID',                defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Unit description',                      defaultValue: '' },
        { name: 'EquipmentModules', type: 'STRING[]', description: 'List of equipment module IDs',        defaultValue: [] },
        { name: 'ControlModules', type: 'STRING[]', description: 'List of control module IDs',            defaultValue: [] },
        { name: 'State',          type: 'ENUM',     description: 'Current state per S88 state model',     defaultValue: 'Idle' },
        { name: 'Mode',           type: 'ENUM',     description: 'Automatic/Semi-Auto/Manual',            defaultValue: 'Automatic' },
        { name: 'ActivePhase',    type: 'STRING',   description: 'Currently executing phase',             defaultValue: '' }
    ]
);

ISA.UDT.define('ISA88_EquipmentModule', 'ISA-88',
    'A functional group of equipment that performs a specific minor processing activity.',
    [
        { name: 'EquipModuleID',  type: 'STRING',   description: 'Unique equipment module identifier',    defaultValue: '' },
        { name: 'UnitID',         type: 'STRING',   description: 'Parent unit ID',                        defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Equipment module description',          defaultValue: '' },
        { name: 'ModuleType',     type: 'ENUM',     description: 'Valve/Pump/Agitator/Heater/Sensor',    defaultValue: '' },
        { name: 'ControlModules', type: 'STRING[]', description: 'List of control module IDs',            defaultValue: [] },
        { name: 'State',          type: 'ENUM',     description: 'Current state',                         defaultValue: 'Idle' },
        { name: 'Mode',           type: 'ENUM',     description: 'Auto/Manual',                           defaultValue: 'Auto' }
    ]
);

ISA.UDT.define('ISA88_ControlModule', 'ISA-88',
    'Lowest level of equipment. Directly manipulates process equipment (valves, motors, etc.).',
    [
        { name: 'ControlModuleID', type: 'STRING',  description: 'Unique control module identifier',      defaultValue: '' },
        { name: 'ParentID',       type: 'STRING',   description: 'Parent unit or equipment module ID',    defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Control module description',            defaultValue: '' },
        { name: 'ModuleType',     type: 'ENUM',     description: 'AI/AO/DI/DO/PID/OnOff',               defaultValue: '' },
        { name: 'State',          type: 'ENUM',     description: 'Current state',                         defaultValue: 'Idle' },
        { name: 'Mode',           type: 'ENUM',     description: 'Auto/Manual/Cascade/Override',          defaultValue: 'Auto' },
        { name: 'ProcessValue',   type: 'REAL',     description: 'Current process value',                 defaultValue: 0 },
        { name: 'Setpoint',       type: 'REAL',     description: 'Control setpoint',                      defaultValue: 0 },
        { name: 'Output',         type: 'REAL',     description: 'Control output (%)',                    defaultValue: 0 },
        { name: 'EngUnits',       type: 'STRING',   description: 'Engineering units',                     defaultValue: '' },
        { name: 'RangeLow',      type: 'REAL',     description: 'Low range',                              defaultValue: 0 },
        { name: 'RangeHigh',     type: 'REAL',     description: 'High range',                             defaultValue: 100 }
    ]
);

ISA.UDT.define('ISA88_Phase', 'ISA-88',
    'Smallest element of procedural control. Executes equipment-specific actions.',
    [
        { name: 'PhaseID',        type: 'STRING',   description: 'Unique phase identifier',               defaultValue: '' },
        { name: 'PhaseName',      type: 'STRING',   description: 'Phase name',                            defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Phase description',                     defaultValue: '' },
        { name: 'UnitID',         type: 'STRING',   description: 'Assigned unit',                         defaultValue: '' },
        { name: 'State',          type: 'ENUM',     description: 'Idle/Running/Complete/Held/Stopped/Aborted', defaultValue: 'Idle' },
        { name: 'Parameters',     type: 'STRUCT[]', description: 'Phase parameters',                      defaultValue: [] },
        { name: 'StepIndex',      type: 'INT',      description: 'Current step within phase',             defaultValue: 0 },
        { name: 'StartTime',      type: 'DATETIME', description: 'Phase start time',                      defaultValue: '' },
        { name: 'ElapsedTime',    type: 'REAL',     description: 'Elapsed time (seconds)',                 defaultValue: 0 }
    ]
);

ISA.UDT.define('ISA88_Recipe', 'ISA-88',
    'Recipe definition following the ISA-88 recipe model hierarchy.',
    [
        { name: 'RecipeID',       type: 'STRING',   description: 'Unique recipe identifier',              defaultValue: '' },
        { name: 'RecipeName',     type: 'STRING',   description: 'Recipe name',                           defaultValue: '' },
        { name: 'RecipeType',     type: 'ENUM',     description: 'General/Site/Master/Control',           defaultValue: 'Master' },
        { name: 'Version',        type: 'STRING',   description: 'Recipe version',                        defaultValue: '1.0' },
        { name: 'ProductID',      type: 'STRING',   description: 'Product being produced',                defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Recipe description',                    defaultValue: '' },
        { name: 'Header',         type: 'STRUCT',   description: 'Recipe header information',             defaultValue: {} },
        { name: 'Formula',        type: 'STRUCT[]', description: 'Formula (materials and amounts)',        defaultValue: [] },
        { name: 'Procedure',      type: 'STRUCT[]', description: 'Procedural steps',                      defaultValue: [] },
        { name: 'EquipmentReqs',  type: 'STRING[]', description: 'Equipment requirements',                defaultValue: [] },
        { name: 'ApprovedBy',     type: 'STRING',   description: 'Approval authority',                    defaultValue: '' },
        { name: 'ApprovedDate',   type: 'DATETIME', description: 'Approval date',                         defaultValue: '' },
        { name: 'Status',         type: 'ENUM',     description: 'Draft/Approved/Obsolete',               defaultValue: 'Draft' }
    ]
);

ISA.UDT.define('ISA88_Batch', 'ISA-88',
    'A batch instance tracking production from start to finish.',
    [
        { name: 'BatchID',        type: 'STRING',   description: 'Unique batch identifier',               defaultValue: '' },
        { name: 'RecipeID',       type: 'STRING',   description: 'Recipe used for this batch',            defaultValue: '' },
        { name: 'ProductID',      type: 'STRING',   description: 'Product being produced',                defaultValue: '' },
        { name: 'State',          type: 'ENUM',     description: 'Current batch state',                   defaultValue: 'Idle' },
        { name: 'UnitID',         type: 'STRING',   description: 'Assigned unit',                         defaultValue: '' },
        { name: 'StartTime',      type: 'DATETIME', description: 'Batch start time',                      defaultValue: '' },
        { name: 'EndTime',        type: 'DATETIME', description: 'Batch end time',                        defaultValue: '' },
        { name: 'CurrentPhase',   type: 'STRING',   description: 'Currently executing phase',             defaultValue: '' },
        { name: 'PhaseStep',      type: 'INT',      description: 'Current step in procedure',             defaultValue: 0 },
        { name: 'BatchSize',      type: 'REAL',     description: 'Target batch size',                     defaultValue: 0 },
        { name: 'ActualSize',     type: 'REAL',     description: 'Actual produced quantity',              defaultValue: 0 },
        { name: 'QualityStatus',  type: 'ENUM',     description: 'Pass/Fail/Pending',                    defaultValue: 'Pending' }
    ]
);

ISA.UDT.define('ISA88_StateMachine', 'ISA-88',
    'S88 State Machine model with all standard states and transitions.',
    [
        { name: 'CurrentState',   type: 'ENUM',     description: 'Current state',                         defaultValue: 'Idle' },
        { name: 'PreviousState',  type: 'ENUM',     description: 'Previous state',                        defaultValue: '' },
        { name: 'CommandRequested', type: 'ENUM',    description: 'Commanded transition',                  defaultValue: '' },
        { name: 'StartCmd',       type: 'BOOL',     description: 'Start command',                         defaultValue: false },
        { name: 'StopCmd',        type: 'BOOL',     description: 'Stop command',                          defaultValue: false },
        { name: 'HoldCmd',        type: 'BOOL',     description: 'Hold command',                          defaultValue: false },
        { name: 'RestartCmd',     type: 'BOOL',     description: 'Restart command',                       defaultValue: false },
        { name: 'AbortCmd',       type: 'BOOL',     description: 'Abort command',                         defaultValue: false },
        { name: 'ResetCmd',       type: 'BOOL',     description: 'Reset command',                         defaultValue: false },
        { name: 'PauseCmd',       type: 'BOOL',     description: 'Pause command',                         defaultValue: false },
        { name: 'ResumeCmd',      type: 'BOOL',     description: 'Resume command',                        defaultValue: false }
    ]
);

// ============================================================
// ISA-101: Human Machine Interfaces
// ============================================================

ISA.UDT.define('ISA101_DisplayHierarchy', 'ISA-101',
    'ISA-101 four-level HMI display hierarchy for situational awareness.',
    [
        { name: 'Level',          type: 'INT',      description: 'Display level (1-4)',                    defaultValue: 1 },
        { name: 'DisplayID',      type: 'STRING',   description: 'Unique display identifier',             defaultValue: '' },
        { name: 'DisplayName',    type: 'STRING',   description: 'Display name',                          defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Display purpose',                       defaultValue: '' },
        { name: 'ParentDisplay',  type: 'STRING',   description: 'Parent display ID for navigation',      defaultValue: '' },
        { name: 'ChildDisplays',  type: 'STRING[]', description: 'Child display IDs',                     defaultValue: [] },
        { name: 'SecurityLevel',  type: 'INT',      description: 'Required access level (1-5)',           defaultValue: 1 },
        { name: 'RefreshRate',    type: 'INT',      description: 'Display refresh rate (ms)',             defaultValue: 1000 }
    ]
);

ISA.UDT.define('ISA101_Faceplate', 'ISA-101',
    'Standard ISA-101 compliant faceplate for process variable display and control.',
    [
        { name: 'TagName',        type: 'STRING',   description: 'Associated tag name',                   defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Tag description',                       defaultValue: '' },
        { name: 'ProcessValue',   type: 'REAL',     description: 'Current process value',                 defaultValue: 0 },
        { name: 'Setpoint',       type: 'REAL',     description: 'Control setpoint',                      defaultValue: 0 },
        { name: 'Output',         type: 'REAL',     description: 'Control output (%)',                    defaultValue: 0 },
        { name: 'Mode',           type: 'ENUM',     description: 'Auto/Manual/Cascade',                   defaultValue: 'Auto' },
        { name: 'EngUnits',       type: 'STRING',   description: 'Engineering units',                     defaultValue: '' },
        { name: 'RangeLow',       type: 'REAL',     description: 'Display range low',                     defaultValue: 0 },
        { name: 'RangeHigh',      type: 'REAL',     description: 'Display range high',                    defaultValue: 100 },
        { name: 'AlarmHIHI',      type: 'REAL',     description: 'High-High alarm setpoint',              defaultValue: 90 },
        { name: 'AlarmHI',        type: 'REAL',     description: 'High alarm setpoint',                   defaultValue: 80 },
        { name: 'AlarmLO',        type: 'REAL',     description: 'Low alarm setpoint',                    defaultValue: 20 },
        { name: 'AlarmLOLO',      type: 'REAL',     description: 'Low-Low alarm setpoint',                defaultValue: 10 },
        { name: 'AlarmState',     type: 'ENUM',     description: 'Current alarm state',                   defaultValue: 'Normal' },
        { name: 'QualityGood',    type: 'BOOL',     description: 'Data quality flag',                     defaultValue: true }
    ]
);

ISA.UDT.define('ISA101_ColorStandard', 'ISA-101',
    'ISA-101 standardized color usage for consistent HMI design.',
    [
        { name: 'StateName',      type: 'STRING',   description: 'Process state name',                    defaultValue: '' },
        { name: 'PrimaryColor',   type: 'STRING',   description: 'Primary color hex',                     defaultValue: '#808080' },
        { name: 'TextColor',      type: 'STRING',   description: 'Text/foreground color',                 defaultValue: '#FFFFFF' },
        { name: 'Usage',          type: 'STRING',   description: 'When to use this color',                defaultValue: '' },
        { name: 'Blinking',       type: 'BOOL',     description: 'Whether element should blink',          defaultValue: false },
        { name: 'Category',       type: 'ENUM',     description: 'Equipment/Alarm/Navigation/Data',       defaultValue: 'Equipment' }
    ]
);

ISA.UDT.define('ISA101_NavigationObject', 'ISA-101',
    'Navigation element for structured HMI display navigation.',
    [
        { name: 'ObjectID',       type: 'STRING',   description: 'Unique navigation object ID',           defaultValue: '' },
        { name: 'Label',          type: 'STRING',   description: 'Display label',                         defaultValue: '' },
        { name: 'TargetDisplay',  type: 'STRING',   description: 'Target display ID',                     defaultValue: '' },
        { name: 'ObjectType',     type: 'ENUM',     description: 'Button/Link/Breadcrumb/Tab',           defaultValue: 'Button' },
        { name: 'SecurityLevel',  type: 'INT',      description: 'Required access level',                 defaultValue: 1 },
        { name: 'Visible',        type: 'BOOL',     description: 'Visibility flag',                       defaultValue: true },
        { name: 'Enabled',        type: 'BOOL',     description: 'Enabled flag',                          defaultValue: true }
    ]
);

ISA.UDT.define('ISA101_TrendConfig', 'ISA-101',
    'Configuration for ISA-101 compliant trend display.',
    [
        { name: 'TrendID',        type: 'STRING',   description: 'Unique trend identifier',               defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Trend description',                     defaultValue: '' },
        { name: 'Pens',           type: 'STRUCT[]', description: 'Trend pen configurations',              defaultValue: [] },
        { name: 'TimeSpan',       type: 'INT',      description: 'Time span in minutes',                  defaultValue: 60 },
        { name: 'AutoScale',      type: 'BOOL',     description: 'Auto-scale Y axis',                     defaultValue: false },
        { name: 'YMin',           type: 'REAL',     description: 'Y axis minimum',                        defaultValue: 0 },
        { name: 'YMax',           type: 'REAL',     description: 'Y axis maximum',                        defaultValue: 100 },
        { name: 'GridLines',      type: 'BOOL',     description: 'Show grid lines',                       defaultValue: true },
        { name: 'RefreshRate',    type: 'INT',      description: 'Refresh rate (ms)',                     defaultValue: 1000 }
    ]
);

// ============================================================
// ISA-18.2: Alarm Management
// ============================================================

ISA.UDT.define('ISA18_2_AlarmDefinition', 'ISA-18.2',
    'Complete alarm definition per ISA-18.2 lifecycle management.',
    [
        { name: 'AlarmID',        type: 'STRING',   description: 'Unique alarm identifier',               defaultValue: '' },
        { name: 'TagName',        type: 'STRING',   description: 'Associated process tag',                defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Alarm description',                     defaultValue: '' },
        { name: 'AlarmType',      type: 'ENUM',     description: 'HI/HIHI/LO/LOLO/DEV/ROC/DISC/STATE',  defaultValue: 'HI' },
        { name: 'Priority',       type: 'ENUM',     description: 'Emergency/High/Medium/Low/Diagnostic', defaultValue: 'Medium' },
        { name: 'Setpoint',       type: 'REAL',     description: 'Alarm trigger setpoint',                defaultValue: 0 },
        { name: 'Deadband',       type: 'REAL',     description: 'Alarm deadband',                        defaultValue: 0 },
        { name: 'OnDelay',        type: 'REAL',     description: 'On-delay time (seconds)',               defaultValue: 0 },
        { name: 'OffDelay',       type: 'REAL',     description: 'Off-delay time (seconds)',              defaultValue: 0 },
        { name: 'Enabled',        type: 'BOOL',     description: 'Alarm enabled flag',                    defaultValue: true },
        { name: 'Consequence',    type: 'STRING',   description: 'Consequence if not responded to',       defaultValue: '' },
        { name: 'CorrectiveAction', type: 'STRING', description: 'Recommended corrective action',         defaultValue: '' },
        { name: 'ResponseTime',   type: 'INT',      description: 'Required response time (minutes)',      defaultValue: 10 }
    ]
);

ISA.UDT.define('ISA18_2_AlarmState', 'ISA-18.2',
    'Runtime alarm state tracking per ISA-18.2 state model.',
    [
        { name: 'AlarmID',        type: 'STRING',   description: 'Reference to alarm definition',         defaultValue: '' },
        { name: 'CurrentState',   type: 'ENUM',     description: 'Normal/Active-Unack/Active-Ack/Clear-Unack/Shelved/Suppressed/OutOfService', defaultValue: 'Normal' },
        { name: 'IsActive',       type: 'BOOL',     description: 'Alarm condition is present',            defaultValue: false },
        { name: 'IsAcknowledged', type: 'BOOL',     description: 'Alarm has been acknowledged',           defaultValue: true },
        { name: 'ActivationTime', type: 'DATETIME', description: 'Time alarm became active',              defaultValue: '' },
        { name: 'AckTime',        type: 'DATETIME', description: 'Time alarm was acknowledged',           defaultValue: '' },
        { name: 'ClearTime',      type: 'DATETIME', description: 'Time alarm condition cleared',          defaultValue: '' },
        { name: 'AcknowledgedBy', type: 'STRING',   description: 'Operator who acknowledged',             defaultValue: '' },
        { name: 'CurrentValue',   type: 'REAL',     description: 'Current process value',                 defaultValue: 0 },
        { name: 'TripValue',      type: 'REAL',     description: 'Value when alarm tripped',              defaultValue: 0 }
    ]
);

ISA.UDT.define('ISA18_2_AlarmShelving', 'ISA-18.2',
    'Alarm shelving configuration per ISA-18.2 requirements.',
    [
        { name: 'AlarmID',        type: 'STRING',   description: 'Alarm being shelved',                   defaultValue: '' },
        { name: 'ShelvedBy',      type: 'STRING',   description: 'Operator who shelved',                  defaultValue: '' },
        { name: 'ShelveTime',     type: 'DATETIME', description: 'Time alarm was shelved',                defaultValue: '' },
        { name: 'Duration',       type: 'INT',      description: 'Shelf duration (minutes)',              defaultValue: 60 },
        { name: 'MaxDuration',    type: 'INT',      description: 'Maximum allowed shelf duration (min)',  defaultValue: 480 },
        { name: 'Reason',         type: 'STRING',   description: 'Reason for shelving',                   defaultValue: '' },
        { name: 'AutoUnshelve',   type: 'BOOL',     description: 'Auto-unshelve when expired',            defaultValue: true },
        { name: 'ReviewRequired', type: 'BOOL',     description: 'Requires review on unshelve',           defaultValue: true }
    ]
);

ISA.UDT.define('ISA18_2_AlarmClass', 'ISA-18.2',
    'Alarm classification for rationalization and prioritization.',
    [
        { name: 'ClassID',        type: 'STRING',   description: 'Alarm class identifier',                defaultValue: '' },
        { name: 'ClassName',      type: 'STRING',   description: 'Class name',                            defaultValue: '' },
        { name: 'Priority',       type: 'ENUM',     description: 'Default priority for this class',       defaultValue: 'Medium' },
        { name: 'ResponseTime',   type: 'INT',      description: 'Required response time (minutes)',      defaultValue: 10 },
        { name: 'Consequence',    type: 'STRING',   description: 'Potential consequence category',        defaultValue: '' },
        { name: 'SILRating',      type: 'INT',      description: 'Safety Integrity Level (0-4)',          defaultValue: 0 },
        { name: 'NotificationMethod', type: 'ENUM', description: 'Screen/Horn/Light/Page/All',           defaultValue: 'Screen' }
    ]
);

ISA.UDT.define('ISA18_2_AlarmRationalization', 'ISA-18.2',
    'Alarm rationalization record documenting the justification for each alarm.',
    [
        { name: 'AlarmID',        type: 'STRING',   description: 'Alarm being rationalized',              defaultValue: '' },
        { name: 'Cause',          type: 'STRING',   description: 'Root cause of alarm condition',         defaultValue: '' },
        { name: 'Consequence',    type: 'STRING',   description: 'Consequence if not addressed',          defaultValue: '' },
        { name: 'CorrectiveAction', type: 'STRING', description: 'Operator corrective action',            defaultValue: '' },
        { name: 'TimeToRespond',  type: 'INT',      description: 'Time available to respond (min)',       defaultValue: 10 },
        { name: 'AssignedPriority', type: 'ENUM',   description: 'Rationalized priority',                 defaultValue: 'Medium' },
        { name: 'ReviewedBy',     type: 'STRING',   description: 'Engineer who reviewed',                 defaultValue: '' },
        { name: 'ReviewDate',     type: 'DATETIME', description: 'Date of rationalization review',        defaultValue: '' },
        { name: 'Approved',       type: 'BOOL',     description: 'Approved by MOC process',               defaultValue: false }
    ]
);

// ============================================================
// ISA-5.1: Instrumentation Symbols and Identification
// ============================================================

ISA.UDT.define('ISA5_1_InstrumentTag', 'ISA-5.1',
    'ISA-5.1 compliant instrument tag identification structure.',
    [
        { name: 'TagNumber',      type: 'STRING',   description: 'Full tag number (e.g., TIC-101)',       defaultValue: '' },
        { name: 'FirstLetter',    type: 'CHAR',     description: 'Measured/initiating variable',          defaultValue: '' },
        { name: 'SucceedingLetters', type: 'STRING', description: 'Modifier and function letters',        defaultValue: '' },
        { name: 'LoopNumber',     type: 'INT',      description: 'Loop identification number',            defaultValue: 0 },
        { name: 'Suffix',         type: 'STRING',   description: 'Optional suffix (A, B, etc.)',          defaultValue: '' },
        { name: 'AreaPrefix',     type: 'STRING',   description: 'Area/unit prefix',                      defaultValue: '' },
        { name: 'Description',    type: 'STRING',   description: 'Tag description',                       defaultValue: '' },
        { name: 'Location',       type: 'ENUM',     description: 'Field/Panel/DCS/PLC/SharedDisplay',    defaultValue: 'Field' },
        { name: 'MountingType',   type: 'ENUM',     description: 'Local/Remote/Rack',                    defaultValue: 'Local' }
    ]
);

ISA.UDT.define('ISA5_1_LoopDiagram', 'ISA-5.1',
    'Instrument loop diagram definition connecting instruments in a control loop.',
    [
        { name: 'LoopNumber',     type: 'INT',      description: 'Loop identification number',            defaultValue: 0 },
        { name: 'LoopDescription',type: 'STRING',   description: 'Loop description',                      defaultValue: '' },
        { name: 'MeasuredVariable', type: 'ENUM',   description: 'Primary measured variable',             defaultValue: '' },
        { name: 'PrimaryElement', type: 'STRING',   description: 'Primary sensing element tag',           defaultValue: '' },
        { name: 'Transmitter',    type: 'STRING',   description: 'Transmitter tag',                       defaultValue: '' },
        { name: 'Controller',     type: 'STRING',   description: 'Controller tag',                        defaultValue: '' },
        { name: 'FinalElement',   type: 'STRING',   description: 'Final control element tag',             defaultValue: '' },
        { name: 'Indicators',     type: 'STRING[]', description: 'Indicator tags',                        defaultValue: [] },
        { name: 'Recorders',      type: 'STRING[]', description: 'Recorder tags',                         defaultValue: [] },
        { name: 'SignalType',     type: 'ENUM',     description: '4-20mA/0-10V/Digital/Fieldbus/HART',   defaultValue: '4-20mA' }
    ]
);

ISA.UDT.define('ISA5_1_PIDSymbol', 'ISA-5.1',
    'P&ID symbol definition for instrument representation on drawings.',
    [
        { name: 'SymbolType',     type: 'ENUM',     description: 'Circle/Square/Diamond/Hexagon/SharedDisplay', defaultValue: 'Circle' },
        { name: 'Location',       type: 'ENUM',     description: 'Field/ControlRoom/Auxiliary/DCS',      defaultValue: 'Field' },
        { name: 'TagNumber',      type: 'STRING',   description: 'Instrument tag number',                 defaultValue: '' },
        { name: 'HasHorizontalLine', type: 'BOOL',  description: 'Has horizontal line (panel-mounted)',   defaultValue: false },
        { name: 'HasDashedLine',  type: 'BOOL',     description: 'Has dashed line (behind panel)',        defaultValue: false },
        { name: 'IsSharedDisplay',type: 'BOOL',     description: 'Shared display/DCS symbol',            defaultValue: false },
        { name: 'BubbleSize',     type: 'ENUM',     description: 'Standard/Large/Small',                 defaultValue: 'Standard' }
    ]
);

// ============================================================
// ISA-5.1 Reference Data
// ============================================================

ISA.ISA51_FirstLetters = {
    A: { variable: 'Analysis',       modifier: 'Alarm' },
    B: { variable: 'Burner/Combustion', modifier: 'User Choice' },
    C: { variable: 'User Choice',    modifier: 'Control' },
    D: { variable: 'User Choice',    modifier: 'Differential' },
    E: { variable: 'Voltage',        modifier: 'Primary Element' },
    F: { variable: 'Flow Rate',      modifier: 'Ratio' },
    G: { variable: 'User Choice',    modifier: 'Glass/Gauge' },
    H: { variable: 'Hand',           modifier: 'High' },
    I: { variable: 'Current',        modifier: 'Indicate' },
    J: { variable: 'Power',          modifier: 'Scan' },
    K: { variable: 'Time/Schedule',  modifier: 'Control Station' },
    L: { variable: 'Level',          modifier: 'Light/Low' },
    M: { variable: 'User Choice',    modifier: 'Middle/Motor' },
    N: { variable: 'User Choice',    modifier: 'User Choice' },
    O: { variable: 'User Choice',    modifier: 'Orifice/Restrict' },
    P: { variable: 'Pressure',       modifier: 'Point/Test' },
    Q: { variable: 'Quantity',       modifier: 'Integrate/Total' },
    R: { variable: 'Radiation',      modifier: 'Record' },
    S: { variable: 'Speed/Frequency', modifier: 'Switch/Safety' },
    T: { variable: 'Temperature',    modifier: 'Transmit' },
    U: { variable: 'Multivariable',  modifier: 'Multifunction' },
    V: { variable: 'Vibration',      modifier: 'Valve/Damper' },
    W: { variable: 'Weight/Force',   modifier: 'Well/Probe' },
    X: { variable: 'Unclassified',   modifier: 'Unclassified' },
    Y: { variable: 'Event/State',    modifier: 'Relay/Compute' },
    Z: { variable: 'Position/Dimension', modifier: 'Driver/Actuator' }
};

ISA.ISA51_FunctionLetters = {
    A: 'Alarm',
    C: 'Controller',
    E: 'Primary Element / Sensor',
    G: 'Gauge / Glass',
    H: 'High',
    I: 'Indicator',
    K: 'Control Station',
    L: 'Low',
    R: 'Recorder',
    S: 'Switch',
    T: 'Transmitter',
    V: 'Valve / Damper / Louver',
    Y: 'Relay / Compute / Convert',
    Z: 'Driver / Actuator / Final Element'
};

// ISA-101 Standard Colors
ISA.ISA101_Colors = [
    { name: 'Running / On',       color: '#2EA043', textColor: '#fff', category: 'Equipment', usage: 'Equipment actively running' },
    { name: 'Stopped / Off',      color: '#8B949E', textColor: '#fff', category: 'Equipment', usage: 'Equipment stopped or off' },
    { name: 'Transition',         color: '#58A6FF', textColor: '#fff', category: 'Equipment', usage: 'Equipment in transition state' },
    { name: 'Fault / Failed',     color: '#DA3633', textColor: '#fff', category: 'Equipment', usage: 'Equipment fault or failure' },
    { name: 'Maintenance',        color: '#F0883E', textColor: '#fff', category: 'Equipment', usage: 'Equipment in maintenance mode' },
    { name: 'Out of Service',     color: '#6E7681', textColor: '#fff', category: 'Equipment', usage: 'Equipment out of service' },
    { name: 'Background',         color: '#1A1A2E', textColor: '#e6edf3', category: 'Display', usage: 'Display background (dark)' },
    { name: 'Normal Value',       color: '#E6EDF3', textColor: '#000', category: 'Data', usage: 'Normal process values' },
    { name: 'Abnormal Value',     color: '#D29922', textColor: '#000', category: 'Data', usage: 'Values outside normal range' },
    { name: 'Emergency Alarm',    color: '#FF0000', textColor: '#fff', category: 'Alarm', usage: 'Emergency priority alarms (blink)' },
    { name: 'High Alarm',         color: '#FF6600', textColor: '#fff', category: 'Alarm', usage: 'High priority alarms' },
    { name: 'Medium Alarm',       color: '#FFCC00', textColor: '#000', category: 'Alarm', usage: 'Medium priority alarms' },
    { name: 'Low Alarm',          color: '#3399FF', textColor: '#fff', category: 'Alarm', usage: 'Low priority alarms' },
    { name: 'Diagnostic',         color: '#8B949E', textColor: '#fff', category: 'Alarm', usage: 'Diagnostic messages' },
    { name: 'Pipe - Process',     color: '#388BFD', textColor: '#fff', category: 'Piping', usage: 'Process piping' },
    { name: 'Pipe - Utility',     color: '#6E7681', textColor: '#fff', category: 'Piping', usage: 'Utility piping' },
    { name: 'Pipe - Steam',       color: '#DA3633', textColor: '#fff', category: 'Piping', usage: 'Steam lines' },
    { name: 'Setpoint Line',      color: '#2EA043', textColor: '#fff', category: 'Trend', usage: 'Setpoint on trend displays' },
    { name: 'PV Line',            color: '#58A6FF', textColor: '#fff', category: 'Trend', usage: 'Process variable on trends' },
    { name: 'Output Line',        color: '#F0883E', textColor: '#fff', category: 'Trend', usage: 'Output on trend displays' }
];

// ISA-88 States reference
ISA.ISA88_States = [
    { name: 'Idle',      description: 'Not processing. Waiting for a start command.', color: '#8B949E', commands: ['Start'] },
    { name: 'Running',   description: 'Actively executing the procedure.', color: '#2EA043', commands: ['Hold', 'Stop', 'Abort', 'Pause'] },
    { name: 'Complete',  description: 'Procedure completed successfully.', color: '#388BFD', commands: ['Reset'] },
    { name: 'Pausing',   description: 'Transitioning to Paused state.', color: '#D29922', commands: [] },
    { name: 'Paused',    description: 'Procedure paused at operator request.', color: '#D29922', commands: ['Resume', 'Stop', 'Abort'] },
    { name: 'Holding',   description: 'Transitioning to Held state.', color: '#F0883E', commands: [] },
    { name: 'Held',      description: 'Process interrupted. Awaiting restart.', color: '#F0883E', commands: ['Restart', 'Stop', 'Abort'] },
    { name: 'Stopping',  description: 'Transitioning to Stopped state.', color: '#DA3633', commands: [] },
    { name: 'Stopped',   description: 'Procedure stopped. Safe shutdown completed.', color: '#DA3633', commands: ['Reset'] },
    { name: 'Aborting',  description: 'Emergency shutdown in progress.', color: '#FF0000', commands: [] },
    { name: 'Aborted',   description: 'Emergency shutdown complete.', color: '#FF0000', commands: ['Reset'] }
];

// ISA-95 Hierarchy Levels
ISA.ISA95_Levels = [
    { level: 4, name: 'Enterprise / Business', systems: 'ERP, MES Scheduling', description: 'Business planning & logistics. Establishes plant production schedule.' },
    { level: 3, name: 'Manufacturing Operations', systems: 'MES, LIMS, CMMS', description: 'Work flow, recipe management, maintenance management, quality assurance.' },
    { level: 2, name: 'Control Systems', systems: 'DCS, PLC, HMI/SCADA', description: 'Monitoring, supervisory control, and automated control of production.' },
    { level: 1, name: 'Sensing & Manipulation', systems: 'Sensors, Transmitters, Actuators', description: 'Sensing and manipulating the production process.' },
    { level: 0, name: 'Physical Process', systems: 'Process Equipment', description: 'The actual physical processes being controlled.' }
];

// ISA-18.2 Alarm State Model
ISA.ISA182_StateModel = [
    { from: 'Normal',        to: 'Active-Unack',  trigger: 'Alarm condition detected', auto: true },
    { from: 'Active-Unack',  to: 'Active-Ack',    trigger: 'Operator acknowledges alarm', auto: false },
    { from: 'Active-Ack',    to: 'Normal',         trigger: 'Alarm condition clears', auto: true },
    { from: 'Active-Unack',  to: 'Clear-Unack',   trigger: 'Alarm condition clears before ack', auto: true },
    { from: 'Clear-Unack',   to: 'Normal',         trigger: 'Operator acknowledges cleared alarm', auto: false },
    { from: 'Any',           to: 'Shelved',        trigger: 'Operator shelves alarm (timed)', auto: false },
    { from: 'Shelved',       to: 'Previous',       trigger: 'Shelf timer expires or manual unshelve', auto: true },
    { from: 'Any',           to: 'Out-of-Service', trigger: 'Maintenance takes alarm OOS', auto: false },
    { from: 'Out-of-Service',to: 'Normal',         trigger: 'Returned to service', auto: false },
    { from: 'Any',           to: 'Suppressed',     trigger: 'Suppressed by design (conditional)', auto: true },
    { from: 'Suppressed',    to: 'Previous',       trigger: 'Suppression condition removed', auto: true }
];

console.log('[ISA] UDTs loaded:', Object.keys(ISA.UDT.definitions).length, 'definitions across 5 standards');
