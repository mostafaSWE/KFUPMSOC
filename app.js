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

function getPlayerWithMostGoals(callback) {
  const sql = `
    SELECT player.player_name, SUM(goal_details.goal_type = 'N') AS goals
    FROM player
    JOIN goal_details ON player.player_id = goal_details.player_id
    GROUP BY player.player_name
    ORDER BY goals DESC
    LIMIT 1
  `;
  connection.query(sql, callback);
}

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
      const message = error.includes('not found') ? `No data available for tournament ${tournamentId}` : 'Error fetching tournament data';
      res.render('tournament', { error: message });
    } else {
      // render the tournament.ejs template with the teamData and matchData objects
      res.render('tournament', { teams: data.teams, matches: data.matches, trName });
    }
  });
});
function getTournamentData(tournamentId, callback) {
  // define the SQL queries to fetch the team data and match data for the tournament
  const teamSql = `SELECT * FROM team WHERE tr_id = ${tournamentId}`;

  const matchSql = `SELECT match_played.match_no, match_played.play_date, match_played.results, team.team_id, team.tr_id, tournament.tr_name
  FROM match_played
  JOIN team ON match_played.match_no = team.match_played
  JOIN tournament ON team.tr_id = tournament.tr_id
  WHERE tournament.tr_id = ${tournamentId}
  ORDER BY match_played.play_date ASC;`;

  // execute the SQL queries and handle the results
  connection.query(teamSql, (error, teamResults, fields) => {
    if (error) {
      callback(`Error executing SQL query: ${teamSql}`);
    } else if (teamResults.length === 0) {
      callback(`Tournament ${tournamentId} not found`);
    } else {
      const teamData = teamResults;
      connection.query(matchSql, (error, matchResults, fields) => {
        if (error) {
          callback(`Error executing SQL query: ${matchSql}`);
        } else {
          const matchData = matchResults;
          const data = { teams: teamData, matches: matchData };
          callback(null, data);
        }
      });
    }
  });
}


app.get('/Team', (req, res) => {
  const teamId = req.query.id;

  // call the getTeamData function with the teamId
  getTeamData(teamId, (error, teamData) => {
    if (error) {
      res.status(500).send('Error fetching team data');
    } else {
      // render the Team.ejs template with the teamData object, including coach, manager, captain, and red card data
      res.render('Team', {
        team: teamData,
        coach: teamData.coach,
        manager: teamData.manager,
        captain: teamData.captain,
        redCards: teamData.redCards, // add red card data to template
        teamId: teamId
      });
    }
  });
});
function getTeamData(teamId, callback) {
  // define the SQL queries to fetch the player, coach, manager, and captain data for the team
  const playerSql = `SELECT * FROM player WHERE team_id = ${teamId}`;
  const coachSql = `SELECT * FROM team_coaches WHERE team_id = ${teamId}`;
  const managerSql = `SELECT * FROM team_manager WHERE team_id = ${teamId}`;
  const captainSql = `SELECT * FROM match_captain WHERE team_id = ${teamId}`;
  // New query to fetch players with red cards for the team
  const redCardSql = `SELECT player.player_name, COUNT(player_cards.card_type) AS red_cards
  FROM player
  JOIN player_cards ON player.player_id = player_cards.player_id
  WHERE player_cards.team_id = ${teamId} AND player_cards.card_type = 'R'
  GROUP BY player.player_id, player.player_name;`;

  // execute the SQL queries and handle the results
  connection.query(playerSql, (error, playerResults, fields) => {
    if (error) {
      callback(error, null);
    } else if (playerResults.length === 0) {
      const error = new Error(`Team ${teamId} not found`);
      callback(error, null);
    } else {
      const teamData = { teamId: teamId, players: playerResults };
      connection.query(coachSql, (error, coachResults, fields) => {
        if (error) {
          callback(error, null);
        } else {
          teamData.coach = coachResults[0];
          connection.query(managerSql, (error, managerResults, fields) => {
            if (error) {
              callback(error, null);
            } else {
              teamData.manager = managerResults[0];
              connection.query(captainSql, (error, captainResults, fields) => {
                if (error) {
                  callback(error, null);
                } else {
                  teamData.captain = captainResults[0];
                  // Execute the red card query and add the results to the teamData object
                  connection.query(redCardSql, (error, redCardResults, fields) => {
                    if (error) {
                      callback(error, null);
                    } else {
                      teamData.redCards = redCardResults;
                      callback(null, teamData);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}

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