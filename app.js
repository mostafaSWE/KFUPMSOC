const express = require("express");
const mysql = require("mysql");
const app = express();
const path = require('path');
app.use(express.static("public"));

// Set up MySQL connection
const connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "ics321",
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to MySQL server");
});

// Set up EJS templating engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Route to display data from MySQL in the frontend
app.get("/", (req, res) => {
  const sql = "SELECT * FROM tournament";
  connection.query(sql, (err, results) => {
    if (err) {
      throw err;
    }
    res.render("home", { tournaments: results });
  });
});

// define the getTournamentData function
function getTournamentData(tournamentId, callback) {
  // define the SQL query to fetch the tournament data
  const sql = `SELECT * FROM tournament WHERE tr_id = ${tournamentId}`;

  // execute the SQL query and handle the result
  connection.query(sql, (error, results, fields) => {
    if (error) {
      callback(error, null);
    } else if (results.length === 0) {
      const error = new Error(`Tournament ${tournamentId} not found`);
      callback(error, null);
    } else {
      const tournamentData = results[0];
      callback(null, tournamentData);
    }
  });
}

// use the getTournamentData function in a route handler
app.get('/tournament', (req, res) => {
  const tournamentId = req.query.id;
  getTournamentData(tournamentId, (error, tournamentData) => {
    if (error) {
      res.status(500).send('Error fetching tournament data');
    } else {
      res.render('tournament', { tournament: tournamentData });
    }
  });
});

// Start the server
app.listen(3000, () => {
  console.log("Server started on port 3000");
});