var tournaments = [
    { name: "Tournament 1", teams: ["Team 1", "Team 2", "Team 3"] },
    { name: "Tournament 2", teams: ["Team 4", "Team 5", "Team 6"] },
    { name: "Tournament 3", teams: ["Team 7", "Team 8", "Team 9"] }
  ];
  
  var addTeamBtn = document.getElementById("add-team-btn");
  addTeamBtn.addEventListener("click", function() {
    var tournamentName = document.getElementById("tournament-name").value;
    var teamName = document.getElementById("team-name").value;
  
    var tournament = tournaments.find(function(t) {
      return t.name === tournamentName;
    });
  
    if (tournament) {
      if (tournament.teams.indexOf(teamName) !== -1) {
        alert("Team already exists in tournament.");
        return;
      }
      tournament.teams.push(teamName);
    } else {
      tournaments.push({ name: tournamentName, teams: [teamName] });
    }
  
    document.getElementById("tournament-name").value = "";
    document.getElementById("team-name").value = "";
  
    var tournamentList = document.getElementById("tournament-list");
    tournamentList.innerHTML = "";
    tournaments.forEach(function(tournament) {
      var tournamentItem = document.createElement("li");
      var tournamentTitle = document.createElement("h2");
      tournamentTitle.textContent = tournament.name;
      tournamentItem.appendChild(tournamentTitle);
  
      var teamsList = document.createElement("ul");
  
      tournament.teams.forEach(function(team) {
        var teamListItem = document.createElement("li");
        teamListItem.textContent = team;
        teamsList.appendChild(teamListItem);
      });
  
      tournamentItem.appendChild(teamsList);
      tournamentList.appendChild(tournamentItem);
    });
  });