const { EventEmitter } = require('events');

const { Actions } = require("./Actions.js");
const db = require("./db");

class Cue {
    constructor(id, position, actions, name) {
        this.id = id;
        this.name = name || "";
        this.position = position;
        this.actions = actions;
        this.next = null;
        this.prev = null;
    }

    trigger() {
        this.actions.forEach((action) => {
            Actions.actions[action]?.trigger();
        });
    }

    addAction(triggerID) {
        this.actions.push(triggerID); // Update actions in db 
        db.run(`UPDATE cues SET actions = ? WHERE id = ?`,
            [this.actions.join(','), this.id],
            (err) => {
                if (err) { console.error(err.message); }
            }
        );
    }
    toJSON() {
        return {
            id: this.id,
            position: this.position,
            actions: this.actions,
            next: this.next,
            prev: this.prev
        }
    }
}

class Cues extends EventEmitter {
    constructor() {
        super();
        this.cues = {};
        this.current = null;
        this.head = null;
        this.tail = null;

        db.all("SELECT * FROM cues", (err, rows) => {
            if (err) {
                console.error(err.message);
                return;
            }
            rows.forEach((row) => {
                this.addCue(row.id, row.position, row.actions.split(",").map((id) => { return parseInt(id) }), row.name)
            });
        });
    }
    putCue(cue, position) {
        if (!this.head) {
            this.head = this.tail = cue;
            return;
        }

        if (this.tail.position < position) {
            this.tail.next = cue;
            cue.prev = this.tail;
            this.tail = cue;
            return;
        }

        if (this.head.position > position) {
            cue.next = this.head;
            this.head.prev = cue;
            this.head = cue;
            return;
        }

        let current = this.head;
        while (current) {
            if (current.position > position) {
                if (current.prev) {
                    current.prev.next = cue;
                    cue.prev = current.prev;
                    current.prev = cue;
                    cue.next = current;
                }
                return;
            }
            current = current.next;
        }
    }
    addCue(id, position, actions, name) {
        this.cues[id] = new Cue(id, position, actions, name);
        this.putCue(this.cues[id], position);
        return this.cues[id];
    }
    registerCue(position) {
        // SQL query to insert the display into the database
        const query = `
            INSERT INTO actions (position, actions, name)
            VALUES (?, ?, ?)
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

const cues = new Cues();

module.exports = { Cues: cues };