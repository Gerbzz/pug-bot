require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const eventHandler = require("./src/handlers/eventHandler");

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
