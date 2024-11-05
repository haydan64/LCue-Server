const { EventEmitter } = require('events');
const db = require("./db");

class Display extends EventEmitter {
    constructor(id, name, alwaysOnTop, startFullscreen, startInKiosk) {
        super();
        this.id = id;
        this.name = name;
        this.alwaysOnTop = alwaysOnTop;
        this.startFullscreen = startFullscreen;
        this.startInKiosk = startInKiosk;
        this.files = [];
        this.playlists = [];
        this.on("fileList", (fileList) => {
            this.files = fileList;
            this.emit("files", fileList);
        })
        this.on("playlist", (playlists)=> {
            this.playlists = playlists;
            this.emit("sync", "playlists", playlists);
        })
        this.on("showFile", this.showFile);
        this.on("showPlaylist", this.showPlaylist);
        this.on("advancePlaylist", this.advancePlaylist);
        this.on("downloadFile", this.downloadFile);
        this.on("name", this.changeName);
        this.on("alwaysOnTop", this.changeAlwaysOnTop);
        this.on("startFullscreen", this.changeStartFullscreen);
        this.on("startInKiosk", this.changeStartInKiosk);
    }
    displayConnected(name, alwaysOnTop, startFullscreen, startInKiosk, files, playlists) {
        if (this.name !== name) this.changeName(name, false);
        if (this.alwaysOnTop !== alwaysOnTop) this.changeAlwaysOnTop(alwaysOnTop, false);
        if (this.startFullscreen !== startFullscreen) this.changeStartFullscreen(startFullscreen, false);
        if (this.startInKiosk !== startInKiosk) this.changeStartInKiosk(startInKiosk, false);
        if(this.files !== files) {
            this.files = files;
            this.emit("sync", "files", this.files);
        }
        if(this.playlist !== playlists) {
            this.playlists = playlists;
            this.emit("sync", "playlists", playlists);
        }
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
            [this.name, this.id],
            function (err) {
                if (err) {
                    return console.error(err.message);
                }
                console.log(`Row(s) updated: ${this.changes}`);
            }
        );
        this.emit("sync", "nameChanged", this.name);
        if (pushToDisplay !== false) {
            this.emit("socket", "displayName", this.name)
        }
    }
    changeAlwaysOnTop(alwaysOnTop, pushToDisplay) {
        this.alwaysOnTop = alwaysOnTop;
        db.run(
            `UPDATE displays SET alwaysOnTop = ? WHERE id = ?`,
            [this.alwaysOnTop, this.id],
            function (err) {
                if (err) {
                    return console.error(err.message);
                }
                console.log(`Row(s) updated: ${this.changes}`);
            }
        );
        this.emit("sync", "alwaysOnTopChanged", this.alwaysOnTop);
        if (pushToDisplay !== false) {
            this.emit("socket", "alwaysOnTop", this.alwaysOnTop)
        }
    }
    changeStartFullscreen(startFullscreen, pushToDisplay) {
        this.startFullscreen = startFullscreen;
        db.run(
            `UPDATE displays SET startFullscreen = ? WHERE id = ?`,
            [this.startFullscreen, this.id],
            function (err) {
                if (err) {
                    return console.error(err.message);
                }
                console.log(`Row(s) updated: ${this.changes}`);
            }
        );
        this.emit("sync", "startFullscreenChanged", this.startFullscreen);
        if (pushToDisplay !== false) {
            this.emit("socket", "startFullscreen", this.startFullscreen)
        }
    }
    changeStartInKiosk(startInKiosk, pushToDisplay) {
        this.startInKiosk = startInKiosk;
        db.run(
            `UPDATE displays SET startInKiosk = ? WHERE id = ?`,
            [this.startInKiosk, this.id],
            function (err) {
                if (err) {
                    return console.error(err.message);
                }
                console.log(`Row(s) updated: ${this.changes}`);
            }
        );
        this.emit("sync", "startInKioskChanged", this.startInKiosk);
        if (pushToDisplay !== false) {
            this.emit("socket", "startInKiosk", this.startInKiosk);
        }
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            alwaysOnTop: this.alwaysOnTop,
            startFullscreen: this.startFullscreen,
            startInKiosk: this.startInKiosk,
            files: this.files,
            playlists: this.playlists
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
    getDisplays() {
        return Object.entries(this.displays).map(([id, display])=>{
            return display.toJSON();
        })
    }
    displayConnected(id, name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists) {
        if (!this.displays[id]) {
            this.displays[id] = this.registerDisplay(id, name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists);
        }
        this.displays[id].displayConnected(name, alwaysOnTop, startFullScreen, startInKiosk, files, playlists);
        return this.displays[id];
    }
    registerDisplay(id, name, alwaysOnTop, startFullScreen, startInKiosk) {
        // SQL query to insert the display into the database
        const query = `
            INSERT INTO displays (id, name, alwaysOnTop, startFullScreen, startInKiosk)
            VALUES (?, ?, ?, ?, ?)
        `;
        // Add display to the database
        db.run(query, [id, name, alwaysOnTop, startFullScreen, startInKiosk], function (err) {
            if (err) {
                return console.error(err.message);
            }
            console.log(`Row(s) inserted: ${this.changes}`);
        });
        return new Display(id, name, alwaysOnTop, startFullScreen, startFullScreen);
    }
}

const displays = new Displays();

module.exports = { Displays: displays };