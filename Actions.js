const { EventEmitter } = require('events');
const db = require("./db");

class Action extends EventEmitter {
    constructor(id, options) {
        this.id = id;
        this.options = options;
        super();
    }
    trigger() {

    }
}
class Actions extends EventEmitter {
    constructor() {
        super();
        this.actions = {};
        db.all("SELECT * FROM actions", (err, rows) => {
            if (err) {
                console.error(err.message);
                return;
            }
            rows.forEach((row) => {
                const options = JSON.parse(row.options); // Parse JSON string to object
                
                this.actions[row.id] = device; // Assuming 'id' is a unique identifier for each display
            });
        });
    }

    addDevice(type, id, options) {
        //Just add the action to the actions list.
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
        //Add the action to the db, then add it to the actions list.
        let newID = Math.floor(Math.random() * 1e9);
        let jsonOptions = JSON.stringify(options);
        db.run()
    }
}

const actions = new Actions();

module.exports = { Actions: actions };