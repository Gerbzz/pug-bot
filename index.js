/** @format */

// index.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const eventHandler = require("./src/handlers/event-handler.js");
const keep_alive = require("./keep_alive.js");
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

client.login(process.env.DISCORD_TOKEN);
