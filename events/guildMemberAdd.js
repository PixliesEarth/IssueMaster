const SQLite = require("better-sqlite3");
const sql = new SQLite('scores.sqlite');
module.exports = (client, member) => {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();

  today = yyyy + mm + dd;
  
 let stats = sql.prepare(`SELECT * FROM ${guild.id} ORDER BY timestamp DESC LIMIT 1;`);
    
 client.setStats = sql.prepare(`INSERT OR REPLACE INTO ${guild.id} (id, guild, owner, membercount, timestamp) VALUES (@id, @guild, @owner, @membercount, @timestamp);`);










  
  
  
  // Load the guild's settings
  const settings = client.getSettings(member.guild);

  if (settings.welcomeEnabled !== "true") return;

  const welcomeMessage = settings.welcomeMessage.replace("{{user}}", member.user.tag);

  member.guild.channels.find(c => c.name === settings.welcomeChannel).send(welcomeMessage).catch(console.error);
};
