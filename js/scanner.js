/* ============================================================
   ERPC Device Scanner
   Discovers ERPC / ISA-compatible devices through every
   browser API available. No backend needed.

   Discovery channels:
   1. WebSerial  - Enumerate paired serial ports, handshake for ERPC signature
   2. WebUSB     - Scan for Arduino/CH340/FTDI USB vendor IDs
   3. WebBluetooth - Scan for BLE devices advertising ERPC service
   4. MQTT Discovery - Subscribe to erpc/discovery/# topic
   5. Network Probe  - Ping common local IPs/ports for HTTP-serving devices
   6. Web NFC        - Read NFC tags with ERPC config (mobile)

   ERPC Industries | Built for Gary
   ============================================================ */

window.ISA = window.ISA || {};

ISA.Scanner = {
    // ── State ──────────────────────────────────────────────
    scanning: false,
    devices: [],        // Discovered devices
    scanLog: [],        // Log messages
    listeners: [],      // Callbacks on device found
    scanStart: 0,

    // Known USB vendor/product IDs for common Arduino boards
    KNOWN_USB: [
        { vendorId: 0x2341, productId: 0x0043, name: 'Arduino Uno (genuine)' },
        { vendorId: 0x2341, productId: 0x0001, name: 'Arduino Uno' },
        { vendorId: 0x2341, productId: 0x0243, name: 'Arduino Uno R3' },
        { vendorId: 0x2341, productId: 0x0010, name: 'Arduino Mega 2560' },
        { vendorId: 0x2341, productId: 0x003D, name: 'Arduino Due' },
        { vendorId: 0x2341, productId: 0x8036, name: 'Arduino Leonardo' },
        { vendorId: 0x2341, productId: 0x8037, name: 'Arduino Micro' },
        { vendorId: 0x1A86, productId: 0x7523, name: 'CH340 (Arduino clone)' },
        { vendorId: 0x1A86, productId: 0x5523, name: 'CH341 (Arduino clone)' },
        { vendorId: 0x0403, productId: 0x6001, name: 'FTDI FT232R' },
        { vendorId: 0x0403, productId: 0x6015, name: 'FTDI FT231X' },
        { vendorId: 0x10C4, productId: 0xEA60, name: 'CP210x (NodeMCU/ESP32)' },
        { vendorId: 0x10C4, productId: 0xEA70, name: 'CP2105 Dual' },
        { vendorId: 0x1A86, productId: 0x55D4, name: 'CH9102 (ESP32-S2)' },
        { vendorId: 0x303A, productId: 0x1001, name: 'ESP32-S2 native USB' },
        { vendorId: 0x303A, productId: 0x0002, name: 'ESP32-S3 native USB' },
        { vendorId: 0x2E8A, productId: 0x000A, name: 'Raspberry Pi Pico' }
    ],

    // ERPC signature strings to look for in serial handshake
    ERPC_SIGNATURES: [
        'ERPC',
        'Entropy-Regulated Power Control',
        'GEP Algorithm',
        'Guided Entropy Principle',
        'Vout:',
        'Gate:',
        'Base Entropy',
        'Throttle Thresh',
        'Block Thresh',
        'Isolate Thresh',
        'ERPC Settings',
        'Motor Settings',
        'Telem Port',
        'ERPC: ALLOW',
        'ERPC: BLOCK',
        'ERPC: THROTTLE',
        'ERPC: ISOLATE'
    ],

    // BLE service UUID for ERPC (custom 128-bit UUID)
    BLE_SERVICE_UUID: '00001234-0000-1000-8000-00805f9b34fb',
    BLE_KNOWN_NAMES: ['ERPC', 'GEP-Sensor', 'Lumiea', 'Arduino', 'ESP32', 'HM-10', 'BT05'],

    // Network probe targets for local IoT devices
    NETWORK_PROBES: [
        { host: '10.0.0.109',   port: 80,   desc: 'ERPC Node (known)' },
        { host: '10.0.0.1',     port: 80,   desc: 'Gateway 10.x' },
        { host: '10.0.0.100',   port: 80,   desc: '10.x static' },
        { host: '10.0.0.110',   port: 80,   desc: '10.x neighbor' },
        { host: '10.0.0.111',   port: 80,   desc: '10.x neighbor' },
        { host: '192.168.1.1',   port: 80,   desc: 'Gateway' },
        { host: '192.168.4.1',   port: 80,   desc: 'ESP AP default' },
        { host: '192.168.1.100', port: 80,   desc: 'Common static IP' },
        { host: '192.168.1.101', port: 80,   desc: 'Common static IP' },
        { host: '192.168.1.50',  port: 80,   desc: 'Common static IP' },
        { host: '192.168.0.100', port: 80,   desc: 'Common static IP' },
        { host: '192.168.0.1',   port: 80,   desc: 'Gateway alt' },
        { host: '10.0.0.1',     port: 80,   desc: 'Gateway alt' },
        { host: 'erpc.local',   port: 80,   desc: 'mDNS hostname' },
        { host: 'arduino.local',port: 80,   desc: 'mDNS hostname' },
        { host: 'esp32.local',  port: 80,   desc: 'mDNS hostname' },
        { host: '192.168.1.1',  port: 1883, desc: 'MQTT local' },
        { host: '192.168.1.1',  port: 8883, desc: 'MQTT TLS local' }
    ],

    // ── Public API ─────────────────────────────────────────

    onDeviceFound: function(cb) { this.listeners.push(cb); },

    _notify: function(device) {
        this.listeners.forEach(function(cb) { cb(device); });
    },

    log: function(channel, message, level) {
        var entry = {
            time: new Date().toLocaleTimeString(),
            channel: channel,
            message: message,
            level: level || 'info'  // info, success, warn, error
        };
        this.scanLog.push(entry);
        var prefix = level === 'success' ? '+' : level === 'warn' ? '!' : level === 'error' ? 'x' : '-';
        console.log('[SCANNER][' + channel + '] ' + prefix + ' ' + message);
    },

    addDevice: function(device) {
        // Deduplicate by id
        var existing = this.devices.find(function(d) { return d.id === device.id; });
        if (existing) {
            Object.assign(existing, device);
            return existing;
        }
        device.discoveredAt = new Date().toLocaleTimeString();
        this.devices.push(device);
        this._notify(device);
        return device;
    },

    clearDevices: function() {
        this.devices = [];
        this.scanLog = [];
    },

    // ════════════════════════════════════════════════════════
    // MASTER SCAN - runs all available channels in parallel
    // ════════════════════════════════════════════════════════

    scanAll: async function() {
        if (this.scanning) return;
        this.scanning = true;
        this.scanStart = Date.now();
        this.scanLog = [];
        this.log('SCAN', 'Starting multi-channel device scan...', 'info');

        var promises = [];

        // 1. WebSerial
        if ('serial' in navigator) {
            this.log('SERIAL', 'WebSerial API available - scanning paired ports...', 'info');
            promises.push(this.scanSerial().catch(function(e) { return null; }));
        } else {
            this.log('SERIAL', 'WebSerial not available (need Chrome/Edge)', 'warn');
        }

        // 2. WebUSB
        if ('usb' in navigator) {
            this.log('USB', 'WebUSB API available - scanning connected devices...', 'info');
            promises.push(this.scanUSB().catch(function(e) { return null; }));
        } else {
            this.log('USB', 'WebUSB not available', 'warn');
        }

        // 3. WebBluetooth
        if ('bluetooth' in navigator) {
            this.log('BLE', 'WebBluetooth API available', 'info');
            // BLE requires user gesture, so we queue it
            this.log('BLE', 'Click "Scan BLE" button to initiate Bluetooth scan (requires gesture)', 'info');
        } else {
            this.log('BLE', 'WebBluetooth not available', 'warn');
        }

        // 4. Network probes
        this.log('NET', 'Probing local network addresses...', 'info');
        promises.push(this.scanNetwork().catch(function(e) { return null; }));

        // 5. Web NFC
        if ('NDEFReader' in window) {
            this.log('NFC', 'Web NFC available - tap an NFC tag to read device config', 'info');
            promises.push(this.scanNFC().catch(function(e) { return null; }));
        } else {
            this.log('NFC', 'Web NFC not available (need Chrome Android)', 'warn');
        }

        // 6. MQTT discovery
        this.log('MQTT', 'MQTT discovery available via WebSocket broker connection', 'info');

        await Promise.all(promises);

        var elapsed = Date.now() - this.scanStart;
        this.log('SCAN', 'Scan complete in ' + elapsed + 'ms. Found ' + this.devices.length + ' device(s).', this.devices.length > 0 ? 'success' : 'info');
        this.scanning = false;
    },

    // ════════════════════════════════════════════════════════
    // 1. WebSerial Scanner
    // ════════════════════════════════════════════════════════

    scanSerial: async function() {
        try {
            var ports = await navigator.serial.getPorts();
            this.log('SERIAL', 'Found ' + ports.length + ' previously paired port(s)', ports.length > 0 ? 'success' : 'info');

            var self = this;
            for (var i = 0; i < ports.length; i++) {
                var port = ports[i];
                var info = port.getInfo();
                var usbMatch = this.KNOWN_USB.find(function(u) {
                    return u.vendorId === info.usbVendorId && u.productId === info.usbProductId;
                });

                var device = {
                    id: 'serial-' + (info.usbVendorId || 'unknown') + '-' + (info.usbProductId || i),
                    channel: 'WebSerial',
                    name: usbMatch ? usbMatch.name : 'Serial Port ' + i,
                    vendorId: info.usbVendorId ? '0x' + info.usbVendorId.toString(16).toUpperCase() : 'N/A',
                    productId: info.usbProductId ? '0x' + info.usbProductId.toString(16).toUpperCase() : 'N/A',
                    status: 'found',
                    erpcSignature: false,
                    port: port,
                    canConnect: true
                };

                this.log('SERIAL', 'Port: ' + device.name + ' [VID:' + device.vendorId + ' PID:' + device.productId + ']', 'success');

                // Try to handshake for ERPC signature
                try {
                    var sig = await this.probeSerialSignature(port);
                    if (sig) {
                        device.erpcSignature = true;
                        device.status = 'ERPC detected';
                        device.signatureData = sig;
                        this.log('SERIAL', 'ERPC SIGNATURE DETECTED on port ' + i + '!', 'success');
                    }
                } catch (e) {
                    this.log('SERIAL', 'Could not probe port ' + i + ' (may be in use): ' + e.message, 'warn');
                }

                this.addDevice(device);
            }
        } catch (err) {
            this.log('SERIAL', 'Error scanning serial ports: ' + err.message, 'error');
        }
    },

    probeSerialSignature: async function(port) {
        // Quick handshake: open port, send '?', read response, look for ERPC strings
        var timeout = 3000;
        try {
            await port.open({ baudRate: 115200 });

            // Send help command
            var encoder = new TextEncoder();
            var writer = port.writable.getWriter();
            await writer.write(encoder.encode('?'));
            writer.releaseLock();

            // Read response
            var decoder = new TextDecoderStream();
            var readablePipe = port.readable.pipeTo(decoder.writable);
            var reader = decoder.readable.getReader();
            var buffer = '';
            var startTime = Date.now();
            var found = false;

            while (Date.now() - startTime < timeout) {
                var readPromise = reader.read();
                var timeoutPromise = new Promise(function(resolve) {
                    setTimeout(function() { resolve({ done: true, timeout: true }); }, 500);
                });
                var result = await Promise.race([readPromise, timeoutPromise]);
                if (result.timeout || result.done) break;
                buffer += result.value || '';

                // Check for ERPC signatures
                var self = this;
                this.ERPC_SIGNATURES.forEach(function(sig) {
                    if (buffer.indexOf(sig) >= 0) found = true;
                });
                if (found) break;
            }

            await reader.cancel().catch(function() {});
            await port.close().catch(function() {});

            return found ? buffer.substring(0, 500) : null;
        } catch (e) {
            await port.close().catch(function() {});
            throw e;
        }
    },

    // Request new serial port (requires user gesture)
    requestSerialPort: async function() {
        if (!('serial' in navigator)) return null;
        try {
            var port = await navigator.serial.requestPort();
            var info = port.getInfo();
            var usbMatch = this.KNOWN_USB.find(function(u) {
                return u.vendorId === info.usbVendorId && u.productId === info.usbProductId;
            });
            var device = {
                id: 'serial-new-' + Date.now(),
                channel: 'WebSerial',
                name: usbMatch ? usbMatch.name : 'New Serial Port',
                vendorId: info.usbVendorId ? '0x' + info.usbVendorId.toString(16).toUpperCase() : 'N/A',
                productId: info.usbProductId ? '0x' + info.usbProductId.toString(16).toUpperCase() : 'N/A',
                status: 'paired',
                erpcSignature: false,
                port: port,
                canConnect: true
            };
            this.addDevice(device);
            this.log('SERIAL', 'New port paired: ' + device.name, 'success');
            return device;
        } catch (e) {
            this.log('SERIAL', 'Port request cancelled or failed: ' + e.message, 'warn');
            return null;
        }
    },

    // ════════════════════════════════════════════════════════
    // 2. WebUSB Scanner
    // ════════════════════════════════════════════════════════

    scanUSB: async function() {
        try {
            var devices = await navigator.usb.getDevices();
            this.log('USB', 'Found ' + devices.length + ' previously authorized USB device(s)', devices.length > 0 ? 'success' : 'info');

            for (var i = 0; i < devices.length; i++) {
                var usbDev = devices[i];
                var match = this.KNOWN_USB.find(function(u) {
                    return u.vendorId === usbDev.vendorId && u.productId === usbDev.productId;
                });

                var device = {
                    id: 'usb-' + usbDev.vendorId + '-' + usbDev.productId + '-' + usbDev.serialNumber,
                    channel: 'WebUSB',
                    name: usbDev.productName || (match ? match.name : 'USB Device'),
                    vendorId: '0x' + usbDev.vendorId.toString(16).toUpperCase(),
                    productId: '0x' + usbDev.productId.toString(16).toUpperCase(),
                    serial: usbDev.serialNumber || 'N/A',
                    manufacturer: usbDev.manufacturerName || 'Unknown',
                    status: match ? 'known device' : 'unknown',
                    erpcSignature: false,
                    canConnect: false
                };

                this.log('USB', device.name + ' [' + device.manufacturer + '] SN:' + device.serial, 'success');
                this.addDevice(device);
            }
        } catch (err) {
            this.log('USB', 'Error scanning USB: ' + err.message, 'error');
        }
    },

    requestUSBDevice: async function() {
        if (!('usb' in navigator)) return null;
        try {
            var filters = this.KNOWN_USB.map(function(u) {
                return { vendorId: u.vendorId, productId: u.productId };
            });
            var usbDev = await navigator.usb.requestDevice({ filters: filters });
            var match = this.KNOWN_USB.find(function(u) {
                return u.vendorId === usbDev.vendorId && u.productId === usbDev.productId;
            });
            var device = {
                id: 'usb-' + usbDev.vendorId + '-' + usbDev.productId,
                channel: 'WebUSB',
                name: usbDev.productName || (match ? match.name : 'USB Device'),
                vendorId: '0x' + usbDev.vendorId.toString(16).toUpperCase(),
                productId: '0x' + usbDev.productId.toString(16).toUpperCase(),
                status: 'authorized',
                erpcSignature: false,
                canConnect: false
            };
            this.addDevice(device);
            this.log('USB', 'Authorized: ' + device.name, 'success');
            return device;
        } catch (e) {
            this.log('USB', 'Device request cancelled: ' + e.message, 'warn');
            return null;
        }
    },

    // ════════════════════════════════════════════════════════
    // 3. WebBluetooth Scanner (requires user gesture)
    // ════════════════════════════════════════════════════════

    scanBLE: async function() {
        if (!('bluetooth' in navigator)) {
            this.log('BLE', 'WebBluetooth not available', 'error');
            return;
        }
        try {
            this.log('BLE', 'Requesting Bluetooth scan (browser will show picker)...', 'info');

            // Accept a wide range of devices
            var bleDevice = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [this.BLE_SERVICE_UUID, 'battery_service', 'device_information']
            });

            var isKnown = false;
            var self = this;
            this.BLE_KNOWN_NAMES.forEach(function(name) {
                if (bleDevice.name && bleDevice.name.toLowerCase().indexOf(name.toLowerCase()) >= 0) {
                    isKnown = true;
                }
            });

            var device = {
                id: 'ble-' + bleDevice.id,
                channel: 'Bluetooth LE',
                name: bleDevice.name || 'Unknown BLE Device',
                bleId: bleDevice.id,
                status: isKnown ? 'known device' : 'found',
                erpcSignature: isKnown,
                canConnect: true,
                bleDevice: bleDevice
            };

            // Try to connect and read device info
            try {
                this.log('BLE', 'Connecting to ' + device.name + '...', 'info');
                var server = await bleDevice.gatt.connect();
                device.status = 'connected';

                // Try device information service
                try {
                    var dis = await server.getPrimaryService('device_information');
                    try {
                        var mfg = await dis.getCharacteristic('manufacturer_name_string');
                        var val = await mfg.readValue();
                        device.manufacturer = new TextDecoder().decode(val);
                    } catch (e) { /* no manufacturer */ }
                    try {
                        var fw = await dis.getCharacteristic('firmware_revision_string');
                        var fwVal = await fw.readValue();
                        device.firmware = new TextDecoder().decode(fwVal);
                    } catch (e) { /* no firmware */ }
                } catch (e) { /* no DIS */ }

                // Try ERPC custom service
                try {
                    var erpcService = await server.getPrimaryService(self.BLE_SERVICE_UUID);
                    device.erpcSignature = true;
                    device.status = 'ERPC detected';
                    self.log('BLE', 'ERPC BLE SERVICE FOUND on ' + device.name + '!', 'success');
                } catch (e) {
                    // Not an ERPC device, that's fine
                }

                server.disconnect();
            } catch (connErr) {
                self.log('BLE', 'Could not connect to GATT: ' + connErr.message, 'warn');
            }

            this.addDevice(device);
            this.log('BLE', 'Found: ' + device.name + (device.erpcSignature ? ' [ERPC]' : ''), 'success');

        } catch (err) {
            if (err.name === 'NotFoundError') {
                this.log('BLE', 'No device selected', 'warn');
            } else {
                this.log('BLE', 'BLE scan error: ' + err.message, 'error');
            }
        }
    },

    // ════════════════════════════════════════════════════════
    // 4. MQTT Discovery
    // ════════════════════════════════════════════════════════

    mqttDiscoveryClient: null,

    scanMQTT: function(brokerUrl, discoveryTopic) {
        brokerUrl = brokerUrl || 'wss://broker.hivemq.com:8884/mqtt';
        discoveryTopic = discoveryTopic || 'erpc/discovery/#';

        this.log('MQTT', 'Connecting to broker: ' + brokerUrl, 'info');

        var self = this;

        // Simple WebSocket-based MQTT listener
        try {
            var ws = new WebSocket(brokerUrl);
            ws.onopen = function() {
                self.log('MQTT', 'Connected to MQTT broker, listening on ' + discoveryTopic, 'success');
                self.addDevice({
                    id: 'mqtt-broker-' + brokerUrl,
                    channel: 'MQTT',
                    name: 'MQTT Broker',
                    brokerUrl: brokerUrl,
                    topic: discoveryTopic,
                    status: 'listening',
                    erpcSignature: false,
                    canConnect: true
                });
            };
            ws.onmessage = function(event) {
                try {
                    var data = JSON.parse(event.data);
                    if (data.deviceId || data.type === 'erpc') {
                        self.addDevice({
                            id: 'mqtt-device-' + (data.deviceId || Date.now()),
                            channel: 'MQTT',
                            name: data.name || data.deviceId || 'MQTT Device',
                            status: 'announced',
                            erpcSignature: data.type === 'erpc' || (data.firmware && data.firmware.indexOf('ERPC') >= 0),
                            mqttTopic: data.topic || 'erpc/sensor/' + data.deviceId,
                            canConnect: true,
                            metadata: data
                        });
                        self.log('MQTT', 'Device announced: ' + (data.name || data.deviceId), 'success');
                    }
                } catch (e) { /* not JSON or not a discovery message */ }
            };
            ws.onerror = function() {
                self.log('MQTT', 'WebSocket connection failed (broker may not support raw WS)', 'warn');
            };
            ws.onclose = function() {
                self.log('MQTT', 'Broker connection closed', 'info');
            };
            this.mqttDiscoveryClient = ws;
        } catch (e) {
            this.log('MQTT', 'Error: ' + e.message, 'error');
        }
    },

    // ════════════════════════════════════════════════════════
    // 5. Network Probe Scanner
    // ════════════════════════════════════════════════════════

    scanNetwork: async function() {
        var self = this;
        var probePromises = this.NETWORK_PROBES.map(function(probe) {
            return self.probeHost(probe);
        });
        await Promise.all(probePromises);
    },

    probeHost: async function(probe) {
        var url = 'http://' + probe.host + ':' + probe.port + '/';
        var self = this;
        try {
            var controller = new AbortController();
            var timer = setTimeout(function() { controller.abort(); }, 3000);

            var start = Date.now();
            // Try cors first to read content, fall back to no-cors
            var body = null;
            var erpcFound = false;
            var deviceInfo = {};
            try {
                var corsResp = await fetch(url, { mode: 'cors', signal: controller.signal });
                clearTimeout(timer);
                var latency = Date.now() - start;
                body = await corsResp.text();

                // Deep probe: look for ERPC signatures in the page content
                var erpcSignatures = ['ERPC', 'Entropy', 'entropy', 'erpc', 'GEP',
                    'Base Entropy', 'Throttle Thresh', 'Block Thresh', 'Isolate Thresh',
                    'Node:', 'Axis:', 'stallguard', 'microstep', 'Motor Settings',
                    'ERPC Settings', 'Telem Port'];
                var matchedSigs = [];
                erpcSignatures.forEach(function(sig) {
                    if (body.indexOf(sig) >= 0) {
                        matchedSigs.push(sig);
                        erpcFound = true;
                    }
                });

                // Parse status bar if present
                var statusMatch = body.match(/Node:\s*(\w+)\s+Axis:\s*(\w+)\s+ERPC:\s*(\w+)\s+Buf:\s*([\d/]+)/i);
                if (statusMatch) {
                    deviceInfo.node = statusMatch[1];
                    deviceInfo.axis = statusMatch[2];
                    deviceInfo.erpcMode = statusMatch[3];
                    deviceInfo.buffer = statusMatch[4];
                }

                // Parse input fields for config values
                var inputCount = (body.match(/<input/gi) || []).length;
                var selectCount = (body.match(/<select/gi) || []).length;
                deviceInfo.formFields = inputCount + selectCount;

                // Look for telemetry port config
                var telemMatch = body.match(/[Tt]elem(?:etry)?\s*[Pp]ort[^<]*?(\d{4,5})/);
                if (telemMatch) deviceInfo.telemPort = parseInt(telemMatch[1]);

                if (erpcFound) {
                    self.log('NET', 'ERPC DEVICE FOUND at ' + probe.host + ':' + probe.port +
                        ' (' + latency + 'ms) - matched: ' + matchedSigs.join(', '), 'success');
                } else {
                    self.log('NET', probe.host + ':' + probe.port + ' responded (' + latency + 'ms) - ' +
                        probe.desc + ' (' + body.length + ' bytes, ' + deviceInfo.formFields + ' fields)', 'success');
                }

                self.addDevice({
                    id: 'net-' + probe.host + '-' + probe.port,
                    channel: 'Network',
                    name: erpcFound
                        ? 'ERPC Node' + (deviceInfo.node ? ': ' + deviceInfo.node : '') + ' (' + probe.host + ')'
                        : probe.desc + ' (' + probe.host + ')',
                    host: probe.host,
                    port: probe.port,
                    telemPort: deviceInfo.telemPort || null,
                    latency: latency + 'ms',
                    status: erpcFound ? 'ERPC detected' : 'reachable',
                    erpcSignature: erpcFound,
                    matchedSignatures: matchedSigs,
                    nodeInfo: deviceInfo,
                    pageSize: body ? body.length : 0,
                    canConnect: true
                });
                return;

            } catch (corsErr) {
                // CORS blocked - try no-cors (opaque, can't read body)
                clearTimeout(timer);
                var controller2 = new AbortController();
                var timer2 = setTimeout(function() { controller2.abort(); }, 2000);
                var resp = await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: controller2.signal });
                clearTimeout(timer2);
                var latency2 = Date.now() - start;

                self.log('NET', probe.host + ':' + probe.port + ' responded (' + latency2 + 'ms, opaque/CORS) - ' + probe.desc, 'success');
                self.addDevice({
                    id: 'net-' + probe.host + '-' + probe.port,
                    channel: 'Network',
                    name: probe.desc + ' (' + probe.host + ')',
                    host: probe.host,
                    port: probe.port,
                    latency: latency2 + 'ms',
                    status: 'reachable (CORS opaque)',
                    erpcSignature: false,
                    canConnect: true
                });
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                if (err.message && err.message.indexOf('Failed to fetch') < 0) {
                    self.log('NET', probe.host + ':' + probe.port + ' - ' + err.message, 'warn');
                }
            }
        }
    },

    // Scan a custom IP range
    scanRange: async function(baseIp, startHost, endHost, port) {
        port = port || 80;
        this.log('NET', 'Scanning ' + baseIp + '.' + startHost + '-' + endHost + ':' + port, 'info');
        var promises = [];
        for (var i = startHost; i <= endHost; i++) {
            var host = baseIp + '.' + i;
            promises.push(this.probeHost({ host: host, port: port, desc: 'Scan ' + host }));
        }
        await Promise.all(promises);
        this.log('NET', 'Range scan complete', 'info');
    },

    // ════════════════════════════════════════════════════════
    // 6. Web NFC Scanner (Chrome Android only)
    // ════════════════════════════════════════════════════════

    scanNFC: async function() {
        if (!('NDEFReader' in window)) return;
        try {
            var ndef = new NDEFReader();
            var self = this;
            await ndef.scan();
            self.log('NFC', 'NFC reader active - tap an NFC tag...', 'info');

            ndef.addEventListener('reading', function(event) {
                var serialNumber = event.serialNumber;
                var records = [];
                for (var i = 0; i < event.message.records.length; i++) {
                    var record = event.message.records[i];
                    var text = new TextDecoder().decode(record.data);
                    records.push(text);
                }

                var isERPC = records.some(function(r) {
                    return r.indexOf('ERPC') >= 0 || r.indexOf('erpc') >= 0;
                });

                self.addDevice({
                    id: 'nfc-' + serialNumber,
                    channel: 'NFC',
                    name: 'NFC Tag ' + serialNumber.slice(-8),
                    serial: serialNumber,
                    status: isERPC ? 'ERPC config found' : 'tag read',
                    erpcSignature: isERPC,
                    nfcData: records,
                    canConnect: false
                });

                self.log('NFC', 'Tag read: ' + serialNumber + (isERPC ? ' [ERPC CONFIG]' : ''), 'success');
            });
        } catch (err) {
            this.log('NFC', 'NFC error: ' + err.message, 'warn');
        }
    },

    // ════════════════════════════════════════════════════════
    // Capability Report
    // ════════════════════════════════════════════════════════

    getCapabilities: function() {
        return {
            serial:    'serial' in navigator,
            usb:       'usb' in navigator,
            bluetooth: 'bluetooth' in navigator,
            nfc:       'NDEFReader' in window,
            mqtt:      typeof WebSocket !== 'undefined',
            network:   typeof fetch !== 'undefined',
            secure:    location.protocol === 'https:' || location.hostname === 'localhost'
        };
    }
};

console.log('[SCANNER] Device scanner loaded. Capabilities:', JSON.stringify(ISA.Scanner.getCapabilities()));
