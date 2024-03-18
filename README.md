<!-- @format -->

# PUG Bot for Discord

PUG Bot is a versatile Discord bot designed to facilitate organizing and managing pick-up games (PUGs) within Discord servers. It supports team sizes and match configurations of varying scales, from casual 1v1 matches to competitive 5v5 clashes and supports more than just 2 teams, as you can have a pubg pug with 18 teams of 4 or whatever your heart desires. PUG Bot streamlines setting up games, inviting players, and managing match logistics.

## Getting Started

These instructions will guide you through setting up the PUG Bot in your development environment, preparing it for deployment in a Discord server.

### Prerequisites

Ensure you have Node.js and npm installed on your machine. The bot also requires a MongoDB database for data persistence.

### Install Dependencies

```bash
npm install
```

### Environment Setup

Environment Variables
Create a .env file in the project's root directory with the following contents:

```bash
DISCORD_TOKEN=YourDiscordBotToken
GUILD_ID=YourGuildID
CLIENT_ID=YourClientID
MONGODB_URI=YourMongoDBUri
```

Replace the placeholders with your actual Discord bot token, guild ID, client ID, and MongoDB URI.

Config.json
Create a config.json file in the project's root directory with the following structure:

```json
{
	"testServer": "YourTestServerID",
	"devs": ["YourDevUserID"]
}
```

This file specifies the ID of your test server and the user IDs of the bot developers.

### Running the Bot

To start the bot, run:

```bash
node index.js
```

### Features

Match Configuration: Create matches with flexible team sizes, from 1v1 to massive multiplayer formats.

Automatic Team Assignment: Players can join a queue, and the bot will automatically assign them to teams based on the configured match size.

Substitute Management: If a player needs to leave mid-game, the bot can manage substitute requests.

Match History: Keep track of past matches and outcomes for community leaderboards and statistics.

### Contributing

We welcome contributions to the PUG Bot project! Whether it's feature requests, bug reports, or code contributions, please feel free to make a pull request or open an issue.
