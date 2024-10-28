const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database('./db/database.sqlite');



// Export the functions with default directory
module.exports = db;