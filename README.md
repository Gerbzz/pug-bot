<!-- @format -->

# pug-bot

PUG Bot for Discord
The PUG Bot is a Discord bot designed to facilitate organizing and managing pick-up games (PUGs) within Discord servers. It supports various team sizes and match configurations, making it versatile for communities of all sizes. From casual 1v1 matches to competitive 10v10 clashes, PUG Bot streamlines the process of setting up games, inviting players, and managing match logistics.

Getting Started
This section guides you through setting up the PUG Bot in your development environment and preparing it for deployment in a Discord server.

Prerequisites
Before you begin, ensure you have Node.js and npm installed on your machine. The bot also requires a MongoDB database for data persistence.

Install project dependencies:

bash
Copy code
npm install
Setting Up
Follow these steps to get your development environment ready.

Environment Variables
Create a .env file in the root directory of your project and specify the following variables:

plaintext
Copy code
DISCORD_TOKEN=YourDiscordBotToken
GUILD_ID=YourGuildID
CLIENT_ID=YourClientID
MONGODB_URI=YourMongoDBUri
Replace placeholders with your actual Discord bot token, guild ID, client ID, and MongoDB URI.

Config.json Setup
Create a config.json file in the root directory:

json
Copy code
{
"testServer": "YourTestServerID",
"devs": ["YourDevUserID"]
}
This configuration file specifies the ID of your test server and the user IDs of the bot developers for additional privileges.

Running the Bot
To start the bot, execute:

bash
Copy code
node index.js
Features
Match Configuration: Create matches with flexible team sizes, from 1v1 to massive multiplayer formats.
Automatic Team Assignment: Players can join a queue, and the bot will automatically assign them to teams based on the configured match size.
Substitute Management: If a player needs to leave mid-game, the bot can manage substitute requests.
Match History: Keep track of past matches and outcomes for community leaderboards and statistics.
Contributing
We welcome contributions to the PUG Bot project! Whether it's feature requests, bug reports, or code contributions, please feel free to make a pull request or open an issue.

License
This project is licensed under the MIT License - see the LICENSE file for details.
