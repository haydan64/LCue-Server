const { EventEmitter } = require('events');

const { Actions } = require("./Actions.js");
const db = require("./db");

class Trigger {
    constructor(id, column, row, color, icon, name, actions) {
        this.id = id;
        this.column = column;
        this.row = row;
        this.color = color;
        this.icon = icon;
        this.name = name || "";
        this.actions = actions;
    }

    trigger() {
        this.actions.forEach((action) => {
            Actions.actions[action]?.trigger();
        });
    }

    toJSON() {
        return {
            id: this.id,
            column: this.column,
            row: this.row,
            color: this.color,
            icon: this.icon,
            name: this.name,
            actions: this.actions
        }
    }
}

class Triggers extends EventEmitter {
    constructor() {
        super();
        this.triggers = {};
        db.all("SELECT * FROM triggers", (err, rows) => {
            if (err) {
                console.error(err.message);
                return;
            }
            rows.forEach((row) => {
                this.addTrigger(row.id, row.column, row.row, row.color, row.icon, row.name, row.actions.split(",").map((id) => { return parseInt(id) }))
            });
        });
        this.on("createNewTrigger", ()=>{
            console.log("create new trigger")
            this.registerTrigger()
        });
        this.on("deleteTrigger", this.deleteTrigger);
        this.on("nameTrigger", this.nameTrigger);
        this.on("createAction", this.createAction);
    }
    addTrigger(id, column, row, color, icon, name, actions) {
        this.triggers[id] = new Trigger(id, column, row, color, icon, name, actions);
        this.emit("sync", "triggerAdded", this.triggers[id].toJSON());
        this.emit("triggerUpdated", this.triggers[id]);
        return this.triggers[id];
    }
    registerTrigger() {
        // SQL query to insert the trigger into the database
        console.log("create new triggers")
        const query = `
            INSERT INTO triggers (name, color, icon, actions, column, row)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const self = this;

        db.run(query, ["", "#0e4775", "fa-play", "", 0, 0], function (err) {
            if (err) {
                throw new Error(err.message);
            }
            self.addTrigger(this.lastID, 0, 0, "#0e4775", "fa-play", "", []);
            console.log(`Row(s) inserted: ${this.changes}`);
        });
    }
    deleteTrigger(id) {
        if (!this.triggers[id]) return;

        // Delete the trigger from the database
        const query = `DELETE FROM triggers WHERE id = ?`;
        db.run(query, id, (err) => {
            if (err) {
                console.error(`Error deleting trigger from database: ${err.message}`);
                return;
            }
            console.log(`Trigger with ID ${id} deleted from database`);
        });

        // Delete the trigger from memory
        delete this.triggers[id];

        // Emit the sync event
        this.emit("sync", "triggerDeleted", id);
        this.emit("deletedTrigger", id);
    }
    nameTrigger(id, newName) {
        if (!this.triggers[id]) return;
        const query = `UPDATE triggers SET name = ? WHERE id = ?`;
        db.run(query, [newName, id], (err) => {
            if (err) {
                console.error(`Error updating trigger name in database: ${err.message}`);
                return;
            }
            this.triggers[id].name = newName;
            this.emit("sync", "triggerNamed", id, newName);
            this.emit("triggerUpdated", this.triggers[id]);
        });
    }
    createAction(id, options) {
        if (!this.triggers[id]) return;
        Actions.registerAction(options, (action) => {
            this.triggers[id].actions.push(action.id);
            this.emit("sync", "actionCreated", id, action.toJSON());

            const query = `UPDATE triggers SET actions = ? WHERE id = ?`;
            db.run(query, [
                this.triggers[id].actions.filter((action) => { return !!action }).join(","),
                id
            ], (err) => {
                if (err) {
                    console.error(`Error updating trigger position in database: ${err.message}`);
                    return;
                }
            })
        });
    }

    getTriggers() {
        return Object.entries(this.triggers).map(([id, trigger])=>{return trigger.toJSON});
    }
}

const triggers = new Triggers();

module.exports = { Triggers: triggers };