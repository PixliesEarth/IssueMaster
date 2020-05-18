
if (Number(process.version.slice(1).split(".")[0]) < 8) throw new Error("Node 8.0.0 or higher is required. Update Node on your system.");


const Discord = require("discord.js");
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);
const Enmap = require("enmap");
const WS = require('./ws/ws')

const client = new Discord.Client();

client.config = require("./config.js");

client.logger = require("./modules/Logger");

require("./modules/functions.js")(client);


client.commands = new Enmap();
client.aliases = new Enmap();

client.settings = new Enmap({name: "settings"});

const init = async () => {


  const cmdFiles = await readdir("./commands/");
  client.logger.log(`Loading a total of ${cmdFiles.length} commands.`);
  cmdFiles.forEach(f => {
    if (!f.endsWith(".js")) return;
    const response = client.loadCommand(f);
    if (response) console.log(response);
  });


  const evtFiles = await readdir("./events/");
  client.logger.log(`Loading a total of ${evtFiles.length} events.`);
  evtFiles.forEach(file => {
    const eventName = file.split(".")[0];
    client.logger.log(`Loading Event: ${eventName}`);
    const event = require(`./events/${file}`);

    client.on(eventName, event.bind(null, client));
  });

  // Generate a cache of client permissions for pretty perm names in commands.
  client.levelCache = {};
  for (let i = 0; i < client.config.permLevels.length; i++) {
    const thisLevel = client.config.permLevels[i];
    client.levelCache[thisLevel.name] = thisLevel.level;
  }

  

// Expess, webserver part, alles hier drunter is wichtig
  
var ws= new WS('6898474744', 3000, client)
  
  
  
  // Here we login the client.
  client.login(client.config.token);



// End top-level async/await function.
};

init();
