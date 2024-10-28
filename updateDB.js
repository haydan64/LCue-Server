const db = require("./db");

function createTables() {
    db.serialize(() => {
        db.run("CREATE TABLE displays (id INTEGER PRIMARY KEY, name TEXT)");
        db.run("CREATE TABLE files (displayID INTEGER, name TEXT)");
        db.run("CREATE TABLE playlistFiles (playlistID INTEGER, playlistID, transition TEXT, transitionDuraction INTEGER, loop BOOLEAN, advanceAfterPlay BOOLEAN, advanceAfterDuration)");
        db.run("CREATE TABLE actions (actionID INTEGER, action TEXT)");
        db.run("CREATE TABLE devices (deviceID INTEGER PRIMARY KEY, config TEXT)");
    });
}