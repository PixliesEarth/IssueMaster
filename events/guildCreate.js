

module.exports = (client, guild) => {
  client.logger.cmd(`[GUILD JOIN] ${guild.name} (${guild.id}) added the bot. Owner: ${guild.owner.user.tag} (${guild.owner.user.id})`);

  const SQLite = require("better-sqlite3");
  const sql = new SQLite('./scores.sqlite');
  sql.prepare(`CREATE TABLE ${guild.id} (guild TEXT, membercount INTEGER, joins INTEGER, leaves INTEGER, timestamp INTEGER);`).run();
  sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();

  //  client.setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, guild, membercount) VALUES (@id, @guild, @membercount);");
  let score = client.getScore.get(guild.id);
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();

  today = yyyy + mm + dd;
  if (!score) {
    score = {
      id: `${guild.id}`,
      guild: guild.name,
      owner: guild.owner.user.tag,
      membercount: `${guild.members.size}`,
      timestamp: `${today}`,
    }
    client.setScore.run(score);
  }
  // get and log member count every 24 hrs:
  var schedule = require('node-schedule');
  schedule.scheduleJob('0 0 * * *', function (client, guild) {
    console.log('The answer to life, the universe, and everything!');
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = yyyy + mm + dd;
    let arr = guild.members.array();
    console.log(arr);
    let amount = arr.lenght;
    console.log(amount)
    let score = client.getScore.get(guild.id)
    score = {
      id: `${guild.id}`,
      guild: guild.name,
      owner: guild.owner.user.tag,
      membercount: `${amount}`,
      timestamp: `${today}`,
    }




    client.setScore.run(score);
  });




};