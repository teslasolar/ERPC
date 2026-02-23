/* ============================================================
   ERPC Live Data Connector
   Bridges real hardware to the ISA Standards Explorer app

   Supports:
   1. WebSerial API  - Direct USB to Arduino (Chrome/Edge)
   2. MQTT/WebSocket - Remote sensor via MQTT broker
   3. Demo Mode      - Simulated GEP data for offline use

   Serial Protocol: 115200 baud, parses Gary's debug format:
   "Samples: N | Vout: V.VVVV | Iload: I.IIIA | E: ... | A: ... | ∇S: ... | Corr: ... | ΔS: ... | Gate: ON/OFF | PWM: N"

   ERPC Industries | Built for Gary
   ============================================================ */

window.ISA = window.ISA || {};

ISA.Connector = {
    // ── State ──────────────────────────────────────────────
    mode: 'demo',          // 'serial' | 'mqtt' | 'demo'
    connected: false,
    port: null,             // WebSerial port object
    reader: null,           // ReadableStream reader
    readBuffer: '',         // Partial line buffer
    mqttClient: null,
    listeners: [],

    // ── Latest parsed data from ERPC hardware ──────────────
    data: {
        samples:   0,
        vout:      0,
        iload:     0,
        error:     0,       // E(t)
        salience:  0,       // A(t)
        gradient:  0,       // |∇S(t)|
        correction:1,       // [1 + α·A - β·|∇S|]
        entropy:   0,       // ΔS(t)
        gate:      false,
        pwm:       0,
        timestamp: 0,
        source:    'demo'
    },

    // ── Trend history (ring buffers) ───────────────────────
    historySize: 300,       // 30 seconds at 10Hz
    history: {
        vout:      [],
        iload:     [],
        error:     [],
        salience:  [],
        gradient:  [],
        correction:[],
        entropy:   [],
        gate:      [],
        pwm:       [],
        time:      []
    },

    // ── Public API ─────────────────────────────────────────

    onData: function(cb) { this.listeners.push(cb); },

    pushData: function(d) {
        this.data = d;
        // Push to ring buffers
        var hist = this.history;
        var max = this.historySize;
        var keys = ['vout','iload','error','salience','gradient','correction','entropy','gate','pwm'];
        keys.forEach(function(k) {
            hist[k].push(d[k]);
            if (hist[k].length > max) hist[k].shift();
        });
        hist.time.push(d.timestamp);
        if (hist.time.length > max) hist.time.shift();
        // Notify
        this.listeners.forEach(function(cb) { cb(d); });
    },

    getStatus: function() {
        return {
            mode: this.mode,
            connected: this.connected,
            dataPoints: this.history.time.length,
            lastUpdate: this.data.timestamp ? new Date(this.data.timestamp).toLocaleTimeString() : 'N/A'
        };
    },

    // ════════════════════════════════════════════════════════
    // 1. WebSerial - Direct USB connection
    // ════════════════════════════════════════════════════════

    serialSupported: function() {
        return ('serial' in navigator);
    },

    connectSerial: async function() {
        if (!this.serialSupported()) {
            alert('WebSerial not supported in this browser.\nUse Chrome or Edge.');
            return false;
        }

        try {
            // User picks the serial port (browser requires gesture)
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 115200 });

            this.mode = 'serial';
            this.connected = true;
            this.readBuffer = '';

            console.log('[CONNECTOR] Serial port opened at 115200 baud');

            // Start reading
            this._readSerialLoop();
            return true;

        } catch (err) {
            console.error('[CONNECTOR] Serial connection failed:', err);
            this.connected = false;
            return false;
        }
    },

    _readSerialLoop: async function() {
        var decoder = new TextDecoderStream();
        var inputDone = this.port.readable.pipeTo(decoder.writable);
        var inputStream = decoder.readable;
        this.reader = inputStream.getReader();
        var self = this;

        try {
            while (true) {
                var result = await self.reader.read();
                if (result.done) {
                    console.log('[CONNECTOR] Serial reader done');
                    break;
                }
                if (result.value) {
                    self.readBuffer += result.value;
                    // Process complete lines
                    var lines = self.readBuffer.split('\n');
                    self.readBuffer = lines.pop(); // Keep incomplete line
                    lines.forEach(function(line) {
                        line = line.trim();
                        if (line.indexOf('Samples:') === 0 || line.indexOf('Samples:') > -1) {
                            var parsed = self.parseLine(line);
                            if (parsed) self.pushData(parsed);
                        }
                    });
                }
            }
        } catch (err) {
            console.error('[CONNECTOR] Serial read error:', err);
        }

        this.connected = false;
    },

    disconnectSerial: async function() {
        try {
            if (this.reader) {
                await this.reader.cancel();
                this.reader = null;
            }
            if (this.port) {
                await this.port.close();
                this.port = null;
            }
        } catch (err) {
            console.warn('[CONNECTOR] Disconnect error:', err);
        }
        this.connected = false;
        this.mode = 'demo';
        console.log('[CONNECTOR] Serial disconnected');
    },

    // Send command to Arduino ('d' for debug toggle, 'r' for reset, '?' for help)
    sendSerialCommand: async function(cmd) {
        if (!this.port || !this.port.writable) return;
        var encoder = new TextEncoder();
        var writer = this.port.writable.getWriter();
        await writer.write(encoder.encode(cmd));
        writer.releaseLock();
        console.log('[CONNECTOR] Sent command:', cmd);
    },

    // ════════════════════════════════════════════════════════
    // 2. MQTT over WebSocket
    // ════════════════════════════════════════════════════════

    connectMQTT: function(brokerUrl, topic) {
        // Uses the Paho MQTT client if loaded, or a simple WebSocket
        // brokerUrl example: 'wss://broker.hivemq.com:8884/mqtt'
        // topic example: 'erpc/gary/sensor'

        if (typeof Paho === 'undefined') {
            console.warn('[CONNECTOR] Paho MQTT not loaded. Using raw WebSocket fallback.');
            return this._connectMQTTRaw(brokerUrl, topic);
        }

        var clientId = 'erpc-isa-' + Math.random().toString(36).substring(2, 8);
        var client = new Paho.MQTT.Client(brokerUrl, clientId);
        var self = this;

        client.onMessageArrived = function(message) {
            try {
                var payload = message.payloadString;
                // Try JSON first
                var d = JSON.parse(payload);
                d.timestamp = Date.now();
                d.source = 'mqtt';
                self.pushData(d);
            } catch (e) {
                // Try serial format
                var parsed = self.parseLine(payload);
                if (parsed) {
                    parsed.source = 'mqtt';
                    self.pushData(parsed);
                }
            }
        };

        client.onConnectionLost = function(resp) {
            console.warn('[CONNECTOR] MQTT connection lost:', resp.errorMessage);
            self.connected = false;
        };

        client.connect({
            onSuccess: function() {
                console.log('[CONNECTOR] MQTT connected to', brokerUrl);
                client.subscribe(topic);
                self.mqttClient = client;
                self.mode = 'mqtt';
                self.connected = true;
            },
            onFailure: function(err) {
                console.error('[CONNECTOR] MQTT connection failed:', err);
            },
            useSSL: brokerUrl.indexOf('wss') === 0
        });
    },

    _connectMQTTRaw: function(brokerUrl, topic) {
        // Minimal raw WebSocket MQTT-like connection
        var self = this;
        try {
            var ws = new WebSocket(brokerUrl);
            ws.onopen = function() {
                console.log('[CONNECTOR] WebSocket connected to', brokerUrl);
                self.mode = 'mqtt';
                self.connected = true;
            };
            ws.onmessage = function(event) {
                try {
                    var d = JSON.parse(event.data);
                    d.timestamp = Date.now();
                    d.source = 'mqtt';
                    self.pushData(d);
                } catch (e) {
                    var parsed = self.parseLine(event.data);
                    if (parsed) {
                        parsed.source = 'mqtt';
                        self.pushData(parsed);
                    }
                }
            };
            ws.onclose = function() {
                self.connected = false;
                console.log('[CONNECTOR] WebSocket closed');
            };
        } catch (err) {
            console.error('[CONNECTOR] WebSocket error:', err);
        }
    },

    disconnectMQTT: function() {
        if (this.mqttClient) {
            this.mqttClient.disconnect();
            this.mqttClient = null;
        }
        this.connected = false;
        this.mode = 'demo';
    },

    // Publish data (for bidirectional)
    publishMQTT: function(topic, payload) {
        if (!this.mqttClient) return;
        var message = new Paho.MQTT.Message(JSON.stringify(payload));
        message.destinationName = topic;
        this.mqttClient.send(message);
    },

    // ════════════════════════════════════════════════════════
    // 3. Demo Mode - Simulated GEP
    // ════════════════════════════════════════════════════════

    demoInterval: null,
    demoSamples: 0,
    demoVout: 5.0,
    demoIload: 0.5,

    startDemo: function() {
        this.mode = 'demo';
        this.connected = true;
        this.demoSamples = 0;
        this.demoVout = 5.0;
        this.demoIload = 0.5;
        var self = this;

        this.demoInterval = setInterval(function() {
            self.demoSamples++;

            // Simulate load transients every ~5 seconds
            var time = self.demoSamples / 10;
            var loadStep = (Math.floor(time / 5) % 2 === 0) ? 0.5 : 1.2;
            self.demoIload += (loadStep - self.demoIload) * 0.1 + (Math.random() - 0.5) * 0.02;
            self.demoIload = Math.max(0, self.demoIload);

            // GEP calculation (mirrors Arduino)
            var VREF_TARGET = 5.0;
            var ALPHA = 0.3;
            var BETA = 0.5;
            var THRESHOLD = 0.5;

            var vout_prev = self.demoVout;
            var error = VREF_TARGET - self.demoVout;
            var power_now = self.demoVout * self.demoIload;
            var power_prev = vout_prev * self.demoIload;
            var salience = Math.abs(power_now - power_prev);
            var gradient = Math.abs(self.demoVout - vout_prev);
            var correction = 1.0 + (ALPHA * salience) - (BETA * gradient);
            var entropy = error * correction;

            var gate = Math.abs(entropy) > THRESHOLD;
            var pwm = gate ? 128 : 0;

            // Simulate voltage response
            if (gate) {
                self.demoVout += error * 0.15;
            }
            self.demoVout += (Math.random() - 0.5) * 0.05;
            self.demoVout = Math.max(0, Math.min(12, self.demoVout));

            self.pushData({
                samples:    self.demoSamples,
                vout:       Math.round(self.demoVout * 1000) / 1000,
                iload:      Math.round(self.demoIload * 1000) / 1000,
                error:      Math.round(error * 10000) / 10000,
                salience:   Math.round(salience * 10000) / 10000,
                gradient:   Math.round(gradient * 10000) / 10000,
                correction: Math.round(correction * 10000) / 10000,
                entropy:    Math.round(entropy * 10000) / 10000,
                gate:       gate,
                pwm:        pwm,
                timestamp:  Date.now(),
                source:     'demo'
            });
        }, 100); // 10 Hz like the Arduino debug output

        console.log('[CONNECTOR] Demo mode started at 10 Hz');
    },

    stopDemo: function() {
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
            this.demoInterval = null;
        }
        this.connected = false;
    },

    // ════════════════════════════════════════════════════════
    // 4. HTTP Device - Fetch from network ERPC nodes
    // ════════════════════════════════════════════════════════
    // Connects to ERPC web UI devices like the one at 10.0.0.109
    // Reads config, status, and telemetry over HTTP and WebSocket

    httpDevice: null,   // { host, port, telemPort, pollInterval }
    httpPollTimer: null,
    telemSocket: null,

    connectHTTP: function(host, options) {
        var opts = Object.assign({
            port: 80,
            telemPort: 8767,
            pollInterval: 1000,
            protocol: 'http'
        }, options || {});

        this.httpDevice = {
            host: host,
            port: opts.port,
            telemPort: opts.telemPort,
            baseUrl: opts.protocol + '://' + host + (opts.port !== 80 ? ':' + opts.port : ''),
            telemUrl: 'ws://' + host + ':' + opts.telemPort,
            pollInterval: opts.pollInterval
        };

        this.mode = 'http';
        this.connected = true;
        var self = this;

        console.log('[CONNECTOR] Connecting to HTTP device at', this.httpDevice.baseUrl);

        // 1. Initial fetch - read the page to discover what's there
        this.fetchDevicePage();

        // 2. Probe for API endpoints
        this.probeDeviceAPI();

        // 3. Try WebSocket telemetry
        this.connectTelemetryWS();

        // 4. Start polling
        this.httpPollTimer = setInterval(function() {
            self.pollDevice();
        }, opts.pollInterval);

        return true;
    },

    disconnectHTTP: function() {
        if (this.httpPollTimer) {
            clearInterval(this.httpPollTimer);
            this.httpPollTimer = null;
        }
        if (this.telemSocket) {
            this.telemSocket.close();
            this.telemSocket = null;
        }
        this.httpDevice = null;
        this.connected = false;
        this.mode = 'demo';
        console.log('[CONNECTOR] HTTP device disconnected');
    },

    // Fetch the main page and scrape it for ERPC data
    fetchDevicePage: async function() {
        if (!this.httpDevice) return;
        var url = this.httpDevice.baseUrl + '/';
        try {
            var resp = await fetch(url, { mode: 'cors' });
            var html = await resp.text();
            console.log('[CONNECTOR] Device page fetched,', html.length, 'bytes');

            // Parse the HTML for ERPC values
            var parsed = this.parseDeviceHTML(html);
            if (parsed) {
                this.httpDevice.config = parsed;
                this.pushData({
                    samples: (this.data.samples || 0) + 1,
                    vout: 0, iload: 0,
                    error: 0, salience: 0, gradient: 0,
                    correction: 1, entropy: parsed.erpcSettings.baseEntropy || 0,
                    gate: parsed.status.erpc === 'ALLOW',
                    pwm: 0,
                    timestamp: Date.now(),
                    source: 'http',
                    node: parsed.status,
                    motorSettings: parsed.motorSettings,
                    erpcSettings: parsed.erpcSettings,
                    networkSettings: parsed.networkSettings,
                    raw: html.substring(0, 2000)
                });
            }
            return html;
        } catch (err) {
            console.warn('[CONNECTOR] Fetch failed:', err.message, '- trying no-cors');
            // Try no-cors (won't get body but confirms device is there)
            try {
                await fetch(url, { mode: 'no-cors' });
                console.log('[CONNECTOR] Device reachable (opaque response via no-cors)');
            } catch (e) {
                console.error('[CONNECTOR] Device unreachable:', e.message);
            }
            return null;
        }
    },

    // Parse the ERPC web UI HTML for settings and status values
    parseDeviceHTML: function(html) {
        var result = {
            motorSettings: {},
            erpcSettings: {},
            networkSettings: {},
            status: {},
            raw: {}
        };

        // Parse input/select values: <input ... name="xxx" value="yyy">
        var inputRegex = /<(?:input|select)[^>]*name\s*=\s*["']([^"']+)["'][^>]*value\s*=\s*["']([^"']*?)["']/gi;
        var match;
        while ((match = inputRegex.exec(html)) !== null) {
            result.raw[match[1]] = match[2];
        }

        // Also try value before name
        var inputRegex2 = /<(?:input|select)[^>]*value\s*=\s*["']([^"']*?)["'][^>]*name\s*=\s*["']([^"']+)["']/gi;
        while ((match = inputRegex2.exec(html)) !== null) {
            result.raw[match[2]] = match[1];
        }

        // Parse <select> with <option selected>
        var selectRegex = /<select[^>]*name\s*=\s*["']([^"']+)["'][^>]*>[\s\S]*?<option[^>]*selected[^>]*>([^<]*)/gi;
        while ((match = selectRegex.exec(html)) !== null) {
            result.raw[match[1]] = match[2].trim();
        }

        // Parse checked checkboxes
        var checkRegex = /<input[^>]*type\s*=\s*["']checkbox["'][^>]*name\s*=\s*["']([^"']+)["'][^>]*checked/gi;
        while ((match = checkRegex.exec(html)) !== null) {
            result.raw[match[1]] = true;
        }

        // Parse status bar text (e.g., "Node: Rotary  Axis: ROT  ERPC: ALLOW  Buf: 0/100")
        var statusMatch = html.match(/Node:\s*(\w+)\s+Axis:\s*(\w+)\s+ERPC:\s*(\w+)\s+Buf:\s*([\d/]+)/i);
        if (statusMatch) {
            result.status.node = statusMatch[1];
            result.status.axis = statusMatch[2];
            result.status.erpc = statusMatch[3];
            result.status.buffer = statusMatch[4];
        }

        // Map known field names to categories
        var motorFields = ['uart_baud', 'baud', 'servo_addr', 'addr', 'max_ma', 'current',
                           'microsteps', 'max_rpm', 'rpm', 'max_acc', 'acc', 'protection',
                           'stall_guard', 'stallguard', 'irun', 'ihold'];
        var erpcFields = ['base_entropy', 'baseEntropy', 'throttle_thresh', 'throttleThresh',
                          'block_thresh', 'blockThresh', 'isolate_thresh', 'isolateThresh',
                          'ema_alpha', 'emaAlpha', 'align_min', 'alignMin', 'throttle_ms',
                          'throttleMs', 'entropy', 'erpc_mode'];
        var netFields = ['telem_port', 'telemPort', 'reconnect', 'reconnect_s', 'ip', 'ssid',
                         'hostname', 'mqtt_host', 'mqtt_port', 'ws_port'];

        Object.keys(result.raw).forEach(function(key) {
            var lower = key.toLowerCase().replace(/[-\s]/g, '_');
            var val = result.raw[key];
            // Try to parse numbers
            var num = parseFloat(val);
            var parsed = isNaN(num) ? val : num;

            if (motorFields.some(function(f) { return lower.indexOf(f) >= 0; })) {
                result.motorSettings[key] = parsed;
            } else if (erpcFields.some(function(f) { return lower.indexOf(f) >= 0; })) {
                result.erpcSettings[key] = parsed;
            } else if (netFields.some(function(f) { return lower.indexOf(f) >= 0; })) {
                result.networkSettings[key] = parsed;
            } else {
                // Put in most likely category based on value
                result.motorSettings[key] = parsed;
            }
        });

        // Scan for any number values in text nodes near known labels
        var labelValueRegex = /(?:Base\s*Entropy|Throttle\s*Thresh|Block\s*Thresh|Isolate\s*Thresh|EMA\s*Alpha|Align\s*Min|Throttle\s*MS|Telem\s*Port|Max\s*mA|Microsteps|Max\s*RPM|Max\s*Acc|UART\s*Baud|Servo\s*Addr)[^<]*?([\d.]+)/gi;
        while ((match = labelValueRegex.exec(html)) !== null) {
            var label = match[0].split(/[\d]/)[0].trim().replace(/[:\s]+$/, '').replace(/\s+/g, '_').toLowerCase();
            result.raw['_label_' + label] = parseFloat(match[1]);
        }

        console.log('[CONNECTOR] Parsed device HTML:', Object.keys(result.raw).length, 'fields,',
            'Motor:', Object.keys(result.motorSettings).length,
            'ERPC:', Object.keys(result.erpcSettings).length,
            'Net:', Object.keys(result.networkSettings).length,
            'Status:', JSON.stringify(result.status));

        return result;
    },

    // Probe common API endpoints
    probeDeviceAPI: async function() {
        if (!this.httpDevice) return;
        var base = this.httpDevice.baseUrl;
        var self = this;
        var endpoints = [
            '/api/status', '/status', '/api/config', '/config',
            '/api/telemetry', '/telemetry', '/api/data', '/data',
            '/json', '/api', '/api/erpc', '/erpc',
            '/api/motor', '/motor', '/api/info', '/info',
            '/api/entropy', '/entropy', '/health', '/api/health',
            '/ws', '/stream', '/events'
        ];

        this.httpDevice.apiEndpoints = {};

        var probes = endpoints.map(function(ep) {
            return fetch(base + ep, { mode: 'cors' })
                .then(function(resp) {
                    return resp.text().then(function(body) {
                        if (resp.ok) {
                            console.log('[CONNECTOR] API endpoint found:', ep, '(' + body.length + ' bytes)');
                            self.httpDevice.apiEndpoints[ep] = {
                                status: resp.status,
                                contentType: resp.headers.get('content-type') || '',
                                size: body.length,
                                body: body.substring(0, 5000)
                            };
                            // Try to parse as JSON
                            try {
                                self.httpDevice.apiEndpoints[ep].json = JSON.parse(body);
                            } catch (e) { /* not JSON */ }
                        }
                    });
                })
                .catch(function() { /* endpoint doesn't exist, fine */ });
        });

        await Promise.all(probes);
        var found = Object.keys(this.httpDevice.apiEndpoints);
        console.log('[CONNECTOR] API probe complete:', found.length, 'endpoints found', found);
    },

    // Connect to telemetry WebSocket
    connectTelemetryWS: function() {
        if (!this.httpDevice) return;
        var self = this;
        var urls = [
            self.httpDevice.telemUrl,
            'ws://' + self.httpDevice.host + ':' + self.httpDevice.telemPort + '/ws',
            'ws://' + self.httpDevice.host + ':' + self.httpDevice.telemPort + '/telemetry',
            'ws://' + self.httpDevice.host + ':81',
            'ws://' + self.httpDevice.host + ':81/ws',
            'ws://' + self.httpDevice.host + ':' + self.httpDevice.port + '/ws',
            'ws://' + self.httpDevice.host + ':' + self.httpDevice.port + '/stream',
            'ws://' + self.httpDevice.host + ':' + self.httpDevice.port + '/events'
        ];

        var tryIndex = 0;

        function tryNext() {
            if (tryIndex >= urls.length) {
                console.log('[CONNECTOR] No WebSocket endpoints responded');
                return;
            }
            var url = urls[tryIndex++];
            console.log('[CONNECTOR] Trying WebSocket:', url);

            try {
                var ws = new WebSocket(url);
                var timeout = setTimeout(function() {
                    ws.close();
                    tryNext();
                }, 3000);

                ws.onopen = function() {
                    clearTimeout(timeout);
                    console.log('[CONNECTOR] Telemetry WebSocket connected:', url);
                    self.telemSocket = ws;
                    self.httpDevice.telemConnected = true;
                    self.httpDevice.telemUrl = url;
                };

                ws.onmessage = function(event) {
                    var raw = event.data;
                    // Try JSON first
                    try {
                        var d = JSON.parse(raw);
                        d.timestamp = Date.now();
                        d.source = 'telemetry-ws';
                        self.pushData(self.normalizeTelemData(d));
                        return;
                    } catch (e) { /* not JSON */ }

                    // Try serial format
                    var parsed = self.parseLine(raw);
                    if (parsed) {
                        parsed.source = 'telemetry-ws';
                        self.pushData(parsed);
                        return;
                    }

                    // Try ERPC node status format
                    var nodeData = self.parseNodeStatus(raw);
                    if (nodeData) {
                        self.pushData(nodeData);
                        return;
                    }

                    // Raw data - store it
                    console.log('[CONNECTOR] Telemetry raw:', raw.substring(0, 200));
                    self.pushData({
                        samples: (self.data.samples || 0) + 1,
                        vout: 0, iload: 0, error: 0, salience: 0,
                        gradient: 0, correction: 1, entropy: 0,
                        gate: false, pwm: 0,
                        timestamp: Date.now(),
                        source: 'telemetry-ws',
                        rawTelemetry: raw
                    });
                };

                ws.onerror = function() {
                    clearTimeout(timeout);
                    tryNext();
                };

                ws.onclose = function() {
                    if (self.httpDevice) self.httpDevice.telemConnected = false;
                };
            } catch (e) {
                tryNext();
            }
        }

        tryNext();
    },

    // Parse the node status format: "Node: Rotary  Axis: ROT  ERPC: ALLOW  Buf: 0/100"
    parseNodeStatus: function(text) {
        var statusMatch = text.match(/Node:\s*(\w+)\s+Axis:\s*(\w+)\s+ERPC:\s*(\w+)\s+Buf:\s*([\d]+)\/([\d]+)/i);
        if (!statusMatch) return null;
        return {
            samples: (this.data.samples || 0) + 1,
            vout: 0, iload: 0, error: 0, salience: 0,
            gradient: 0, correction: 1,
            entropy: 0,
            gate: statusMatch[3] === 'ALLOW',
            pwm: 0,
            timestamp: Date.now(),
            source: 'http-status',
            node: statusMatch[1],
            axis: statusMatch[2],
            erpcMode: statusMatch[3],
            bufferUsed: parseInt(statusMatch[4]),
            bufferSize: parseInt(statusMatch[5])
        };
    },

    // Normalize telemetry JSON to our standard data shape
    normalizeTelemData: function(d) {
        return {
            samples:    d.samples   || d.sample_count || d.n || (this.data.samples || 0) + 1,
            vout:       d.vout      || d.voltage || d.v || 0,
            iload:      d.iload     || d.current || d.i || 0,
            error:      d.error     || d.e || d.err || 0,
            salience:   d.salience  || d.a || d.sal || 0,
            gradient:   d.gradient  || d.grad || d.dS || 0,
            correction: d.correction|| d.corr || 1,
            entropy:    d.entropy   || d.dS || d.delta_s || d.deltaS || 0,
            gate:       d.gate !== undefined ? !!d.gate : (d.gate_enabled || false),
            pwm:        d.pwm       || d.duty || 0,
            timestamp:  d.timestamp || Date.now(),
            source:     d.source    || 'telemetry-ws',
            // Pass through any extra ERPC node fields
            node:       d.node      || d.name || null,
            axis:       d.axis      || null,
            erpcMode:   d.erpc      || d.erpc_mode || d.mode || null,
            bufferUsed: d.buf_used  || d.buffer_used || null,
            bufferSize: d.buf_size  || d.buffer_size || null,
            rpm:        d.rpm       || d.speed || null,
            position:   d.position  || d.pos || null,
            stall:      d.stall     || d.stallguard || null
        };
    },

    // Poll device for updates (HTTP fallback when no WebSocket)
    pollDevice: async function() {
        if (!this.httpDevice) return;
        // If we have a working WebSocket, don't poll
        if (this.httpDevice.telemConnected) return;

        var base = this.httpDevice.baseUrl;
        // Try known API endpoints first
        var endpoints = Object.keys(this.httpDevice.apiEndpoints || {});
        var jsonEndpoint = endpoints.find(function(ep) {
            var info = this.httpDevice.apiEndpoints[ep];
            return info && info.contentType && info.contentType.indexOf('json') >= 0;
        }.bind(this));

        if (jsonEndpoint) {
            try {
                var resp = await fetch(base + jsonEndpoint);
                var data = await resp.json();
                data.timestamp = Date.now();
                data.source = 'http-poll';
                this.pushData(this.normalizeTelemData(data));
                return;
            } catch (e) { /* fall through */ }
        }

        // Fallback: re-fetch the main page and parse status
        try {
            var resp2 = await fetch(base + '/', { mode: 'cors' });
            var html = await resp2.text();
            var parsed = this.parseDeviceHTML(html);
            if (parsed && parsed.status.node) {
                this.pushData({
                    samples: (this.data.samples || 0) + 1,
                    vout: 0, iload: 0, error: 0, salience: 0,
                    gradient: 0, correction: 1,
                    entropy: parsed.erpcSettings.base_entropy || parsed.erpcSettings.baseEntropy || 0,
                    gate: parsed.status.erpc === 'ALLOW',
                    pwm: 0,
                    timestamp: Date.now(),
                    source: 'http-poll',
                    node: parsed.status,
                    motorSettings: parsed.motorSettings,
                    erpcSettings: parsed.erpcSettings
                });
            }
        } catch (e) { /* device offline or CORS blocked */ }
    },

    // ════════════════════════════════════════════════════════
    // Serial Line Parser
    // ════════════════════════════════════════════════════════
    // Parses: "Samples: N | Vout: V.VVVV | Iload: I.IIIA | E: ... | A: ... | ∇S: ... | Corr: ... | ΔS: ... | Gate: ON/OFF | PWM: N"

    parseLine: function(line) {
        try {
            var parts = line.split('|').map(function(s) { return s.trim(); });
            if (parts.length < 10) return null;

            var getVal = function(part) {
                var match = part.match(/([-+]?[0-9]*\.?[0-9]+)/);
                return match ? parseFloat(match[1]) : 0;
            };

            return {
                samples:    getVal(parts[0]),
                vout:       getVal(parts[1]),
                iload:      getVal(parts[2]),
                error:      getVal(parts[3]),
                salience:   getVal(parts[4]),
                gradient:   getVal(parts[5]),
                correction: getVal(parts[6]),
                entropy:    getVal(parts[7]),
                gate:       parts[8].indexOf('ON') >= 0,
                pwm:        getVal(parts[9]),
                timestamp:  Date.now(),
                source:     'serial'
            };
        } catch (e) {
            console.warn('[CONNECTOR] Parse error:', e, 'Line:', line);
            return null;
        }
    },

    // ════════════════════════════════════════════════════════
    // JSON Import/Export (paste data, share results)
    // ════════════════════════════════════════════════════════

    exportHistory: function() {
        return JSON.stringify({
            exported: new Date().toISOString(),
            source: this.mode,
            dataPoints: this.history.time.length,
            history: this.history
        }, null, 2);
    },

    importHistory: function(jsonStr) {
        try {
            var data = JSON.parse(jsonStr);
            if (data.history) {
                this.history = data.history;
                console.log('[CONNECTOR] Imported', data.dataPoints, 'data points');
                return true;
            }
        } catch (e) {
            console.error('[CONNECTOR] Import error:', e);
        }
        return false;
    }
};

// ════════════════════════════════════════════════════════════
// Canvas Trend Renderer
// ════════════════════════════════════════════════════════════

ISA.TrendCanvas = {
    draw: function(canvasId, traces, options) {
        var canvas = document.getElementById(canvasId);
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var W = canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
        var H = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
        canvas.style.width = canvas.offsetWidth + 'px';
        canvas.style.height = canvas.offsetHeight + 'px';
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        var w = canvas.offsetWidth;
        var h = canvas.offsetHeight;

        var opts = Object.assign({
            bgColor: '#0d1117',
            gridColor: '#1c2333',
            textColor: '#6e7681',
            yMin: null,
            yMax: null,
            autoScale: true,
            showGrid: true,
            showLabels: true,
            title: '',
            padding: { top: 25, right: 10, bottom: 20, left: 50 }
        }, options || {});

        var pad = opts.padding;
        var plotW = w - pad.left - pad.right;
        var plotH = h - pad.top - pad.bottom;

        // Background
        ctx.fillStyle = opts.bgColor;
        ctx.fillRect(0, 0, w, h);

        // Auto-scale Y
        var yMin = opts.yMin, yMax = opts.yMax;
        if (opts.autoScale || yMin === null || yMax === null) {
            yMin = Infinity; yMax = -Infinity;
            traces.forEach(function(trace) {
                trace.data.forEach(function(v) {
                    if (typeof v === 'number' && isFinite(v)) {
                        if (v < yMin) yMin = v;
                        if (v > yMax) yMax = v;
                    }
                });
            });
            if (yMin === Infinity) { yMin = 0; yMax = 1; }
            var range = yMax - yMin;
            if (range < 0.001) { yMin -= 0.5; yMax += 0.5; range = 1; }
            yMin -= range * 0.05;
            yMax += range * 0.05;
        }

        // Grid
        if (opts.showGrid) {
            ctx.strokeStyle = opts.gridColor;
            ctx.lineWidth = 1;
            for (var gy = 0; gy <= 4; gy++) {
                var yy = pad.top + (gy / 4) * plotH;
                ctx.beginPath();
                ctx.moveTo(pad.left, yy);
                ctx.lineTo(pad.left + plotW, yy);
                ctx.stroke();
            }
        }

        // Y-axis labels
        if (opts.showLabels) {
            ctx.fillStyle = opts.textColor;
            ctx.font = '10px Consolas, monospace';
            ctx.textAlign = 'right';
            for (var gl = 0; gl <= 4; gl++) {
                var val = yMax - (gl / 4) * (yMax - yMin);
                var ly = pad.top + (gl / 4) * plotH;
                ctx.fillText(val.toFixed(2), pad.left - 4, ly + 3);
            }
        }

        // Title
        if (opts.title) {
            ctx.fillStyle = '#8b949e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(opts.title, pad.left, 14);
        }

        // Draw traces
        traces.forEach(function(trace) {
            var data = trace.data;
            if (data.length < 2) return;
            var len = data.length;

            ctx.strokeStyle = trace.color || '#58a6ff';
            ctx.lineWidth = trace.width || 1.5;
            ctx.globalAlpha = trace.alpha || 1;
            ctx.beginPath();

            for (var i = 0; i < len; i++) {
                var x = pad.left + (i / (len - 1)) * plotW;
                var v = typeof data[i] === 'boolean' ? (data[i] ? yMax : yMin) : data[i];
                var y = pad.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
                y = Math.max(pad.top, Math.min(pad.top + plotH, y));
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Legend label
            if (trace.label) {
                var lastVal = data[data.length - 1];
                if (typeof lastVal === 'boolean') lastVal = lastVal ? 'ON' : 'OFF';
                else if (typeof lastVal === 'number') lastVal = lastVal.toFixed(3);
                var lx = pad.left + plotW;
                var lv = typeof data[data.length - 1] === 'boolean' ? (data[data.length - 1] ? yMax : yMin) : data[data.length - 1];
                var ly2 = pad.top + plotH - ((lv - yMin) / (yMax - yMin)) * plotH;
                ly2 = Math.max(pad.top + 6, Math.min(pad.top + plotH - 2, ly2));
                ctx.fillStyle = trace.color || '#58a6ff';
                ctx.font = 'bold 9px Consolas, monospace';
                ctx.textAlign = 'left';
                ctx.fillText(trace.label + ': ' + lastVal, lx - 90, ly2 - 4);
            }
        });
    }
};

console.log('[CONNECTOR] Data connector loaded. WebSerial:', ISA.Connector.serialSupported() ? 'SUPPORTED' : 'not available');
