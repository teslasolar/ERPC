/* ============================================================
   ISA Standards Explorer - Main Application Controller
   ERPC Industries | Built for Gary
   ============================================================ */

window.ISA = window.ISA || {};

// Preserve any functions already attached to ISA.App (from screens.js)
var _existingApp = ISA.App || {};

ISA.App = Object.assign({
    currentScreen: 'dashboard',
    updateTimer: null,

    init: function() {
        console.log('[APP] ISA Standards Explorer initializing...');
        this.setupNavigation();
        this.startClock();
        this.navigate('dashboard');
        ISA.Simulation.start();
        ISA.Simulation.onTick(this.onSimTick.bind(this));

        // Wire up ERPC connector for live screen updates
        this.setupConnector();

        console.log('[APP] Ready. Standards loaded. Gary, your system is online.');
    },

    // ── Navigation ─────────────────────────────────────────
    setupNavigation: function() {
        var self = this;
        var navItems = document.querySelectorAll('.nav-item[data-screen]');
        navItems.forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                self.navigate(item.getAttribute('data-screen'));
            });
        });
    },

    navigate: function(screenId) {
        this.currentScreen = screenId;

        // Update nav active state
        var navItems = document.querySelectorAll('.nav-item[data-screen]');
        navItems.forEach(function(item) {
            item.classList.toggle('active', item.getAttribute('data-screen') === screenId);
        });

        // Render screen
        this.renderScreen(screenId);

        // Scroll to top
        var main = document.getElementById('main-content');
        if (main) main.scrollTop = 0;
    },

    renderScreen: function(screenId) {
        var container = document.getElementById('screen-container');
        if (!container) return;

        var renderer = ISA.Screens[screenId];
        if (renderer) {
            container.innerHTML = renderer();
        } else {
            container.innerHTML = '<div class="screen-title">Screen Not Found</div><div class="screen-subtitle">Screen "' + screenId + '" is not available.</div>';
        }
    },

    // ── ERPC Connector ─────────────────────────────────────
    setupConnector: function() {
        var self = this;
        // Listen for connector data and refresh ERPC Live screen
        ISA.Connector.onData(function() {
            if (self.currentScreen === 'erpc-live') {
                // Throttle DOM updates to 5Hz for smooth canvas rendering
                if (self._lastERPCRender && Date.now() - self._lastERPCRender < 200) {
                    // Just redraw the canvases without full DOM re-render
                    if (self.drawERPCTrends) self.drawERPCTrends();
                    return;
                }
                self._lastERPCRender = Date.now();
                var main = document.getElementById('main-content');
                var scrollTop = main ? main.scrollTop : 0;
                self.renderScreen('erpc-live');
                if (main) main.scrollTop = scrollTop;
            }
        });

        // Update footer connection status
        ISA.Connector.onData(function(d) {
            var scanEl = document.getElementById('scan-rate');
            if (scanEl && ISA.Connector.connected && ISA.Connector.mode !== 'demo') {
                scanEl.textContent = ISA.Connector.mode.toUpperCase() + ' LIVE';
                scanEl.style.color = 'var(--color-running)';
            }
        });
    },

    // ── Simulation tick handler ────────────────────────────
    onSimTick: function() {
        this.updateAlarmCounts();
        this.updateLiveElements();
    },

    updateAlarmCounts: function() {
        var alarms = ISA.Alarms.activeAlarms;
        var counts = { emergency: 0, high: 0, medium: 0, low: 0 };
        alarms.forEach(function(a) {
            var p = a.priority.toLowerCase();
            if (counts[p] !== undefined) counts[p]++;
        });

        var emEl = document.getElementById('alarm-count-emergency');
        var hiEl = document.getElementById('alarm-count-high');
        var mdEl = document.getElementById('alarm-count-medium');
        var loEl = document.getElementById('alarm-count-low');
        if (emEl) emEl.textContent = counts.emergency;
        if (hiEl) hiEl.textContent = counts.high;
        if (mdEl) mdEl.textContent = counts.medium;
        if (loEl) loEl.textContent = counts.low;

        // System status
        var statusText = document.getElementById('system-status-text');
        var statusDot = document.querySelector('.system-status .status-indicator');
        if (statusText && statusDot) {
            if (counts.emergency > 0) {
                statusText.textContent = 'EMERGENCY ALARM';
                statusText.style.color = 'var(--alarm-emergency)';
                statusDot.className = 'status-indicator alarm';
            } else if (counts.high > 0) {
                statusText.textContent = 'ALARM ACTIVE';
                statusText.style.color = 'var(--alarm-high)';
                statusDot.className = 'status-indicator alarm';
            } else if (counts.medium > 0) {
                statusText.textContent = 'WARNING';
                statusText.style.color = 'var(--alarm-medium)';
                statusDot.className = 'status-indicator running';
            } else {
                statusText.textContent = 'SYSTEM ONLINE';
                statusText.style.color = 'var(--color-running)';
                statusDot.className = 'status-indicator running';
            }
        }
    },

    updateLiveElements: function() {
        // Re-render the current screen for live updates
        // Throttle to every 2 seconds to avoid layout thrash
        if (this._lastRender && Date.now() - this._lastRender < 2000) return;
        this._lastRender = Date.now();

        // Only re-render screens that have live data
        var liveScreens = ['dashboard', 'tag-browser', 'process-overview', 'isa182'];
        if (liveScreens.indexOf(this.currentScreen) >= 0) {
            // Save scroll position
            var main = document.getElementById('main-content');
            var scrollTop = main ? main.scrollTop : 0;
            this.renderScreen(this.currentScreen);
            if (main) main.scrollTop = scrollTop;
        }
    },

    // ── Clock ──────────────────────────────────────────────
    startClock: function() {
        function updateClock() {
            var now = new Date();
            var dateEl = document.getElementById('header-date');
            var timeEl = document.getElementById('header-time');
            if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
        }
        updateClock();
        setInterval(updateClock, 1000);
    }
}, _existingApp);

// ── Boot ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    ISA.App.init();
});
