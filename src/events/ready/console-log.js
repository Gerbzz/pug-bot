// src/events/ready/consoleLog.js
module.exports = (client) => {
	console.log(`Logged in as ${client.user.tag}`.green.inverse);
};
