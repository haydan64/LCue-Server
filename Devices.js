const { EventEmitter } = require('events');
const db = require("./db");

const osc = require('node-osc');

class Device extends EventEmitter {
    constructor(type, id, options) {
        this.type = type;
        this.id = id;
        this.options = options;
        this.isConnected = false;
    }
    isConnected() {
        return this.isConnected;
    }
}

class OSCDevice extends Device {
    constructor(type, id, options) {
        super(type, id, options);
        this.client = this.connect();
    }
    connect() {
        const client = new osc.Client(this.address, this.port);
        return client
    }
    sendOSCMessage() {
        this.client.send(address, Number(value));
    }
}

class EOSDevice extends OSCDevice {
    constructor(type,id, options) {
        super(type,id, options);
    }
    nextCue() {

    }
    prevCue() {

    }
    gotoCue(cue, cuelist) {

    }
    submaster() {

    }
    recallPreset(preset) {

    }
    pressButton(button) {

    }
}

class DMXDevice extends Device {
    constructor(type,id, options) {
        super(type,id, options);
    }
}

class MIDIDevice extends Device {
    constructor(type,id, options) {
        super(type,id, options);
    }
}

class WLEDDevice extends Device {
    constructor(type,id, options) {
        super(type,id, options);
    }
}

class Devices extends EventEmitter {
    constructor() {
        super();
        this.deviceList = {}; // Store devices here
        
        // Load displays from database
        this.loadDisplays();
    }

    loadDisplays() {
        db.all("SELECT * FROM displays", (err, rows) => {
            if (err) {
                console.error(err.message);
                return;
            }
            rows.forEach((row) => {
                let device;
                const options = JSON.parse(row.options); // Parse JSON string to object
                this.addDevice(row.type, row.id, options);
                
                this.deviceList[row.id] = device; // Assuming 'id' is a unique identifier for each display
            });
            console.log('Displays loaded:', this.deviceList);
        });
        
    }

    getList() {
        return Object.entries(this.deviceList);
    }

    addDevice(type, id, options) {
        //Just add the device to the Devices list.
        switch (row.type) {
            case 'OSC':
                device = new OSCDevice(row.type, options);
                break;
            case 'EOS':
                device = new EOSDevice(row.type, options);
                break;
            case 'DMX':
                device = new DMXDevice(row.type, options);
                break;
            case 'MIDI':
                device = new MIDIDevice(row.type, options);
                break;
            case 'WLED':
                device = new WLEDDevice(row.type, options);
                break;
            default:
                device = new Device(row.type, options);
        }
    }

    registerDevice(type, options) {
        //Add the device to the db, then add it to the Devices list.
        let newID = Math.floor(Math.random() * 1e9);
        let jsonOptions = JSON.stringify(options);
        db.run()
    }

    updateDevice(deviceId, newData) {
        const device = this.deviceList[deviceId];
        if (device) {
            Object.assign(device, newData);
            this.emit('deviceUpdated', device);
        }
    }
}

const devices = new Devices();
module.exports = devices;
