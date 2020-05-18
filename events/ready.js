
const SQLite = require("better-sqlite3");
const sql = new SQLite('./scores.sqlite');
module.exports = async client => {
  // Log that the bot is online.
  client.logger.log(`${client.user.tag}, ready to serve ${client.users.size} users in ${client.guilds.size} servers.`, "ready");

  // Make the bot "play the game" which is the help command with default prefix.
  client.user.setPresence({
    game: {
      name: `the world burn`,
      type: 'WATCHING'
    },
    status: 'online'
  });



  const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
  if (!table['count(*)']) {

    sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, guild TEXT, owner TEXT, membercount INTEGER, timestamp INTEGER);").run();
    sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  client.getScore = sql.prepare("SELECT * FROM scores WHERE id = ?");
  client.setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, guild, owner, membercount, timestamp) VALUES (@id, @guild, @owner, @membercount, @timestamp);");
  
};
