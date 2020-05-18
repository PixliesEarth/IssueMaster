const config = {

        "ownerID": "686669011601326281",

        "admins": [],

        "token": "tokengeoshere",

        "defaultSettings": {
            "prefix": "%",
            "modLogChannel": "mod-log",
            "modRole": "Moderator",
            "adminRole": "Administrator",
            "systemNotice": "true", // This gives a notice when a user tries to run a command that they do not have permission to use.
            "welcomeChannel": "welcome",
            "welcomeMessage": "Say hello to {{user}}, everyone! We all need a warm welcome sometimes :D",
            "welcomeEnabled": "false"
        },

        // PERMISSION LEVEL DEFINITIONS.

        permLevels: [
            {
                level: 0,
                name: "User",
                check: () => true
            },
            {
                level: 2,

                name: "Moderator",

                check: (message) => {
                    try {
                        const modRole = message.guild.roles.find(r => r.name.toLowerCase() === message.settings.modRole.toLowerCase());
                        if (modRole && message.member.roles.has(modRole.id)) return true;
                    } catch (e) {
                        return false;
                    }
                }


            },
            {
                level: 3,
                name: "Administrator",
                check: (message) => {
                    try {
                        const adminRole = message.guild.roles.find(r => r.name.toLowerCase() === message.settings.adminRole.toLowerCase());
                        return (adminRole && message.member.roles.has(adminRole.id));
                    } catch (e) {
                        return false;
                    }
                }
            },
            {
                level: 4,
                name: "Server Owner", 
                // Simple check, if the guild owner id matches the message author's ID, then it will return true.
                // Otherwise it will return false.
                check: (message) => message.channel.type === "text" ? (message.guild.ownerID === message.author.id ? true : false) : false
            },
            
                { level: 8,
                    name: "Bot Support",
                    // The check is by reading if an ID is part of this array. Yes, this means you need to
                    // change this and reboot the bot to add a support user. Make it better yourself!
                    check: (message) => config.support.includes(message.author.id)
                  },
            {
                name: "Bot Admin",
                 check: (message) => config.admins.includes(message.author.id)
            },
            { level: 10,
                name: "Bot Owner", 
                // Another simple check, compares the message author id to the one stored in the config file.
                check: (message) => message.client.config.ownerID === message.author.id
            }

        ]



}

module.exports = config;