const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const db = require("./db.js");

const { Displays } = require("./Displays.js");
const { Cues } = require("./Cues.js");
const { Actions } = require("./Actions.js");
const Devices = require("./Devices.js");

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
        process.exit(0);
    });
});

db.serialize(() => {
    const createTableQueries = [
        `
        CREATE TABLE IF NOT EXISTS displays (
            id INTEGER PRIMARY KEY,
            name TEXT,
            alwaysOnTop INTEGER,
            startFullScreen INTEGER,
            startInKiosk INTEGER,
            files TEXT,
            playlists TEXT
        );`,
        `
        CREATE TABLE IF NOT EXISTS cues (
            id INTEGER PRIMARY KEY,
            name TEXT,
            alwaysOnTop INTEGER,
            startFullScreen INTEGER,
            startInKiosk INTEGER,
            files TEXT,
            playlists TEXT
        );`,
    ];
    db.run(createTableQuery, function (err) {
        if (err) {
            return reject(err.message);
        }
        console.log('Table checked/created successfully.');
        resolve();
    });
});


const expressApp = express();
const server = http.createServer(expressApp);
const io = new Server(server);
const displayIO = io.of("/display");
const controlerIO = io.of("/controler");

const displayClients = {};
const controlerClients = {};



// Serve static files
expressApp.use(express.static(path.join(__dirname, 'public')));

expressApp.use('/api', (req, res, next) => {
    if (req.path === '/healthcheck') {
        res.json({ status: true });
    } else {
        // Your other API logic here
        res.send('API endpoint');
    }
});




io.on('connection', (socket) => {
    console.log('a device connected');

    socket.on('disconnect', () => {
        console.log('device disconnected');
    });
});

displayIO.on('connection', (socket) => {
    console.log('a display connected');
    let display;

    socket.on("register", (displayInfo) => {
        if (display.displayVersion > 1) {
            socket.emit("versionMissmatch", {
                expectedVersion: "0 - 1"
            });
            return;
        }
        display = Displays.displayConnected(
            displayInfo.id,
            displayInfo.name,
            displayInfo.alwaysOnTop,
            displayInfo.startFullscreen,
            displayInfo.startInKiosk,
            displayInfo.files,
            displayInfo.playlists
        );

        display.on("socket", (event, ...args) => {
            socket.emit(event, ...args);
        })
    })

    //Redirect all events to and from Displays
    socket.onAny((eventName, ...args) => {
        if (display) {
            display.emit(eventName, ...args);
        }
    })


    socket.on('disconnect', () => {
        console.log('display disconnected');
    });
});

controlerIO.on('connection', (socket) => {
    console.log('a controler connected');

    socket.on('disconnect', () => {
        console.log('controler disconnected');
    });
})

server.listen(80, () => {
    console.log('Server is listening on port 80');
});