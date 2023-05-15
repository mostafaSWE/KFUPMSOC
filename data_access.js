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
  console.log("Connected to MySQL server\n");
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

addManger(5555,1244);
module.exports={getCoaches,addCoach,getManagers,addManger};
// Just to end the connection
connection.end();