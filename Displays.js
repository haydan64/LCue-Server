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
        this.playlists.playlists = [];
        this.on("fileList", (fileList) => {
            this.files = fileList;
            this.emit("files",)
        })
    }
    displayConnected(name, alwaysOnTop, startFullscreen, startInKiosk, files, playlists) {
        if (this.name !== name) this.changeName(name, false);
        if (this.name !== name) this.changeAlwaysOnTop(alwaysOnTop, false);
        if (this.name !== name) this.changeStartFullscreen(startFullscreen, false);
        if (this.name !== name) this.changeStartInKiosk(startInKiosk, false);
        this.files = files;
        this.playlists = playlists;
    }
    showFile(fileName, transition, transitionDuration) {
        this.emit("socket", "showFile", fileName, transition, transitionDuration);
    }
    showPlaylist(playlistNumber, options) {
        this.emit("socket", "showPlaylist", playlistNumber, options);
    }
    advancePlaylist() {
        this.emit("socket", "advancePlaylist");
    }
    downloadFile(path) {
        this.emit("socket", "downloadFile", path);
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
        if (pushToDisplay !== false) {
            this.emit("socket", "displayName", this.name)
        }
    }
    changeAlwaysOnTop(newName, alwaysOnTop) {
        this.alwaysOnTop = alwaysOnTop;
        db.run(
            `UPDATE displays SET alwaysOnTop = ? WHERE id = ?`,
            [this.alwaysOnTop, id],
            function (err) {
                if (err) {
                    return console.error(err.message);
                }
                console.log(`Row(s) updated: ${this.changes}`);
            }
        );
        this.emit("alwaysOnTopChanged", this.alwaysOnTop);
        if (pushToDisplay !== false) {
            this.emit("socket", "alwaysOnTop", this.alwaysOnTop)
        }
    }
    changeStartFullscreen(newName, startFullscreen) {
        this.startFullscreen = startFullscreen;
        db.run(
            `UPDATE displays SET startFullscreen = ? WHERE id = ?`,
            [this.startFullscreen, id],
            function (err) {
                if (err) {
                    return console.error(err.message);
                }
                console.log(`Row(s) updated: ${this.changes}`);
            }
        );
        this.emit("startFullscreenChanged", this.startFullscreen);
        if (pushToDisplay !== false) {
            this.emit("socket", "startFullscreen", this.startFullscreen)
        }
    }
    changeStartInKiosk(newName, startInKiosk) {
        this.startInKiosk = startInKiosk;
        db.run(
            `UPDATE displays SET startInKiosk = ? WHERE id = ?`,
            [this.startInKiosk, id],
            function (err) {
                if (err) {
                    return console.error(err.message);
                }
                console.log(`Row(s) updated: ${this.changes}`);
            }
        );
        this.emit("startInKioskChanged", this.startInKiosk);
        if (pushToDisplay !== false) {
            this.emit("socket", "startInKiosk", this.startInKiosk);
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
    registerDisplay(id, name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists) {
        // SQL query to insert the display into the database
        const query = `
            INSERT INTO displays (id, name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        // Add display to the database
        db.run(query, [id, name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists], function (err) {
            if (err) {
                return console.error(err.message);
            }
            console.log(`Row(s) inserted: ${this.changes}`);
        });
    }
}

const displays = new Displays();

module.exports = { Displays: displays };