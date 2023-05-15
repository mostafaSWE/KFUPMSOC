var teamsAndPlayers = [
    {
      teamName: "Team 1",
      players: ["Player 1", "Player 2", "Player 3"]
    },
    {
      teamName: "Team 2",
      players: ["Player 4", "Player 5", "Player 6"]
    },
    {
      teamName: "Team 3",
      players: ["Player 7", "Player 8", "Player 9"]
    }
  ];
  
  var teamDropdown = document.getElementById("team-name");
  var playerDropdown = document.getElementById("player-name");
  
  teamsAndPlayers.forEach(function(team) {
    var option = document.createElement("option");
    option.value = team.teamName;
    option.text = team.teamName;
    teamDropdown.add(option);
  });
  
  teamDropdown.addEventListener("change", function() {
    playerDropdown.innerHTML = "";
  
    var selectedTeam = teamsAndPlayers.find(function(team) {
      return team.teamName === teamDropdown.value;
    });
  
    selectedTeam.players.forEach(function(player) {
      var option = document.createElement("option");
      option.value = player;
      option.text = player;
      playerDropdown.add(option);
    });
  });  