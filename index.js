/** @format */

// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const eventHandler = require("./src/handlers/event-handler.js");
const keepAlive = require("./keep-alive.js");
// Connect to MongoDB
const connectDB = require("./src/database/db.js");
connectDB();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions,
	],
});

eventHandler(client);
keepAlive();
client.login(process.env.DISCORD_TOKEN);
