/** @format */

// src/commands/pug-system/add-pug-category.js
const { ApplicationCommandOptionType, ChannelType } = require("discord.js");
const {
	pugQueEmbed,
	components,
} = require("../../assets/embeds/pug-que-embed");
const pugModel = require("../../models/pug-model");

module.exports = {
	devOnly: true,
	name: "add-pug-category",
	description:
		"Starts up the bot based on the options you selected and sets up environment!",
	options: [
		{
			name: "category-name",
			description: "The name of the category to create channels in.",
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "how-many-players-on-a-team",
			description:
				"How many players do you want a team for the bot setup? Example would be a team of 5 players",
			type: ApplicationCommandOptionType.Number,
			required: true,
		},
		{
			name: "how-many-teams-are-there",
			description:
				"How many teams do you want for the bot setup? Example... 2 teams total for a pug that is 5v5",
			type: ApplicationCommandOptionType.Number,
			required: true,
		},
	],
	callback: async (client, interaction) => {
		if (!interaction.isChatInputCommand()) return;

		console.log(`${interaction.commandName} command was ran!`.blue.inverse);

		if (interaction.commandName === "add-pug-category") {
			const categoryName = interaction.options.getString("category-name");
			const numOfPlayersPerTeam = interaction.options.get(
				"how-many-players-on-a-team"
			).value;
			const numOfTeamsPerPUG = interaction.options.get(
				"how-many-teams-are-there"
			).value;
			const totalNumOfPlayersPerPUG = numOfPlayersPerTeam * numOfTeamsPerPUG;
			let pugFormat =
				`${numOfPlayersPerTeam}v`.repeat(numOfTeamsPerPUG - 1) +
				numOfPlayersPerTeam;
			console.log(
				`Setting up a ${pugFormat} PUG in category "${categoryName}" with a total of ${totalNumOfPlayersPerPUG} players.`
			);

			const newPug = new pugModel({
				serverId: interaction.guild.id,
				categoryName,
				numOfPlayersPerTeam,
				numOfTeamsPerPUG,
				totalNumOfPlayersPerPUG,
				pugFormat,
				queuedPlayers: [],
				pugQueueArrays: {},
				matchCounter: 0,
				readyCheckCounter: 0,
				pugQueEmbedChannelId: "?",
				pugQueEmbedMessageId: "?",
			});

			newPug
				.save()
				.then(() =>
					console.log(`newPug data is saved on db! : ${newPug}`.green.inverse)
				)
				.catch((err) => console.error("Error saving newPug:".red.inverse, err));

			const guild = interaction.member.guild;
			const embed = pugQueEmbed(newPug);
			// Create the bot folders and channels
			// Check for existing category
			guild.channels
				.fetch()
				.then((channels) => {
					if (
						!channels.find(
							(channel) =>
								channel.name === categoryName &&
								channel.type === ChannelType.GuildCategory
						)
					) {
						// Create the category
						guild.channels
							.create({
								name: categoryName,
								type: ChannelType.GuildCategory,
							})
							.then((createdCategory) => {
								const categoryID = createdCategory.id;

								// Check for existing voice and text channels
								const existingVoiceChannel = channels.find(
									(channel) =>
										channel.name === "pug-waiting-room" &&
										channel.parentID === categoryID
								);
								const existingTextChannel = channels.find(
									(channel) =>
										(channel.name === "pug-chat" &&
											channel.parentID === categoryID) ||
										(channel.name === "pug-que" &&
											channel.parentID === categoryID)
								);

								// Create voice channel if it doesn't exist
								if (!existingVoiceChannel) {
									guild.channels.create({
										name: "pug-waiting-room",
										type: ChannelType.GuildVoice,
										parent: categoryID,
									});
								}

								// Create text channel if it doesn't exist
								if (!existingTextChannel) {
									guild.channels.create({
										name: "pug-chat",
										type: ChannelType.GuildText,
										parent: categoryID,
									});
								}

								// Create pug-que text channel with specific permissions
								guild.channels
									.create({
										name: "pug-que",
										type: ChannelType.GuildText,
										parent: categoryID,
										overwrites: [
											{
												id: guild.id,
												deny: ["SEND_MESSAGES"], // Everyone can't send messages
											},
										],
									})
									.then((pugQueEmbedChannel) => {
										// Added buttons to the embed
										pugQueEmbedChannel
											.send({
												embeds: [embed],
												components: components,
											})
											.then((pugQueEmbedMessage) => {
												console.log(
													`Pug Que Embed Message ID: ${pugQueEmbedMessage.id}`
														.green.inverse
												);
												// Here we update the newPug instance with the created channel's ID
												newPug.pugQueEmbedMessageId = pugQueEmbedMessage.id;
												// Here we update the newPug instance with the created channel's ID
												newPug.pugQueEmbedChannelId = pugQueEmbedChannel.id;

												// Save the updated PUG model instance to the database
												newPug
													.save()
													.then(() =>
														console.log(
															`PUG category and pug-que channel created. Channel ID saved to DB.`
														)
													)
													.catch((err) =>
														console.error(
															"Error saving newPug with pug-que channel ID:".red
																.inverse,
															err
														)
													);
											});
									})
									.catch(console.error);
							})
							.catch(console.error);
					} else {
						console.log(
							`You tried creating a Pug Category named : "${categoryName}"..... \nHowever that Category already exists.`
								.yellow.inverse
						);
					}
				})
				.catch(console.error);

			interaction.reply(
				`You Selected...\nCategory name : ${categoryName}\nNumber of players on a team : ${numOfPlayersPerTeam} \nNumber of Teams in a pug: ${numOfTeamsPerPUG}\nSize of pug-que: ${totalNumOfPlayersPerPUG}\nFormat of the pug : ${pugFormat}`
			);
		}
	},
};
