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
  // db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)");
  // db.run("INSERT INTO users (name) VALUES ('John Doe')");
  // db.each("SELECT id, name FROM users", (err, row) => {
  //   if (err) {
  //     console.error(err.message);
  //   } else {
  //     console.log(`${row.id} - ${row.name}`);
  //   }
  // });
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