const dataAccess = require('./data_access')
var deletebtn = document.getElementById("btn-delete");
console.log("admin js works");
deletebtn.addEventListener("click",function(event){
console.log("delete button pressed");
if(confirm("Are you sure you want to delete tournament?")==true){

const tournamentTitle=deletebtn.parentElement.parentElement.children[1].innerHTML;
dataAccess.deleteTournamentName(tournamentTitle);
}
});