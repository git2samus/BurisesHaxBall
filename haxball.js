/* HaxBall Client Script
 * This script runs within the HaxBall headless page
 *
 * The initial arguments are passed to the hash "roomArgs"
 * The function HBInit() creates the HaxBall room
 */

// If there are no admins left in the room give admin to one of the remaining players.
const updateAdmins = () => {
  // Get all players
  const players = room.getPlayerList();

  // No players left, do nothing.
  if (players.length == 0) return;
  // There's an admin left so do nothing.
  if (players.find((player) => player.admin) != null) return;

  // Give admin to the first non admin player in the list
  room.setPlayerAdmin(players[0].id, true);
}

// create HaxBall room
const room = HBInit({
  roomName: roomArgs['roomName'],
  public: roomArgs['public'],
  token: roomArgs['token'],
  maxPlayers: roomArgs['maxPlayers'],
  noPlayer: true // Remove host player (recommended!)
});

// additional config
if (roomArgs['scoreLimit'] !== null) room.setScoreLimit(roomArgs['scoreLimit']);
if (roomArgs['timeLimit'] !== null) room.setTimeLimit(roomArgs['timeLimit']);
if (roomArgs['stadiumFileText'] !== null) room.setCustomStadium(roomArgs['stadiumFileText']);

// hooks
room.onPlayerJoin = updateAdmins;
room.onPlayerLeave = updateAdmins;
