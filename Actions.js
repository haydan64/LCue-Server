const { EventEmitter } = require('events');
const Devices = require("./Devices.js");
const Displays = require("./Displays.js");
const db = require("./db");

class Action {
    constructor(id, options) {
        this.id = id;
        this.type = options.type;
        this.options = options;
    }
    trigger() {
        switch (this.options.type) {
            case ("trigger"): {
                this.emit("triggerTrigger", this.options.trigger.id);
                break;
            }
            case ("display"): {
                const display = Displays.displays[id];
                if(!display) return;
                if(this.options.display.action === "file") {
                    display.showFile(this.options.display.file, this.options.display.transition, this.options.display.durration)
                } else if (this.options.display.action === "playlist") {
                    display.showPlaylist(this.options.display.playlist, {
                        startAtFileNumber: this.options.display.startAt,
                        resumeFromLeftOff: this.options.display.resume,
                        autoAdvance: this.options.display.autoAdvance,
                        transition: this.options.display.transition,
                        transitionDuration:this.options.display.durration
                    })
                }
                break;
            }
            case ("eos"): {
                const device = Devices.devices[this.options.eos.id];
                switch (this.options.eos.action) {
                    case ("nextCue"): {
                        break;
                    }
                    case ("gotoCue"): {
                        break;
                    }
                    case ("prevCue"): {
                        break;
                    }
                    case ("submaster"): {
                        break;
                    }
                    case ("recallPreset"): {
                        break;
                    }
                    case ("buttonPress"): {
                        break;
                    }
                    case ("OSC"): {
                        break;
                    }
                }
            }
        }
    }
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            options: this.options
        }
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

        this.on("triggerAction", (action)=>{
            this.actions[action]?.trigger();
        })
    }
    addAction(id, options) {
        this.actions[id] = new Action(id, options);
        this.emit("sync", "addAction", this.actions[id].toJSON())
        return this.actions[id];
    }
    registerAction(options, cb) {
        if(!options.type) throw new Error("No type was specified in options.")
        // SQL query to insert the display into the database
        const query = `
            INSERT INTO actions (type, options)
            VALUES (?, ?)
        `;
        // Add display to the database
        db.run(query, [options.type, JSON.stringify(options)], function (err) {
            if (err) {
                throw new Error(err.message);
            }
            cb(actions.addAction(this.lastID, options));
            console.log(`Row(s) inserted: ${this.changes}`);
        });
    }
    getActions() {
        return Object.entries(this.actions).map((action)=> {return action[1].toJSON()});
    }
}

const actions = new Actions();

module.exports = { Actions: actions };