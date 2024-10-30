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
        if(this.displays[id]) {

        } else {
            //create new display
            registerDisplay(id, name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists)
        }
    }
    addDisplay(id, name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists) {

    }
    registerDisplay(id, name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists) {
        //add display to db
    }
}

const displays = new Displays();

module.exports = {Displays: displays};