const { EventEmitter } = require('events');
const db = require("./db");

class Triggers extends EventEmitter {
    constructor() {
        super();
    }
}

const triggers = new Triggers();

module.exports = triggers;