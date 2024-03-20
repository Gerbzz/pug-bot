/** @format */

// var http = require("http");

// http
// 	.createServer(function (req, res) {
// 		res.write("I'm alive");
// 		res.end();
// 	})
// 	.listen(8080);

const express = require("express");
const server = express();

server.all("/", (req, res) => {
	res.send("Bot is alive!");
});

function keepAlive() {
	server.listen(3000, () => {
		console.log("Server is ready.");
	});
}

module.exports = keepAlive;
