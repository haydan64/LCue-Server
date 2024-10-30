const { EventEmitter } = require('events');
const db = require("./db");

class Cues extends EventEmitter {
    constructor() {
        super();
    }
}

const cues = new Cues();

module.exports = {Cues: cues};