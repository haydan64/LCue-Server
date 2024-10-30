const { EventEmitter } = require('events');
const db = require("./db");

class Display extends EventEmitter {
    constructor(id, name, alwaysOnTop, startFullscreen, startInKiosk) {
        this.id = id;
        this.name = name;
        this.alwaysOnTop = alwaysOnTop;
        this.startFullscreen = startFullscreen;
        this.startInKiosk = startInKiosk;
        this.files = [];
    }
    displayConnected(name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists) {

    }
    showFile() {

    }
    showPlaylist(playlistNumber, options) {

    }
    changeName(newName, pushToDisplay) {
        this.name = sanitizeName(newName);
        db.run(
            `UPDATE displays SET name = ? WHERE id = ?`,
            [this.name, id],
            function (err) {
                if (err) {
                    return console.error(err.message);
                }
                console.log(`Row(s) updated: ${this.changes}`);
            }
        );
        this.emit("nameChanged", this.name);
        if(pushToDisplay !== false)  {
            this.emit("socket", "changeName", this.name)
        }
    }
}

function sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9 ]/g, ''); // Remove any characters that are not letters, numbers, or spaces
}

class Displays {
    constructor() {
        this.displays = {};
        db.all("SELECT * FROM displays", (err, rows) => {
            if (err) {
                console.error(err.message);
                return;
            }
            rows.forEach((row) => {
                this.displays[row.id] = new Display(row.id, row.name, row.alwaysOnTop, row.startFullScreen, row.startInKiosk);
            });
        });
    }
    displayConnected(id, name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists) {
        if (this.displays[id]) {
            this.displays[id].displayConnected(id, name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists)
        } else {
            //create new display
            registerDisplay(id, name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists)
        }
    }
    updateDisplay(id, name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists) {
        if (this.displays[id].name !== name) this.displays[id].changeName(name, false)
    }
    registerDisplay(id, name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists) {
        //add display to db
    }
}

const displays = new Displays();

module.exports = { Displays: displays };