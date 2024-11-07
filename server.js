const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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
            startFullscreen INTEGER,
            startInKiosk INTEGER
        );`,
        `
        CREATE TABLE IF NOT EXISTS cues (
            id INTEGER PRIMARY KEY,
            position FLOAT,
            actions TEXT,
            name TEXT
        );`,
        `
        CREATE TABLE IF NOT EXISTS triggers (
            id INTEGER PRIMARY KEY,
            column INTEGER,
            row INTEGER,
            color TEXT,
            icon TEXT,
            name TEXT,
            actions TEXT
        );`,
        `
        CREATE TABLE IF NOT EXISTS actions (
            id INTEGER PRIMARY KEY,
            type TEXT,
            options TEXT
        );`,
    ];
    createTableQueries.forEach((q)=>{

        db.run(q, function (err) {
            if (err) {
                return reject(err.message);
            }
            console.log('Table checked/created successfully.');
        });
    })
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
        if (displayInfo.displayVersion > 1) {
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
        });

        display.on("sync", (event, ...args)=> {
            controlerIO.emit("displaySync", display.id, event, ...args);
        })
    });

    //Redirect all events to and from Displays
    socket.onAny((eventName, ...args) => {
        if (display) {
            display.emit(eventName, ...args);
        }
    });


    socket.on('disconnect', () => {
        console.log('display disconnected');
    });
});

controlerIO.on('connection', (socket) => {
    console.log('a controler connected');

    socket.emit("actionsSync", "setActions", Actions.getActions());
    socket.emit("displaysSync", "setDisplays", Displays.getDisplays())
    socket.emit("cuesSync", "setCues", Cues.getCues(true));

    socket.on("display", (id, event, ...args)=>{
        Displays.displays[id]?.emit(event, ...args);
    });

    socket.on("actions", (event, ...args) => {
        Actions.emit(event, ...args);
    });
    
    socket.on("cues", (event, ...args) => {
        Cues.emit(event, ...args);
    });

    socket.on('disconnect', () => {
        console.log('controler disconnected');
    });

    socket.onAny((event, ...args)=>{
        console.log(`Controller > ${event}`, ...args);
    })
});

Actions.on("sync", (event, ...args) => {
    controlerIO.emit("actionsSync", event, ...args);
});
Cues.on("sync", (event, ...args) => {
    controlerIO.emit("cuesSync", event, ...args)
});

server.listen(80, () => {
    console.log('Server is listening on port 80');
});


//For debugging.
const v = {};
rl.on('line', (input) => {
    const key = input.slice(0,1);
    const word = input.slice(1);
    switch(key) {
        case("/"): {
            try {
                console.log(eval(word));
            } catch(e){
                console.error(e);
            }
            break;
        }
        case("#"): {
            try {
                db.run(word, function (res, err) {
                    if (err) {
                        console.error(err, err.message);
                    }
                    console.log(res);
                });
            } catch(e) {
                console.error(e);
            }
        }
    }
});