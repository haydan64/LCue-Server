const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database('./db/database.sqlite')

const Tables = {
  triggers: {
    name: String,
    id: Number,
    triggers: Number
  },
  cueLists: {
    name: String,
    id: Number
  },
  cues: {
    description: String,
    id: Number,
    position: Number,
    list: Number,
    triggers: Number
  },
  actions: {
    id: Number,
    action: Array(JSON),
  },
  display: {
    name: String,
    id: Number
  }
}

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

  // Receive commands from the control page and broadcast them
  socket.on('showImage', (imageUrl) => {
    io.emit('showImage', imageUrl);
  });

  // Handle other commands like playing videos and audio
  socket.on('disconnect', () => {
    console.log('device disconnected');
  });
});

server.listen(80, () => {
  console.log('Server is listening on port 80');
});