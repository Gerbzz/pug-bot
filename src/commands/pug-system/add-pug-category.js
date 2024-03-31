/** @format */

// src/commands/pug-system/add-pug-category.js
const {
	ApplicationCommandOptionType,
	ChannelType,
	PermissionsBitField,
	EmbedBuilder,
	MessageActionRow,
	MessageButton,
} = require("discord.js");
const {
	pugQueEmbed,
	pugQueComponents,
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
				serverId: interaction.guild.id.toString(), // Ensure serverId is stored as a string
				categoryName,
				categoryId: "",
				modChannelId: "",
				modChannelMessageId: "",
				howToPugChannelId: "",
				howToPugEmbedMessageId: "",
				pugQueEmbedChannelId: "",
				pugQueEmbedMessageId: "",
				numOfPlayersPerTeam,
				numOfTeamsPerPUG,
				totalNumOfPlayersPerPUG,
				pugFormat,
				queuedPlayers: [],
				matchFoundPlayers: [],
				acceptedMatchFoundPlayers: [],
				onGoingPugs: [],
				matchCounter: 0,
				readyCheckCounter: 0,
			});

			const adminPermissions = new PermissionsBitField(
				PermissionsBitField.Flags.Administrator
			);

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
										(channel.name === "💬pug-chat" &&
											channel.parentID === categoryID) ||
										(channel.name === `📚how-to-pug` &&
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
								// Update newPug with categoryId
								newPug.categoryIds.push(categoryID);

								// Create text channel if it doesn't exist
								if (!existingTextChannel) {
									guild.channels
										.create({
											name: `📚how-to-pug`,
											type: ChannelType.GuildText,
											parent: categoryID,
											permissionOverwrites: [
												{
													id: guild.id,
													deny: [
														PermissionsBitField.Flags.SendMessages.toString(),
														PermissionsBitField.Flags.ManageChannels,
													], // Correctly deny SEND_MESSAGES permission
												},
											],
										})
										.then((howToPugChannel) => {
											// Create an awesome embed for how-to-pug
											const embed = new EmbedBuilder()
												.setTitle("🤖 Welcome to pug-bot!")
												.setDescription(
													`👋 **Hello, and welcome puggers!** We're excited to have you here and we hope you enjoy playing PUGs (Pick-Up Games) with us using our bot, pug-bot.

                                                    🎮 **How to Get Started:**
                                                    
                                                    **Joining the Queue:** To join the PUG queue, simply click the "Join Queue" button in the #pug-queue channel.
                                                    
                                                    **Leaving the Queue:** If you need to leave the queue for any reason, you can click the "Leave Queue" button in the #pug-queue channel.
                                                    
                                                    **Accepting a Match:** When a match is found for you, you'll receive a notification. Click the "Accept Match" button to confirm your participation.
                                                    
                                                    **Declining a Match:** If you're unable to play or if you change your mind, you can decline the match by clicking the "Decline Match" button.
                                                    
                                                    **Reporting the Winner:** After the match is over, the winning team can report the result by clicking the "Report Winner" button.
                                                    
                                                    📚 **Additional Information:**
                                                    
                                                    **PUG Queue Interface:** In the #pug-queue channel, you can see the number of players currently queued up, as well as who's in the queue.
                                                    
                                                    **Bot Commands:**
                                                    
                                                    **For Everyone:**
                                                     **set-my-queue-duration:** Allows a player to set their queue duration.
                                                     **show-leaderboard:** Displays the leaderboard of players based on their stats.
                                                     **show-my-stats:** Shows the stats of a specific player.
                                                    
                                                    **For Moderators/Admins:**
                                                     **update-player-elo:** Updates the Elo rating of a player.
                                                     **update-player-wins-losses:** Updates the wins and losses of a player.
                                                     **update-pug-match-results:** Updates the results of a PUG match.
                                                     **update-queue-eligibility:** Updates the eligibility status of a player for the queue.
                                                     **delete-pug-category:** Deletes a PUG category.
                                                     **add-pug-category:** Starts up the bot based on the options selected and sets up the environment for a new PUG category.
                                                    
                                                    **Getting Help:** If you have any questions or need assistance, feel free to reach out to our moderators.
                                                    
                                                    👍 **That's it! We hope you have a great time playing PUGs with us.** If you encounter any issues or have suggestions for improvement, please let us know. Enjoy gaming!
                                                    
                                                    pug-bot Team
                                                    `
												)
												.setColor("#7289DA");

											howToPugChannel
												.send({ embeds: [embed] })
												.then((message) => {
													console.log(
														"How-to-pug guide sent to how-to-pug channel."
													);
													// Storing the channel and message IDs in the database
													newPug.howToPugChannelId = message.channel.id;
													newPug.howToPugEmbedMessageId = message.id;
													newPug
														.save()
														.then(() =>
															console.log(
																"Channel and message IDs stored in the database."
															)
														)
														.catch((error) =>
															console.error(
																"Error saving channel and message IDs:",
																error
															)
														);
												})
												.catch(console.error);
										})
										.catch(console.error);
								}
								guild.channels
									.create({
										name: "🕵️mod-channel",
										type: ChannelType.GuildText,
										parent: categoryID,
										permissionOverwrites: [
											{
												id: guild.id,

												deny: [
													PermissionsBitField.Flags.SendMessages,
													PermissionsBitField.Flags.ViewChannel,
													PermissionsBitField.Flags.ManageChannels,
												],
											},
											// You might want to specifically allow messages from mods/admins
										],
									})
									.then((modChannel) => {
										console.log("Mod channel created:", modChannel.name);
										newPug.modChannelId = modChannel.id; // Store the mod channel ID in the newPug instance

										// Send a message to the mod channel
										modChannel
											.send(
												"This channel is designated for handling disputes in PUG matches. All disputes will be directed here for moderation."
											)
											.then((message) => {
												console.log("Message sent to mod channel.");
												newPug.modChannelMessageId = message.id; // Store the message ID as well

												// Save the newPug instance after all updates
												newPug
													.save()
													.then(() =>
														console.log(
															"PUG setup with mod channel details saved to the database."
														)
													)
													.catch((err) =>
														console.error(
															"Error saving newPug with mod channel details:",
															err
														)
													);
											})
											.catch((err) =>
												console.error(
													"Error sending message to mod channel:",
													err
												)
											);
									})
									.catch((err) =>
										console.error("Error creating mod channel:", err)
									);

								// Create text channel if it doesn't exist
								if (!existingTextChannel) {
									guild.channels.create({
										name: "💬pug-chat",
										type: ChannelType.GuildText,
										parent: categoryID,
										permissionOverwrites: [
											{
												id: guild.id,
												deny: [PermissionsBitField.Flags.ManageChannels],
											},
										],
									});
								}

								// Create pug-que text channel with specific permissions
								guild.channels
									.create({
										name: "🎮pug-queue",
										type: ChannelType.GuildText,
										parent: categoryID,
										permissionOverwrites: [
											{
												id: guild.id,
												deny: [
													PermissionsBitField.Flags.SendMessages.toString(),
													PermissionsBitField.Flags.ManageChannels,
												], // Correctly deny SEND_MESSAGES permission
											},
										],
									})
									.then((pugQueEmbedChannel) => {
										// Added buttons to the embed
										pugQueEmbedChannel
											.send({
												embeds: [embed],
												components: pugQueComponents,
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
