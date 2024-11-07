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

    toJSON() {
        console.log(this.actions)
        return {
            id: this.id,
            name: this.name,
            position: this.position,
            actions: this.actions.filter((action) => { return !!action }),
            next: this.next?.id || null,
            prev: this.prev?.id || null
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
        this.on("createNewCue", this.registerCue);
        this.on("deleteCue", this.deleteCue);
        this.on("nameCue", this.nameCue);
        this.on("moveCue", this.moveCue);
        this.on("createAction", this.createAction);
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
        console.log(this);
        this.cues[id] = new Cue(id, position, actions, name);
        this.putCue(this.cues[id], position);
        this.emit("sync", "cueAdded", this.cues[id].toJSON());
        return this.cues[id];
    }
    registerCue(position) {
        // SQL query to insert the display into the database
        if (typeof position !== 'number') {
            if (this.tail) {
                position = Math.floor(this.tail.position + 1);
            } else position = 1;
        }
        const query = `
            INSERT INTO cues (position, actions, name)
            VALUES (?, ?, ?)
        `;
        const self = this;
        // Add display to the database
        db.run(query, [position, "", ""], function (err) {
            if (err) {
                throw new Error(err.message);
            }
            self.addCue(this.lastID, position, [], "");
            console.log(`Row(s) inserted: ${this.changes}`);
        });
    }
    deleteCue(id) {
        if (!this.cues[id]) return;

        const cue = this.cues[id];

        // Remove cue from the linked list
        if (cue.prev) {
            cue.prev.next = cue.next;
        } else {
            // This cue is the head
            this.head = cue.next;
        }

        if (cue.next) {
            cue.next.prev = cue.prev;
        } else {
            // This cue is the tail
            this.tail = cue.prev;
        }

        // Delete the cue from the database
        const query = `DELETE FROM cues WHERE id = ?`;
        db.run(query, id, (err) => {
            if (err) {
                console.error(`Error deleting cue from database: ${err.message}`);
                return;
            }
            console.log(`Cue with ID ${id} deleted from database`);
        });

        // Delete the cue from memory
        delete this.cues[id];

        // Emit the sync event
        this.emit("sync", "cueDeleted", id);
    }
    nameCue(id, newName) {
        if (!this.cues[id]) return;
        const query = `UPDATE cues SET name = ? WHERE id = ?`;
        db.run(query, [newName, id], (err) => {
            if (err) {
                console.error(`Error updating cue name in database: ${err.message}`);
                return;
            }
            this.cues[id].name = newName;
            this.emit("sync", "cueNamed", id, newName);
        });
    }
    moveCue(id, newPosition) {
        if (!this.cues[id]) return;
        // Update the position in the database
        const query = `UPDATE cues SET position = ? WHERE id = ?`;
        db.run(query, [newPosition, id], (err) => {
            if (err) {
                console.error(`Error updating cue position in database: ${err.message}`);
                return;
            }
            const cue = this.cues[id];

            // Remove cue from the linked list
            if (cue.prev) {
                cue.prev.next = cue.next;
            } else {
                // This cue is the head
                this.head = cue.next;
            }

            if (cue.next) {
                cue.next.prev = cue.prev;
            } else {
                // This cue is the tail
                this.tail = cue.prev;
            }

            cue.next = null;
            cue.prev = null;
            cue.position = newPosition;
            console.log(`Cue with ID ${id} moved to new position ${newPosition} in database`);

            // Reinsert the cue in the linked list
            this.putCue(cue, newPosition);
            this.emit("sync", "cueMoved", id, newPosition);
        });
    }
    createAction(id, options) {
        if (!this.cues[id]) return;
        Actions.registerAction(options, (action) => {
            this.cues[id].actions.push(action);
            this.emit("sync", "actionCreated", id, action.toJSON());

            const query = `UPDATE cues SET actions = ? WHERE id = ?`;
            db.run(query, [
                this.cues[id].actions.filter((action) => { return !!action }).join(","),
                id
            ], (err) => {
                if (err) {
                    console.error(`Error updating cue position in database: ${err.message}`);
                    return;
                }
            })
        });
    }

    getCues(asJSON) {
        let cues = [];
        let current = this.head;
        while (current) {
            cues.push(asJSON ? current.toJSON() : current);
            current = current.next;
        }
        return cues;
    }
}

const cues = new Cues();

module.exports = { Cues: cues };