/* HaxBall Client Script
 * This script runs within the HaxBall headless page
 *
 * The initial arguments are passed to the hash "roomArgs"
 * The function HBInit() creates the HaxBall room
 */

HBInit(roomArgs);

// If there are no admins left in the room give admin to one of the remaining players.
const updateAdmins = () => {
  // Get all players
  const players = room.getPlayerList();

  // No players left, do nothing.
  if (players.length == 0) return;
  // There's an admin left so do nothing.
  if (players.find((player) => player.admin) != null ) return;

  // Give admin to the first non admin player in the list
  room.setPlayerAdmin(players[0].id, true);
}

// hooks
room.onPlayerJoin = updateAdmins;
room.onPlayerLeave = updateAdmins;
