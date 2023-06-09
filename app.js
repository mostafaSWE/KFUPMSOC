const express = require("express");
const mysql = require("mysql");
const app = express();
const path = require('path');
const dataAccess = require('./data_access')
app.use(express.static("public"));

// Set up MySQL connection
const connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "ics321-2",
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
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const flash = require('connect-flash');
app.use(flash());

// Route to display data from MySQL in the frontend
// app.get("/", (req, res) => {
//   const sql = "SELECT * FROM tournament";
//   connection.query(sql, (err, results) => {
//     if (err) {
//       throw err;
//     }
//     res.render("home", { tournaments: results });
//   });
// });

app.get('/', (req, res) => {
  const tournamentSql = 'SELECT * FROM tournament';
  connection.query(tournamentSql, (tournamentError, tournamentResults) => {
    if (tournamentError) {
      throw tournamentError;
    }
    getPlayerWithMostGoals((playerError, playerResult) => {
      if (playerError) {
        throw playerError;
      }
      res.render('home', {
        tournaments: tournamentResults,
        mostGoalsPlayer: playerResult[0]
      });
    });
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
app.get('/Tournament-Admin', (req, res) => {
  const tournamentId = req.query.id;
  const trName = req.query.tr_name;

  // call the getTournamentData function with the tournamentId
  getTournamentData(tournamentId, (error, data) => {
    if (error) {
      const message = error.includes('not found') ? `No data available for tournament ${tournamentId}` : 'Error fetching tournament data';
      res.render('Tournament-Admin', { error: message });
    } else {
      // render the tournament.ejs template with the teamData and matchData objects
      res.render('Tournament-Admin', { teams: data.teams, matches: data.matches, trName });
    }
  });
});
function getTournamentData(tournamentId, callback) {
  // define the SQL queries to fetch the team data and match data for the tournament
  const teamSql = `SELECT * FROM team WHERE tr_id = ${tournamentId}`;

  const matchSql = `SELECT mp.play_date, md.match_no, t1.team_id AS team1_id, t2.team_id AS team2_id,
  md.play_stage, md.win_lose, md.decided_by, md.goal_score, md.penalty_score
FROM match_played mp
JOIN match_details md ON mp.match_no = md.match_no
JOIN team t1 ON md.team_id = t1.team_id
JOIN team t2 ON t1.tr_id = t2.tr_id AND md.team_id <> t2.team_id
WHERE t1.tr_id = 1 -- replace with the ID of the desired tournament
ORDER BY mp.play_date;`;

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

app.post('/join-team', (req, res) => {
  const { player_id, team_id, jersey_no, player_name, position_to_play, dt_of_bir } = req.body;

  // validate form fields
  if (!player_id || !team_id || !jersey_no || !player_name || !position_to_play || !dt_of_bir) {
    res.status(400).send('All fields are required.');
    return;
  }

  // check if the player has already sent a join request
  const checkQuery = 'SELECT * FROM join_requests WHERE player_id = ? AND team_id = ?';
  connection.query(checkQuery, [player_id, team_id], (checkError, checkResults) => {
    if (checkError) {
      console.error(checkError);
      res.status(500).send('Error joining team. Please try again later.');
      return;
    }

    if (checkResults.length > 0) {
      res.status(400).send('You have already sent a join request to this team.');
      return;
    }

    // insert player into join_requests table
    const insertQuery = 'INSERT INTO join_requests(player_id, team_id, jersey_no, player_name, position_to_play, dt_of_bir) VALUES (?, ?, ?, ?, ?, ?)';
    connection.query(insertQuery, [player_id, team_id, jersey_no, player_name, position_to_play, dt_of_bir], (insertError, insertResults) => {
      if (insertError) {
        console.error(insertError);
        res.status(500).send('Error joining team. Please try again later.');
        return;
      }
      // Redirect to the team page with a success message
      res.redirect(`/team?id=${team_id}&message=Join request sent successfully`);
    });
  });
});
app.get('/Team-Admin', (req, res) => {
  const teamId = req.query.id;

  // call the getTeamData function with the teamId
  getTeamData(teamId, (error, teamData) => {
    if (error) {
      const errorMessage = 'No data available for'+ teamId;
      res.render('Team-Admin', {
        errorMessage: errorMessage,
        teamId: teamId
      });
    } else {
      // render the Team.ejs template with the teamData object, including coach, manager, captain, and red card data
      res.render('Team-Admin', {
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

// app.js

// handle POST request to /add-captain route
app.post('/add-captain', (req, res) => {
  const { team_id, captain_id, match_no } = req.body;

  // validate form fields
  if (!team_id || !captain_id || !match_no) {
    res.status(400).send('All fields are required.');
    return;
  }

  // insert row into match_captain table
  const insertQuery = 'INSERT INTO match_captain(match_no, team_id, player_captain) VALUES (?, ?, ?)';
  connection.query(insertQuery, [match_no, team_id, captain_id], (insertError, insertResult) => {
    if (insertError) {
      console.error(insertError);
      res.status(500).send('An error occurred while adding the captain.');
      return;
    }

    // Redirect to the team page with a success message
    res.redirect(`/team?id=${team_id}&message=Captain added successfully`);
  });
});
app.get('/Team', (req, res) => {
  const teamId = req.query.id;
  console.log(teamId);

  // call the getTeamData function with the teamId
  getTeamData(teamId, (error, teamData) => {
    if (error) {
      const errorMessage = 'No data available for'+ teamId;
      res.render('Team', {
        errorMessage: errorMessage,
        teamId: teamId
      });
    } else {
      console.log(teamData);
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
  // check if qurey has anything inside it
  if(req.query !== 0){
    var signInInfo= req.query;
    // console.log("This is sign in info:"+JSON.stringify(signInInfo.email))
    dataAccess.getSignIN(signInInfo.email, signInInfo.password, (error, signData) => {
      if (error) {
        console.log(error);
        res.render('Sign-in');
      }
      else {
        if (signData.length == 0) {
          res.render('Sign-in');
        }
        else{
          console.log(signData);
          const tournamentSql = 'SELECT * FROM tournament';
          connection.query(tournamentSql, (tournamentError, tournamentResults) => {
            if (tournamentError) {
              throw tournamentError;
            }
            getPlayerWithMostGoals((playerError, playerResult) => {
              if (playerError) {
                throw playerError;
              }
              res.render('admin', {
                tournaments: tournamentResults,
                mostGoalsPlayer: playerResult[0]
              });
            });
          });
        } 
      }
    });
  }

//if query is empty
else{
    res.render('Sign-in');
  }
  
});

app.get('/Sign-up', (req, res) => {
  if(req.query !== 0){
    var signInInfo= req.query;
    // console.log("This is sign in info:"+JSON.stringify(signInInfo.email))
    dataAccess.newSignUP(signInInfo.name,signInInfo.email, signInInfo.password,signInInfo.phone, (error, signData) => {
      if (error) {
        console.log(error);
        res.render('Sign-up');
      }
      else {
        if (signData.length == 0) {
          res.render('Sign-up');
        }
        else {
          // console.log("Raw data is "+signData);
          const tournamentSql = 'SELECT * FROM tournament';
          connection.query(tournamentSql, (tournamentError, tournamentResults) => {
            if (tournamentError) {
              throw tournamentError;
            }
            getPlayerWithMostGoals((playerError, playerResult) => {
              if (playerError) {
                throw playerError;
              }
              res.render('admin', {
                tournaments: tournamentResults,
                mostGoalsPlayer: playerResult[0]
              });
            });
          });
        }
      }
    });
  }

//if query is empty
else{
    res.render('Sign-up');
  }
  
});

app.get('/viewRequests', (req, res) => {
  const joinRequestsSql = 'SELECT * FROM join_requests';

  connection.query(joinRequestsSql, (joinRequestsError, joinRequestsResults) => {
    if (joinRequestsError) {
      console.error('Error retrieving join requests:', joinRequestsError);
      res.status(500).send('An error occurred while retrieving join requests');
      return;
    }

    console.log(joinRequestsResults);

    res.render('viewRequests', {
      joinRequests: joinRequestsResults
    });
  });
});
// handle GET request to /admin route

app.get('/Admin', (req, res) => {
  const tournamentSql = 'SELECT * FROM tournament';
  
      connection.query(tournamentSql, (tournamentError, tournamentResults) => {
      if (tournamentError) {
      throw tournamentError;
      }
      getPlayerWithMostGoals((playerError, playerResult) => {
      if (playerError) {
      throw playerError;
      }
    res.render('admin', {
    tournaments: tournamentResults,
    mostGoalsPlayer: playerResult[0]
        });
      });
    });
  });

// handle POST request to /approve-request route
// handle POST request to /approve-request route
app.post('/approve-request', (req, res) => {
  const { player_id, team_id, jersey_no, player_name, position_to_play, dt_of_bir } = req.body;

  // insert row into player table
  const insertQuery = 'INSERT INTO player(player_id, team_id, jersey_no, player_name, position_to_play, dt_of_bir) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(insertQuery, [player_id, team_id, jersey_no, player_name, position_to_play, dt_of_bir], (insertError, insertResult) => {
    if (insertError) {
      console.error(insertError);
      res.status(500).send('An error occurred while approving the request.');
      return;
    }

    // delete row from join_requests table
    const deleteQuery = 'DELETE FROM join_requests WHERE player_id = ? AND team_id = ?';
    connection.query(deleteQuery, [player_id, team_id], (deleteError, deleteResult) => {
      if (deleteError) {
        console.error(deleteError);
        res.status(500).send('An error occurred while approving the request.');
        return;
      }

      // Redirect to the viewRequests page with a success message
      res.redirect('/viewRequests?message=Request approved successfully');
    });
  });
});

// handle POST request to /reject-request route
app.post('/reject-request', (req, res) => {
  const { player_id, team_id } = req.body;

  // delete row from join_requests table
  const deleteQuery = 'DELETE FROM join_requests WHERE player_id = ? AND team_id = ?';
  connection.query(deleteQuery, [player_id, team_id], (deleteError, deleteResult) => {
    if (deleteError) {
      console.error(deleteError);
      res.status(500).send('An error occurred while rejecting the request.');
      return;
    }

    // Redirect to the viewRequests page with a success message
    res.redirect('/viewRequests?message=Request rejected successfully');
  });
});

app.get('/add-tournament', (req, res) => {
  // Render the add-tournament page
  if(Object.keys(req.query).length !==0){
    console.log("insdie")
    const request = req.query;
    dataAccess.addTournamentWithID(request.tournamentId,request.tournamentName,request.startDate,request.endDate,(error,tournament)=>{
      if (error) {
        console.log(error);
        const tournamentSql = 'SELECT * FROM tournament';
  
        connection.query(tournamentSql, (tournamentError, tournamentResults) => {
        if (tournamentError) {
        throw tournamentError;
        }
        getPlayerWithMostGoals((playerError, playerResult) => {
        if (playerError) {
        throw playerError;
        }
        res.render('admin', {
        tournaments: tournamentResults,
        mostGoalsPlayer: playerResult[0]
          });
        });
      
      });
    }
          else{
            if(tournament.length==0){
              console.log("Error from returned data");
              const tournamentSql = 'SELECT * FROM tournament';
      
              connection.query(tournamentSql, (tournamentError, tournamentResults) => {
              if (tournamentError) {
              throw tournamentError;
              }
              getPlayerWithMostGoals((playerError, playerResult) => {
              if (playerError) {
              throw playerError;
              }
              res.render('admin', {
              tournaments: tournamentResults,
              mostGoalsPlayer: playerResult[0]
                });
              });
            });
            }
            else{
              console.log("Success entering team");
              const tournamentSql = 'SELECT * FROM tournament';
      
              connection.query(tournamentSql, (tournamentError, tournamentResults) => {
              if (tournamentError) {
              throw tournamentError;
              }
              getPlayerWithMostGoals((playerError, playerResult) => {
              if (playerError) {
              throw playerError;
              }
              res.render('admin', {
              tournaments: tournamentResults,
              mostGoalsPlayer: playerResult[0]
              });
            });
          });
        };  
      };
    }) 
  }

  else{
    res.render('add-tournament');
  }
});

app.get('/add-team-to-tournament', (req, res) => {
  if(Object.keys(req.query).length !==0){
    console.log("insdie")
  // Render the add-team-to-tournament page
  const request = req.query;
  const teamID = request.team_id;
  const trID = request.tr_id;
  const teamGroup = request.team_group;
  const matchPlayed = request.match_played;
  const won = request.won;
  const draw = request.draw;
  const lost = request.lost;
  const goal_for = request.goal_for;
  const goal_against = request.goal_against;
  const goal_diff = request.goal_diff;
  const points = request.points;
  const group_position = request.group_position;

  
  dataAccess.addTeam(teamID,trID,teamGroup,matchPlayed,won,draw,lost,goal_for,goal_against,goal_diff,points,group_position,(error, teamData) => {
    if (error) {
      console.log(error);
      const tournamentSql = 'SELECT * FROM tournament';

      connection.query(tournamentSql, (tournamentError, tournamentResults) => {
      if (tournamentError) {
      throw tournamentError;
      }
      getPlayerWithMostGoals((playerError, playerResult) => {
      if (playerError) {
      throw playerError;
      }
      res.render('admin', {
      tournaments: tournamentResults,
      mostGoalsPlayer: playerResult[0]
        });
      });
    
    });
  }
        else{
          if(teamData.length==0){
            console.log("Error from returned data");
            const tournamentSql = 'SELECT * FROM tournament';
    
            connection.query(tournamentSql, (tournamentError, tournamentResults) => {
            if (tournamentError) {
            throw tournamentError;
            }
            getPlayerWithMostGoals((playerError, playerResult) => {
            if (playerError) {
            throw playerError;
            }
            res.render('admin', {
            tournaments: tournamentResults,
            mostGoalsPlayer: playerResult[0]
              });
            });
          });
          }
          else{
            console.log("Success entering team");
            const tournamentSql = 'SELECT * FROM tournament';
    
            connection.query(tournamentSql, (tournamentError, tournamentResults) => {
            if (tournamentError) {
            throw tournamentError;
            }
            getPlayerWithMostGoals((playerError, playerResult) => {
            if (playerError) {
            throw playerError;
            }
            res.render('admin', {
            tournaments: tournamentResults,
            mostGoalsPlayer: playerResult[0]
            });
          });
        });
      };  
    };
  });
  }
  else{
    res.render('add-team-to-tournament');
  }
});

app.get('/delete-tournament', (req, res) => {
  const tournamentId = req.query.id;
  const trName = req.query.tr_name;
  const sql = `SELECT * FROM tournament WHERE tr_id = ${tournamentId} AND tr_name='${trName}'`;
  console.log(req.query);
  // call the getTournamentData function with the tournamentId
  connection.query(sql, (error, data) => {
    if (error) {
      res.render('delete-tournament', { error:error});
    } else if(data.length ==0) {
      console.log("Erorr in returned data");
      res.render("admin")
    }
    else{  // render the deelete-tournament.ejs template with the teamData and matchData objects
      res.render('delete-tournament', { tournamentId, trName });
      dataAccess.deleteTournament(tournamentId);
    }
  });
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