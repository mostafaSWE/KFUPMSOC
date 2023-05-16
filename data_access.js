const mysql = require("mysql");

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
  console.log("Data access is connected to MySQL server\n");
});


// Function that gets all the coaches
async function getCoaches(){
    const coachesSql = 'SELECT * FROM coach';
    connection.query(coachesSql, (error, coaches) => {
        if (error) {
          callback(error, null);
        }
        else if (coaches.length === 0) {
          const error = new Error(`Coach not found`);
          callback(error, null);
        } 
        else {
          var coachesData = coaches;
          console.log(coachesData);
        }
    });
}
// getCoaches();

// Function that adds a coach
function addCoach(coachName){
    const coachInsertSql = `INSERT INTO coach (coach_name) VALUES ('${coachName}')`;
    connection.query(coachInsertSql, (error, coachInsert) => {
        if (error) {
          console.log(error);
        }
        else {
          var coachData = coachInsert;
          console.log(coachData);
        }
    });
}

function getManagers(){
    const managersSql = 'SELECT * FROM manager';
    connection.query(managersSql, (error, managers) => {
        if (error) {
          callback(error, null);
        }
        else if (managers.length === 0) {
          const error = new Error(`Manager not found`);
          callback(error, null);
        } 
        else {
          var managersData = managers;
          console.log(managersData);
        }
    });
}

function addManger(managerID,team_id){
    const managersSql = `INSERT INTO manager (manager_id,team_id) VALUES (${managerID},${team_id})`;
    connection.query(managersSql, (error, managers) => {
        if (error) {
          console.log(error);
        }
        else {
          var managersData = managers;
          console.log(managersData);
        }
    });
}


function addTournament(tournamentName,startDate,endDate){
  const tournamentSql = `INSERT INTO tournament (tr_name,start_date,end_date) VALUES ('${tournamentName}','${startDate}','${endDate}')`;
  connection.query(tournamentSql, (error, tournaments) => {
      if (error) {
        console.log(error);
      }
      else {
        console.log(tournaments);
      }
  });
}
// This function uses the tournament name to 
function deleteTournament(tournamentID){
  const tournamentSql = `DELETE FROM tournament WHERE tr_id =${tournamentID}`;
  connection.query(tournamentSql, (error, tournaments) => {
      if (error) {
        console.log(error);
      }
      else {
        console.log(tournaments);
      }
  });
}
// addTournament("Turki Tournament","2023-5-10","2023-6-10");
// deleteTournament(12);


function getSignIN(Email,Password,callback){
  // console.log("The entered email is :"+Email);
  // console.log("The entered password is :" + Password);
  const signInSql =`SELECT * FROM admins WHERE email='${Email}' AND password='${Password}'`;
  connection.query(signInSql, (error, signIn) => {
      if (error) {
        let message = "The sign in information is wrong";
        console.log(error);
        callback(message, null);
      }
      else {
        callback(null, signIn);
      }
  });
}
function newSignUP(Name,Email,Password,Phone,callback){
  const signUpSql = `INSERT INTO admins (name,email,password,phone) VALUES ('${Name}','${Email}','${Password}','${Phone}')`;
  connection.query(signUpSql, (error, signUp) => {
      if (error) {
        console.log(error);
        callback(error,null);
      }
      else {
        callback(null,signUp);
      }
  });
}
// newSignUP("Mostafa","m@gmail.com","123456","0500000000");
module.exports={getCoaches,addCoach,getManagers,addManger,addTournament,deleteTournament,deleteTournamentName,getSignIN,newSignUP};
// Just to end the connection
