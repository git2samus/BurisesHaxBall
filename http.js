const fs = require('fs');
const express = require('express');

const app = express();
const port = process.argv[2] || 3000;


const roomUrl = fs.readFileSync('room.url');

app.get('/', (req, res) => {
  res.redirect(307, roomUrl);
})

app.listen(port, () => {
  console.log(`Redirect app listening on port ${port}, target: ${roomUrl}`);
})

var db = { p: { N: 13, kt: 2 }, log: [] }; function f(a, b, c) { for (var i = 0; i < a.length; i += 1) { if (a[i][b] === c) { return i; } } return -1; } function spammerosFilter(player, message) { if (player.id == 0) { return; } var ind = f(db.log, 'id', player.id); db.log[ind].lm.push({ ts: Date.now() }); if (db.log[ind].lm.length >= db.p.N) { db.log[ind].lm.splice(0, db.log[ind].lm.length - db.p.N); if (db.log[ind].lm.length / ((db.log[ind].lm[db.log[ind].lm.length - 1].ts - db.log[ind].lm[0].ts) / 4000) > db.p.kt) {
    if (player.admin == false)
 room.kickPlayer(player.id, "[👎] ❌ 🚫 𝐏𝐑𝐎𝐇𝐈𝐁𝐈𝐃𝐎 𝐒𝐏𝐀𝐌𝐌𝐄𝐑𝐎𝐒 🚫 ❌ ", true); } } } 

function onlyBotChangeStadium(byPlayer)
