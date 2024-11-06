const { EventEmitter } = require('events');
const Devices = require("./Devices.js");
const db = require("./db");

class Action {
    constructor(id, options) {
        this.id = id;
        this.type = options.type;
        this.options = options;
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
                const options = JSON.parse(row.options);
                if(row.type !== options.type) throw new Error("(DB - Actions table) Type Missmatch in options.")
                this.addAction(row.id, options);
            });
        });
    }
    addAction(id, options) {
        this.actions[id] = new Action(id, options);
        this.actions[id].on("delete", ()=>{
            delete this.actions[id];
            this.emit("actionDeleted", id);
        });
    }
    registerAction(options) {
        if(!options.type) throw new Error("No type was specified in options.")
        // SQL query to insert the display into the database
        const query = `
            INSERT INTO actions (type, options)
            VALUES (?, ?)
        `;
        const addAction = this.addAction;
        // Add display to the database
        db.run(query, [options.type, JSON.stringify(options)], function (err) {
            if (err) {
                throw new Error(err.message);
            }
            addAction(this.lastID, options);
            console.log(`Row(s) inserted: ${this.changes}`);
        });
    }
}

const actions = new Actions();

module.exports = { Actions: actions };