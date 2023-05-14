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
// function getTournamentData(tournamentId, callback) {
//   // define the SQL query to fetch the team data for the tournament
//   const sql = `SELECT * FROM team WHERE tr_id = ${tournamentId}`;

//   // execute the SQL query and handle the result
//   connection.query(sql, (error, results, fields) => {
//     if (error) {
//       callback(error, null);
//     } else if (results.length === 0) {
//       const error = new Error(`Tournament ${tournamentId} not found`);
//       callback(error, null);
//     } else {
//       const teamData = results;
//       callback(null, teamData);
//     }
//   });
// }

function getTournamentData(tournamentId, callback) {
  // define the SQL queries to fetch the team data and match data for the tournament
  const teamSql = `SELECT * FROM team WHERE tr_id = ${tournamentId}`;

  const matchSql = `SELECT md.match_no, md.win_lose, mp.play_date, mp.goal_score
    FROM Team tm
    JOIN Match_details md ON tm.team_id = md.team_id
    JOIN Match_played mp ON md.match_no = mp.match_no
    WHERE tm.tr_id = ${tournamentId}
    ORDER BY mp.play_date`;

  // execute the SQL queries and handle the results
  connection.query(teamSql, (error, teamResults, fields) => {
    if (error) {
      callback(error, null);
    } else if (teamResults.length === 0) {
      const error = new Error(`Tournament ${tournamentId} not found`);
      callback(error, null);
    } else {
      const teamData = teamResults;
      connection.query(matchSql, (error, matchResults, fields) => {
        if (error) {
          callback(error, null);
        } else {
          const matchData = matchResults;
          const data = { teams: teamData, matches: matchData };
          callback(null, data);
        }
      });
    }
  });
}

// define the getTournamentData function
// function getTeamData(teamId, callback) {
//   // define the SQL query to fetch the team data for the tournament
//   const sql = `SELECT * FROM player WHERE team_Id = ${teamId}`;

//   // execute the SQL query and handle the result
//   connection.query(sql, (error, results, fields) => {
//     if (error) {
//       callback(error, null);
//     } else if (results.length === 0) {
//       const error = new Error(`Tournament ${tournamentId} not found`);
//       callback(error, null);
//     } else {
//       const teamData = results;
//       callback(null, teamData);
//     }
//   });
// }

// use the getTournamentData function in a route handler
// app.get('/tournament', (req, res) => {
//   const tournamentId = req.query.id;
//   const trName = req.query.tr_name;
//   getTournamentData(tournamentId, (error, teamData) => {
//     if (error) {
//       res.status(500).send('Error fetching tournament data');
//     } else {
//       //console.log(teamData);
//       console.log(trName);
//       res.render('tournament', { teams: teamData, trName });
//     }
//   });
// });


app.get('/tournament', (req, res) => {
  const tournamentId = req.query.id;
  const trName = req.query.tr_name;

  // call the getTournamentData function with the tournamentId
  getTournamentData(tournamentId, (error, data) => {
    if (error) {
      res.status(500).send('Error fetching tournament data');
    } else {
      // render the tournament.ejs template with the teamData and matchData objects
      res.render('tournament', { teams: data.teams, matches: data.matches, trName });
    }
  });
});


app.get('/Team', (req, res) => {
  const teamId = req.query.id;

  // call the getTeamData function with the teamId
  getTeamData(teamId, (error, teamData) => {
    if (error) {
      res.status(500).send('Error fetching team data');
    } else {
      // render the Team.ejs template with the teamData object
      res.render('Team', { team: teamData });
    }
  });
});

app.get('/Sign-in', (req, res) => {
  // Render the Sign-in page
  res.render('Sign-in');
});

app.get('/Sign-up', (req, res) => {
  // Render the Sign-in page
  res.render('Sign-up');
});

app.get('/Admin', (req, res) => {
  // Render the Sign-in page
  res.render('Admin');
});

function getTeamData(teamId, callback) {
  // define the SQL query to fetch the player data for the team
  const sql = `SELECT * FROM player WHERE team_id = ${teamId}`;

  // execute the SQL query and handle the result
  connection.query(sql, (error, results, fields) => {
    if (error) {
      callback(error, null);
    } else if (results.length === 0) {
      const error = new Error(`Team ${teamId} not found`);
      callback(error, null);
    } else {
      const teamData = { teamId: teamId, players: results };
      callback(null, teamData);
    }
  });
}

// Start the server
app.listen(3000, () => {
  console.log("Server started on port 3000");
});