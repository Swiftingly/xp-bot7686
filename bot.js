const Discord = require('discord.js');
const bot = new Discord.Client();
const sql = require('sqlite');
sql.open('./scores.sqlite');

const config = require('./config.json');
const prefix = config.prefix;
const token = config.token;

bot.on('ready', () => {
	console.log(`Bot ${bot.user.username} is on`);
	bot.user.setPresence({game:{name:'for ' + prefix, type:'WATCHING'}});
});

bot.on('message', (message) => {
	if (message.author.bot) return;
	if (message.channel.type === 'dm') return;
	
	if (message.content.substring(0, prefix.length) === prefix) {
		var args = message.content.substring(prefix.length).trim().split(/ +/g);
		
		switch (args[0].toUpperCase()) {
			case 'TEST': {
				message.channel.send('Nice test');
				break;
			}
			case 'STATS': {
				sql.get(`SELECT * FROM scores WHERE userId = ${message.author.id}`).then(row => {
					var stats = new Discord.RichEmbed()
					.setAuthor(message.author.tag, message.author.avatarURL)
					.setColor('#0099cc')
					.addField('Exp', row.xp, true)
					.addField('Level', row.level, true)
					.addField('Exp until next level', (Math.pow(row.level*4, 2)-row.xp), true);
					message.channel.send(stats);
				}).catch(() => {
					var stats = new Discord.RichEmbed()
					.setAuthor(message.author.tag, message.author.avatarURL)
					.setColor('#0099cc')
					.addField('Exp', '0', true)
					.addField('Level', '1', true)
					.addField('Exp until next level', '16', true);
					message.channel.send(stats);
				});
				break;
			}
		}
	}
	else {
		sql.get(`SELECT * FROM scores WHERE userId = ${message.author.id}`).then(row => {
			if (!row) {
				sql.run('INSERT INTO scores (userId, xp, level) VALUES (?, ?, ?)', [message.author.id, 1, 1]);
			}
			else {
				var xp = row.xp+1;
				var level = row.level;
				
				if (xp >= Math.pow(level*4, 2)) {
					xp = xp - Math.pow(level*4, 2);
					level = level + 1;
					message.channel.send(`Congratulations ${message.author}, you leveled up to level **${level}**`);
				}
				
				sql.run(`UPDATE scores SET xp = ${xp}, level = ${level} WHERE userId = ${message.author.id}`);
			}
		}).catch(() => {
			sql.run('CREATE TABLE IF NOT EXISTS scores (userId TEXT, xp INTEGER, level INTEGER)').then(() => {
				sql.run('INSERT INTO scores (userId, xp, level) VALUES (?, ?, ?)', [message.author.id, 1, 1]);
			});
		});
	}
});

bot.login(token);