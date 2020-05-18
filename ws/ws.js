const express = require('express');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');
const SQLite = require("better-sqlite3");
const sql = new SQLite('./issues.sqlite');
var cookies = require('cookies');
//const top10 = sql.prepare("SELECT * FROM scores ORDER BY membercount DESC LIMIT 10;").all();
//const mems = sql.prepare("SELECT * FROM scores ORDER BY timestamp DESC LIMIT 10;").all();

const OAuthClient = require('disco-oauth')
const expAutoSan = require('express-autosanitizer');
const config = require('./ws_config.json')
let oauthClient = new OAuthClient(config.client_id, config.client_secret)
oauthClient.setScopes('identify', 'guilds', 'email')
oauthClient.setRedirect('https://www.backonthe.rocks/validator')

const fs = require('fs');


class WebSocket {

    constructor(token, port, client) {
        this.token = token
        this.client = client

        this.app = express()
        this.app.engine('hbs', hbs({
            extname: 'hbs',
            defaultLayout: 'layout',
            layoutsDir: __dirname + '/layouts'
        }))
        this.app.set('views', path.join(__dirname, 'views'))
        this.app.set('view engine', 'hbs')
        this.app.use(express.static(path.join(__dirname, 'public')))
        this.app.use(bodyParser.urlencoded({
            extended: false
        }))
        this.app.unsubscribe(bodyParser.json())
        this.app.use(cookies.express(["some", "random", "keys"]));

        this.registerRoots()
        
        this.server = this.app.listen(port, () => {
            console.log(`Websocket listening on port ${port}`)
        })
    }


    checkToken(_token) {
        const guilds = sql.prepare("SELECT * FROM guilds").all();
        console.log(guilds)
        const len = guilds.length;
        for (var i = 0; i < len; i++) {
            if (guilds[i].guildid == _token)
                return true;
        }
        return false
    }





    registerRoots() {


        this.app.get('/', (req, res) => {
            const openissues = sql.prepare("SELECT * FROM issues WHERE tag = ? ORDER BY severity").all("open").reverse();
            //const top10_new = top10.reverse();
            const activeissues = sql.prepare("SELECT * FROM issues WHERE tag = ? ORDER BY severity").all("active").reverse();
            const closedissues = sql.prepare("SELECT * FROM issues WHERE tag = ? ORDER BY severity").all("closed").reverse();
            const suggestions = sql.prepare("SELECT * FROM issues WHERE tag = ? ORDER BY severity").all("suggestion").reverse();





            res.render('open_issues', {
                title: "Pixliesearth Issue Tracker",
                activeIssues: activeissues,
                openIssues: openissues,
                suggestions: suggestions,
                closedIssues: closedissues,

            })
        })

        this.app.get('/submitissues/', async (req, res) => {
            let key = req.cookies.get('key')


            if (key) {

                let user = await oauthClient.getUser(key);
                const blacklist = sql.prepare("SELECT * FROM blacklist WHERE id = ?;").all(user.id)
                let guilds = await oauthClient.getGuilds(key).then(guilds => {
                    console.log(blacklist.id)
                    if (guilds.has(`${config.guild_id}`) == true) {
                        if (user.emailVerified == true) {
                            if (blacklist.id == undefined) {
                                let finalname = user.username + "#" + user.discriminator
                                res.render('submit_issue', {
                                    title: "Submit an Issue",
                                    name: finalname
                                })
                            } else res.redirect('/blacklisterror')
                        } else res.redirect('/emailerror');
                    } else res.redirect('/guilderror');

                })
            } else {
                res.redirect('/login')
            }

        });

        this.app.get('/blacklistuser', (req, res) => {
            res.render('blacklistuser', {
                title: "User blacklisting"
            })
        })

        this.app.get('/guilderror', (req, res) => {
            res.render('error', {
                title: "Error - required guild missing",
                errormessage: "You are not on the Pixlies Earth Discord, which you are required to be, to sumbit issues here.",
            })
        })

        this.app.get('/emailerror', (req, res) => {
            res.render('error', {
                title: " Error - Unverified email",
                errormessage: "Your Email Adress seems to be not verified, please verifiy it on discord to submit issues.",
            })
        })

        this.app.get('/blacklisterror', (req, res) => {
            res.render('error', {
                title: "Error - Blacklisted User",
                errormessage: "Seems like you are blacklisted from submitting issues. I hate being the one telling you :/"
            })
        })

        this.app.get('/login', (req, res) => {
            res.render('login', {
                title: "Seems like your not logged in",
                url: "https://discordapp.com/oauth2/authorize?response_type=code&client_id=693084288513736735&scope=identify%20guilds%20email&redirect_uri=https://www.backonthe.rocks/validator",
            })
        })

        this.app.post('/editissue/', async (req, res) => {
            const text = req.body.text
            const id = req.body.id
            const tag = req.body.tag
            const severity = await req.body.severity

            sql.prepare(`UPDATE issues SET severity = '${severity}' WHERE id = '${id}';`).run()
            sql.prepare(`UPDATE issues SET tag = '${tag}' WHERE id = '${id}'`).run()
            sql.prepare(`UPDATE issues SET assigned = '${text}' WHERE id = '${id}'`).run()

            res.redirect('/admin')
        })

        this.app.get('/registeradmin', (req, res) => {
            res.render('registeradmin', {
                title: "Admin Registration"
            })
        })

        this.app.post('/registeredadmin', async (req, res) => {
            const test = req.body.userid
            const key = res.cookies.get('key');
            let user = await oauthClient.getUser(key)
            let ID = test
            let score = {
                id: ID,
                isadmin: "yes",
                avatarurl: "testurls",
            }
            sql.prepare("INSERT OR REPLACE INTO users (id, isadmin, avatarurl) VALUES (@id, @isadmin, @avatarurl);").run(score);
            res.redirect('/admin')
        })

        this.app.post('/removedadmin', async (req, res) => {
            const test = req.body.userid
            
            sql.prepare("DELETE FROM users WHERE id =?;").run(test);
            res.redirect('/admin')
        })


        this.app.post('/blacklisteduser', async (req, res) => {
            const test = req.body.userid
            const key = res.cookies.get('key');
            let ID = test
            let score = {
                id: ID,
            }
            sql.prepare("INSERT OR REPLACE INTO blacklist (id) VALUES (@id);").run(score);
            res.redirect('/admin')
        })

        this.app.post('/unblacklisteduser', async (req, res) => {
            const test = req.body.userid
            
            sql.prepare("DELETE FROM blacklist WHERE id = ?;").run(test);
            res.redirect('/admin')
        })

        this.app.post('/deleteissue', (req, res) => {
            const tocheck = req.body.tocheck
            const check = req.body.check
            console.log(check, tocheck);
            if (check == tocheck) {
                sql.prepare("DELETE FROM issues WHERE id = ?;").run(check)
                res.redirect('/admin')
            } else {
                res.send("Invalid ID")
            }
        })

        this.app.get('/admin', async (req, res) => {
            let key = req.cookies.get('key')
            if (key) {
                let user = await oauthClient.getUser(key)
                console.log(user.id);
                const isadmin = sql.prepare("SELECT * FROM users WHERE id =?;").all(user.id)
                if (isadmin) {
                    for (const data of isadmin) {
                        console.log(data.isadmin)
                        if (data.isadmin == "yes") {
                            const openissues = sql.prepare("SELECT * FROM issues WHERE tag = ? ORDER BY severity").all("open").reverse();
                            //const top10_new = top10.reverse();
                            const activeissues = sql.prepare("SELECT * FROM issues WHERE tag = ? ORDER BY severity").all("active").reverse();
                            const closedissues = sql.prepare("SELECT * FROM issues WHERE tag = ? ORDER BY severity").all("closed").reverse();
                            const suggestions = sql.prepare("SELECT * FROM issues WHERE tag = ? ORDER BY severity").all("suggestion").reverse();
                            res.render('admin', {
                                title: "Issue Tracker Dashboard",
                                activeIssues: activeissues,
                                openIssues: openissues,
                                suggestions: suggestions,
                                closedIssues: closedissues,
                            })
                        
                        } else res.redirect('/')
                    }
                } else res.redirect('/')

            } else {
                res.render('login', {
                    errtype: "Seems like your not logged in",
                    url: "https://discordapp.com/oauth2/authorize?response_type=code&client_id=693084288513736735&scope=identify%20guilds%20email&redirect_uri=https://www.backonthe.rocks/validator",
                })
            }
        })


        this.app.get('/removeadmin', (req, res) =>{
            res.render('removeadmin', {
                title: "Admin - Remove Admin"
            })
        })

        this.app.get('/unblacklistuser', (req, res) => {
            res.render('unblacklistuser', {
                title: "Admin - Unblacklist User",
            })
        })

        this.app.get('/validator', async (req, res) => {
            let code = req.query.code;
            if (code == undefined) {
                res.send("Auth code is not defined")
            } else {
                let key = await oauthClient.getAccess(req.query.code).catch(console.error);
                res.cookies.set('key', key);


                res.redirect('/')
            }

        });

        this.app.post('/issueposted', expAutoSan.route, (req, res) => {
            function makeid(length) {
                var result = '';
                var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                var charactersLength = characters.length;
                for (var i = 0; i < length; i++) {
                    result += characters.charAt(Math.floor(Math.random() * charactersLength));
                }
                return result;
            }
            console.log("yo")
            const text = req.autosan.body.text
            const severity = req.autosan.body.severity
            const author = req.autosan.body.author
            console.log(severity)
            console.log(text)
            console.log(author)
            var random = makeid(16)
            let issue = {
                id: random,
                desc: text,
                author: author,
                severity: severity,
                tag: "open",
                assigned: "no one",
            }
            sql.prepare("INSERT OR REPLACE INTO issues (id, desc, author, severity, tag, assigned) VALUES (@id, @desc, @author, @severity, @tag, @assigned);").run(issue)
            res.redirect('/')

        })


    }
}




module.exports = WebSocket
