/** @format */

// src/events/interactionCreate/handle-buttons.js
const pugModel = require("../../models/pug-model");
const {
	ChannelType,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const mongoose = require("mongoose");

const {
	matchFoundEmbed,
	matchFoundComponents,
} = require("../../assets/embeds/match-found-embed");

const {
	pugQueEmbed,
	components,
} = require("../../assets/embeds/pug-que-embed");

const {
	matchRoomEmbed,
	matchRoomComponents,
} = require("../../assets/embeds/match-room-embed");

module.exports = async (client, interaction) => {
	if (!interaction.isButton()) return;

	// function to update the pug que embed
	async function updatePugQueueEmbed() {
		try {
			const doc = await pugModel.findOne({
				serverId: interaction.guild.id,
				categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
			});

			if (!doc) {
				console.log("No document found for updating embed!");
				return;
			}

			const channel = await client.channels.fetch(doc.pugQueEmbedChannelId);
			if (!channel) {
				console.log("Channel not found!");
				return;
			}
			const message = await channel.messages.fetch(doc.pugQueEmbedMessageId);
			if (!message) {
				console.log("Message not found!");
				return;
			}

			const embed = pugQueEmbed(doc); // Pass the MongoDB data
			await message.edit({ embeds: [embed], components: components });
		} catch (err) {
			console.log("Something went wrong when updating embed data!", err);
		}
	}
	async function updateMatchFoundEmbed() {
		try {
			const doc = await pugModel.findOne({
				serverId: interaction.guild.id,
				categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
			});

			if (!doc) {
				console.log("No document found for updating embed!");
				return;
			}

			// Find the relevant match object within matchFoundPlayers
			const matchData = doc.matchFoundPlayers.find(
				(match) => match.readyCheckCounter === doc.readyCheckCounter // Or another unique identifier
			);

			if (!matchData) {
				console.log("Match data not found within matchFoundPlayers");
				return;
			}

			const channel = await client.channels.fetch(
				matchData.matchFoundEmbedChannelId
			);
			if (!channel) {
				console.log("Match found embed channel not found!");
				return;
			}

			const message = await channel.messages.fetch(
				matchData.matchFoundEmbedMessageId
			);
			if (!message) {
				console.log("Match found embed message not found!");
				return;
			}

			// Update the embed
			const embed = matchFoundEmbed(doc);
			await message.edit({ embeds: [embed], components: matchFoundComponents });
		} catch (err) {
			console.log(
				"Something went wrong when updating match found embed data!",
				err
			);
		}
	}

	// function to update the match room embed
	async function updateMatchRoomEmbed() {
		try {
			const doc = await pugModel.findOne({
				serverId: interaction.guild.id,
				categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
			});

			if (!doc) {
				console.log("No document found for updating embed!");
				return;
			}

			const ongoingPug = doc.onGoingPugs.find(
				(pug) => pug.matchCounter === matchCounter
			);

			if (ongoingPug) {
				const channel = await client.channels.fetch(
					ongoingPug.matchRoomEmbedChannelId
				);
				const message = await channel.messages.fetch(
					ongoingPug.matchRoomEmbedMessageId
				);

				// Assuming you have a function to generate the embed with the updated data
				// You need to update your embed function to reflect the changes when a user accepts the match
				const embed = matchRoomEmbed(doc); // This function will need to account for changes in the player list
				const components = matchRoomComponents;
				await message.edit({
					embeds: [embed],
					components: components,
				});
			}
		} catch (err) {
			console.log(
				"Something went wrong when updating match room embed data!",
				err
			);
		}
	}
	async function updatePlayerStatsForMatch(matchCounter, winningTeamIndex) {
		const WINNER_ELO_CHANGE = 25;
		const LOSER_ELO_CHANGE = -25;

		// Find the PUG that contains the specified match
		const pug = await pugModel.findOne({
			serverId: interaction.guild.id,
			categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
			"onGoingPugs.matchCounter": matchCounter,
		});

		if (!pug) {
			console.error("No PUG found with matchCounter", matchCounter);
			return;
		}

		const matchDetails = pug.onGoingPugs.find(
			(match) => match.matchCounter === matchCounter
		);

		// Extract userTags from the teams array
		const winningTeamUserTags = matchDetails.teams[winningTeamIndex].players; // Assuming this directly contains user tags
		const losingTeamIndex = winningTeamIndex === 0 ? 1 : 0;
		const losingTeamUserTags = matchDetails.teams[losingTeamIndex].players;

		console.log(
			`Updating ELO for Winning Team Players (User Tags): ${winningTeamUserTags}`
		);
		console.log(
			`Updating ELO for Losing Team Players (User Tags): ${losingTeamUserTags}`
		);

		// Update winning team players
		for (const userTag of winningTeamUserTags) {
			await pugModel.updateOne(
				{
					"playerProfiles.userTag": userTag,
					serverId: interaction.guild.id, // Use the serverId from the interaction
					categoryIds: { $in: [interaction.channel.parentId] }, // Make sure the current categoryId is in the document's categoryIds array }, },
				},
				{
					$inc: {
						"playerProfiles.$.userELO": WINNER_ELO_CHANGE,
						"playerProfiles.$.wins": 1,
					},
				}
			);
		}

		// Update losing team players
		for (const userTag of losingTeamUserTags) {
			await pugModel.updateOne(
				{
					"playerProfiles.userTag": userTag,
					serverId: interaction.guild.id, // Use the serverId from the interaction
					categoryIds: { $in: [interaction.channel.parentId] }, // Make sure the current categoryId is in the document's categoryIds array },
				},
				{
					$inc: {
						"playerProfiles.$.userELO": LOSER_ELO_CHANGE,
						"playerProfiles.$.losses": 1,
					},
				}
			);
		}

		console.log("Player stats updated using userTags.");
	}
	async function updateMatchAndAcceptedPlayers(
		docId,
		matchFoundPlayers,
		acceptedMatchFoundPlayers
	) {
		try {
			await pugModel.updateOne(
				{
					serverId: interaction.guild.id, // Use the serverId from the interaction
					categoryIds: { $in: [interaction.channel.parentId] }, // Make sure the current categoryId is in the document's categoryIds array },
				},
				{
					$set: {
						matchFoundPlayers: matchFoundPlayers,
						acceptedMatchFoundPlayers: acceptedMatchFoundPlayers,
					},
				}
			);
			console.log(
				"Successfully updated matchFoundPlayers and acceptedMatchFoundPlayers in the database."
			);
		} catch (error) {
			console.error(
				"Failed to update matchFoundPlayers and acceptedMatchFoundPlayers:",
				error
			);
		}
	}

	async function removeExpiredQueueEntries(client, interaction) {
		const doc = await pugModel.findOne({
			serverId: interaction.guild.id,
			categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
		});

		if (!doc) {
			console.log("Document not found for checking expired queue entries.");
			return;
		}

		const now = new Date();
		let updateRequired = false;

		for (const player of doc.queuedPlayers) {
			const playerProfile = doc.playerProfiles.find(
				(p) => p.userId === player.userId
			);
			if (playerProfile) {
				const joinTime = new Date(player.joinedAt);
				const durationMinutes = playerProfile.userQueueDuration;
				const expireTime = new Date(
					joinTime.getTime() + durationMinutes * 60000
				);

				if (now > expireTime) {
					// Time expired, remove player from queue
					doc.queuedPlayers = doc.queuedPlayers.filter(
						(p) => p.userId !== player.userId
					);
					updateRequired = true;

					const pugCategory = await pugModel.findOne({
						serverId: interaction.guild.id,
						categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
					});

					// Notify the player (optional)
					const user = await client.users.fetch(player.userId);
					const userTag = user.tag;
					const pugQueueChannelMention = `<#${pugCategory.pugQueEmbedChannelId}>`;
					const howToPugChannelMention = `<#${pugCategory.howToPugChannelId}>`;

					const embedMessage = new EmbedBuilder()
						.setColor(0x0099ff) // Adjust the color as needed
						.setTitle("Queue Time Expired")
						.setDescription(
							`Hello, ${userTag}! Unfortunately, you've been removed from the queue due to exceeding your wait time.`
						)
						.addFields(
							{
								name: "Wait Time Exceeded",
								value: `Your specified wait time of ${durationMinutes} minutes has expired.`,
							},
							{
								name: "Rejoin the Queue",
								value: `You can rejoin the queue at any time. For more details on how to do this, please refer to ${pugQueueChannelMention}.`,
								inline: false,
							},
							{
								name: "Need further assistance?",
								value: `If you have questions or need help, please refer to ${howToPugChannelMention} for guidance.`,
								inline: false,
							}
						)
						.setFooter({ text: "Thank you choosing pug-bot!" });

					user.send({ embeds: [embedMessage] }).catch(console.error);
				}
			}
		}

		if (updateRequired) {
			await doc.save();
			// Optionally, update any relevant queue displays or interfaces here
			updatePugQueueEmbed(client, doc, pugQueEmbed);
		}
	}

	// Function to start the interval for checking expired queue entries
	async function startQueueExpirationCheck(client, interaction) {
		setInterval(
			() => removeExpiredQueueEntries(client, interaction),
			60 * 1000
		);
	}

	async function addPlayerProfile(docId, playerData) {
		const existingProfile = await pugModel.findOne({
			_id: docId,
			"playerProfiles.userId": playerData.userId,
		});

		if (!existingProfile) {
			// If the player profile does not exist, use $push to add it
			await pugModel.updateOne(
				{
					serverId: interaction.guild.id,
					categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
				},
				{
					$push: {
						playerProfiles: {
							userId: playerData.userId,
							userTag: playerData.userTag,
							userQueueDuration: playerData.userQueueDuration || 30, // default to 30 minutes
							userELO: playerData.userELO || 1000, // default ELO
							wins: playerData.wins || 0,
							losses: playerData.losses || 0,
							isEligibleToQueue:
								playerData.isEligibleToQueue !== undefined
									? playerData.isEligibleToQueue
									: true,
						},
					},
				}
			);
			console.log(`Player profile for ${playerData.userTag} added.`);
		} else {
			console.log(`Player profile for ${playerData.userTag} already exists.`);
		}
	}

	const channel = interaction.channel;
	const category = channel.parent;
	const categoryName = category ? category.name : "Unknown Category";
	const baseCategoryName = categoryName.split(" ")[0];

	// Fetch the document from the database
	const doc = await pugModel.findOne({
		serverId: interaction.guild.id,
		categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
	});
	let queuedPlayers = doc.queuedPlayers;
	let matchFoundPlayers = doc.matchFoundPlayers;
	let acceptedMatchFoundPlayers = doc.acceptedMatchFoundPlayers;
	let totalNumOfPlayersPerPUG = doc.totalNumOfPlayersPerPUG;
	let numOfTeamsPerPUG = doc.numOfTeamsPerPUG;
	let matchCounter = doc.matchCounter;
	let readyCheckCounter = doc.readyCheckCounter;
	let onGoingPugs = doc.onGoingPugs;
	let matchFoundKey = doc.readyCheckCounter - 1;
	let pugFoundKey = doc.matchCounter - 1;
	if (!doc) {
		console.log(
			"No pugModel found for the given categoryName and serverId! in handle-buttons.js"
		);
		await interaction.editReply({
			content: "No match information found. In handle-buttons.js",
		});
		return;
	}

	// **********************************************************************************
	// Section : Join Queue
	// **********************************************************************************
	if (interaction.customId === "joinQueue") {
		// Fetch the player's profile from the database
		const playerProfile = doc.playerProfiles.find(
			(profile) => profile.userId === interaction.user.id
		);

		// Check if the player is eligible to queue
		if (!playerProfile || playerProfile.isEligibleToQueue) {
			// Check if the player is already in a queue or a match
			if (
				!doc.queuedPlayers.some(
					(player) => player.userTag === interaction.user.tag
				) &&
				!doc.matchFoundPlayers.some((match) =>
					match.players.some(
						(player) => player.userTag === interaction.user.tag
					)
				) &&
				!doc.acceptedMatchFoundPlayers.some((match) =>
					match.players.some(
						(player) => player.userTag === interaction.user.tag
					)
				) &&
				!doc.onGoingPugs.some((match) =>
					match.players.some(
						(player) => player.userTag === interaction.user.tag
					)
				)
			) {
				// Player is eligible to join the queue
				doc.queuedPlayers.push({
					userId: interaction.user.id,
					userTag: interaction.user.tag,
					joinedAt: new Date(),
				});

				console.log(`${interaction.user.tag} joined the queue...`.magenta);

				// Update the database with the new queuedPlayers array
				await pugModel.updateOne(
					{
						serverId: interaction.guild.id,
						categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
					},
					{ queuedPlayers: doc.queuedPlayers }
				);
				await interaction.reply({
					content: `You have joined the queue for ${categoryName}!`,
					ephemeral: true,
				});

				// If the player profile doesn't exist, create it
				if (!playerProfile) {
					const playerData = {
						userId: interaction.user.id,
						userTag: interaction.user.tag,
						// Set other player data as needed, could be defaults or fetched from elsewhere
						userQueueDuration: 30, // Example default duration
						userELO: 1000, // Example default ELO
						wins: 0, // Example default wins
						losses: 0, // Example default losses
						isEligibleToQueue: true, // Example default eligibility
					};
					addPlayerProfile(doc._id, playerData);
				}
				startQueueExpirationCheck(client, interaction);
				updatePugQueueEmbed();
			} else {
				// Player is already in a queue or a match
				await interaction.reply({
					content: `You are already in the queue or a match for ${categoryName}.`,
					ephemeral: true,
				});
			}
		} else {
			// Player is not eligible to queue
			await interaction.reply({
				content: "You are not currently eligible to join the queue.",
				ephemeral: true,
			});
		}
		return;
	}

	// **********************************************************************************
	// Section : Leave Queue
	// **********************************************************************************
	else if (interaction.customId === "leaveQueue") {
		const isUserInQueue = doc.queuedPlayers.some(
			(player) => player.userTag === interaction.user.tag
		);
		if (isUserInQueue) {
			doc.queuedPlayers = doc.queuedPlayers.filter(
				(player) => player.userTag !== interaction.user.tag
			);

			// Remove the user from matchFoundPlayers and acceptedMatchFoundPlayers
			doc.matchFoundPlayers = doc.matchFoundPlayers.map((match) => ({
				...match,
				players: match.players.filter((tag) => tag !== interaction.user.tag),
			}));
			doc.acceptedMatchFoundPlayers = doc.acceptedMatchFoundPlayers.filter(
				(match) => !match.players.includes(interaction.user.tag)
			);

			console.log(`${interaction.user.tag} left the queue...`.magenta);

			// Update the database with the updated arrays
			await pugModel.updateOne(
				{
					serverId: interaction.guild.id,
					categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
				},
				{
					queuedPlayers: doc.queuedPlayers,
					matchFoundPlayers: doc.matchFoundPlayers,
					acceptedMatchFoundPlayers: doc.acceptedMatchFoundPlayers,
				}
			);

			await interaction.reply({
				content: `You have left the queue for ${categoryName}!`,
				ephemeral: true,
			});
			updatePugQueueEmbed();
		} else {
			await interaction.reply({
				content: `You are not in the queue for ${categoryName}.`,
				ephemeral: true,
			});
		}
		return;
	}

	// **********************************************************************************
	// Section : Accept Match Button
	// **********************************************************************************
	else if (interaction.customId === "acceptMatchButton") {
		console.log(`${interaction.user.tag} accepted the match`.magenta);

		// Find the match object the user is a part of
		const matchToAccept = doc.matchFoundPlayers.find((match) =>
			match.players.some((player) => player.userId === interaction.user.id)
		);

		if (matchToAccept) {
			// Find or create the acceptedMatch object for the current ready check
			let acceptedMatch = doc.acceptedMatchFoundPlayers.find(
				(match) => match.readyCheckCounter === doc.readyCheckCounter
			);

			if (!acceptedMatch) {
				acceptedMatch = {
					readyCheckCounter: doc.readyCheckCounter,
					players: [],
				};
				doc.acceptedMatchFoundPlayers.push(acceptedMatch);
			}

			// Prevent adding the player if they have already accepted
			if (
				!acceptedMatch.players.some(
					(player) => player.userId === interaction.user.id
				)
			) {
				acceptedMatch.players.push({
					userId: interaction.user.id,
					userTag: interaction.user.tag,
					joinedAt: new Date(), // Assuming you want to track this
				});

				// Update the database with the new acceptedMatchFoundPlayers array
				await pugModel.updateOne(
					{
						serverId: interaction.guild.id,
						categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
					},
					{ acceptedMatchFoundPlayers: doc.acceptedMatchFoundPlayers }
				);
				await interaction.reply({
					content: `You've accepted the match for ${categoryName}!`,
					ephemeral: true,
				});
				updateMatchFoundEmbed();
			} else {
				await interaction.reply({
					content: `You've already accepted the match for ${categoryName}!`,
					ephemeral: true,
				});
			}
		} else {
			// If no match is found for some reason, reply to the user
			await interaction.reply({
				content: "Couldn't find the match you are trying to accept.",
				ephemeral: true,
			});
		}
		return;
	} else if (interaction.customId === "declineMatchButton") {
		// Find the index of the match the user wants to decline
		const matchIndex = doc.matchFoundPlayers.findIndex(
			(match) =>
				match.players.some(
					(player) => player.userTag === interaction.user.tag
				) && match.readyCheckCounter === doc.readyCheckCounter
		);

		if (matchIndex !== -1) {
			console.log(`${interaction.user.tag} declined the match...`.magenta);

			// Update the players array to remove the declining player
			doc.matchFoundPlayers[matchIndex].players = doc.matchFoundPlayers[
				matchIndex
			].players.filter((player) => player.userTag !== interaction.user.tag);

			// Re-queue remaining players (if any)
			const playersToRequeue = doc.matchFoundPlayers[matchIndex].players;

			// Add all player objects directly to doc.queuedPlayers
			doc.queuedPlayers.push(...playersToRequeue);

			// Update the database to reflect these changes
			await pugModel.updateOne(
				{
					serverId: interaction.guild.id,
					categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
				},
				{
					$set: {
						matchFoundPlayers: doc.matchFoundPlayers,
						queuedPlayers: doc.queuedPlayers,
					},
				}
			);

			// Channel and Category Deletion Logic
			const channelToDelete = await interaction.channel.fetch();
			if (channelToDelete) {
				const guild = channelToDelete.guild;
				try {
					await guild.channels.fetch();
					const categoryToDelete = guild.channels.cache.find(
						(channel) =>
							channel.type === ChannelType.GuildCategory &&
							channel.id === channelToDelete.parentId
					);

					if (categoryToDelete) {
						console.log(`Deletion in progress...`.red.inverse);
						const channelsInCategory = guild.channels.cache.filter(
							(channel) => channel.parentId === categoryToDelete.id
						);

						pugModel.updateOne(
							{
								serverId: interaction.guild.id,
								categoryIds: { $in: [categoryToDelete.id] }, // Ensure the document contains the categoryId to be deleted
							},
							{
								$pull: { categoryIds: categoryToDelete.id }, // Remove the categoryId from the categoryIds array
							}
						);
						for (const channel of channelsInCategory.values()) {
							await channel.delete();
							console.log(`Channel "${channel.name}" has been deleted.`.red);
						}

						await categoryToDelete.delete();
						console.log(
							`Category "${categoryToDelete.name}" and its channels deleted successfully!`
								.green
						);
					} else {
						console.error(
							"Channel doesn't belong to a category or category not found"
						);
					}
				} catch (error) {
					console.error(`Error deleting category or its channels: `, error);
					await interaction.reply({
						content: `Declined match, but there was an error deleting the category and channels.`,
						ephemeral: true,
					});
				}
			} else {
				console.error("Channel to delete not found");
			}
			updatePugQueueEmbed();
			// Assuming this function is called within a context where doc, docId, categoryName, etc., are defined

			// Identify matches that don't meet the player requirement
			const insufficientPlayerMatches = matchFoundPlayers.filter(
				(match) => match.players.length < totalNumOfPlayersPerPUG
			);

			// For each match with insufficient players, re-queue the players and clear the match
			insufficientPlayerMatches.forEach((match) => {
				// Re-queue players from both matchFoundPlayers and acceptedMatchFoundPlayers
				match.players.forEach((player) => {
					if (!doc.queuedPlayers.includes(player)) {
						doc.queuedPlayers.push(player);
					}
				});

				// Clear players from the match (this will be reflected in the upcoming database update)
				match.players = [];
			});

			// Find corresponding entries in acceptedMatchFoundPlayers and clear players if needed
			doc.acceptedMatchFoundPlayers.forEach((acceptedMatch, index) => {
				if (
					insufficientPlayerMatches.some(
						(match) =>
							match.readyCheckCounter === acceptedMatch.readyCheckCounter
					)
				) {
					acceptedMatch.players = [];
				}
			});

			// Now, update the document with the modified matchFoundPlayers and acceptedMatchFoundPlayers
			await updateMatchAndAcceptedPlayers(
				doc._id,
				matchFoundPlayers,
				doc.acceptedMatchFoundPlayers
			);

			// Notify the user of the decline
			await interaction.reply({
				content: `You've declined the match for ${doc.categoryName}!`,
				ephemeral: true,
			});
		} else {
			await interaction.reply({
				content: `You don't have a pending match to decline for ${doc.categoryName}.`,
				ephemeral: true,
			});
		}
		return;
	}
	// When a report is initiated
	else if (interaction.customId === "report_results") {
		// Create buttons for each team
		const teamButtons = [];
		for (let i = 0; i < doc.numOfTeamsPerPUG; i++) {
			const teamButton = new ButtonBuilder()
				.setCustomId(`select_team_${i}`)
				.setLabel(`Select Team ${i + 1}`)
				.setStyle(ButtonStyle.Primary);
			teamButtons.push(teamButton);
		}

		// Create an action row to contain the team buttons
		const teamActionRow = new ActionRowBuilder().addComponents(...teamButtons);

		// Reply with a message asking to select the winning team
		await interaction.reply({
			content: "Please select the winning team.",
			components: [teamActionRow],
			ephemeral: true, // Make the message visible only to the user who clicked the button
		});
	}

	// Inside the if (interaction.customId === 'report_results') block
	else if (interaction.customId === "report_results") {
		// Create buttons for each team
		const teamButtons = [];
		for (let i = 0; i < doc.numOfTeamsPerPUG; i++) {
			const teamButton = new ButtonBuilder()
				.setCustomId(`select_team_${i}`)
				.setLabel(`Select Team ${i + 1}`)
				.setStyle(ButtonStyle.Primary);
			teamButtons.push(teamButton);
		}

		// Create an action row to contain the team buttons
		const teamActionRow = new ActionRowBuilder().addComponents(...teamButtons);

		// Reply with a message asking to select the winning team
		await interaction.reply({
			content: "Please select the winning team.",
			components: [teamActionRow],
			ephemeral: true, // Make the message visible only to the user who clicked the button
		});
	} else if (interaction.customId.startsWith("select_team_")) {
		const teamIndex = parseInt(interaction.customId.split("_")[2], 10);
		// Logging for debugging
		console.log("teamIndex in select_team_ handler:", teamIndex);

		// Update confirmButton's customId to include teamIndex
		const confirmButton = new ButtonBuilder()
			.setCustomId(`confirm_report_${teamIndex}`) // Embedding teamIndex here
			.setLabel("Confirm Report")
			.setStyle(ButtonStyle.Primary);

		const cancelButton = new ButtonBuilder()
			.setCustomId("cancel_report")
			.setLabel("Cancel Report")
			.setStyle(ButtonStyle.Secondary);

		const actionRow = new ActionRowBuilder().addComponents(
			confirmButton,
			cancelButton
		);

		await interaction.update({
			// Use update() if within an existing interaction, or reply() if starting a new one
			content: `Team ${
				teamIndex + 1
			} selected as the winning team. Now, please confirm or cancel the report.`,
			components: [actionRow],
			ephemeral: true,
		});
	} else if (interaction.customId.startsWith("confirm_report_")) {
		const teamIndex = parseInt(interaction.customId.split("_")[2], 10); // Correctly extract teamIndex
		const userId = interaction.user.id;

		// Fetch the PUG instance
		const pug = doc.onGoingPugs.find((p) => p.matchCounter === matchCounter);
		if (pug) {
			// Check if the user has already voted in this PUG
			const hasAlreadyVoted = pug.results.reports.some(
				(vote) => vote.userId === userId
			);

			if (hasAlreadyVoted) {
				// Inform the user that they have already voted
				await interaction.reply({
					content: "You have already submitted your vote for this match.",
					ephemeral: true,
				});
				return; // Exit the function to prevent further execution
			}

			// Proceed with adding the vote since the user hasn't voted yet
			const vote = {
				userId: userId,
				userTag: interaction.user.tag,
				votedForTeam: teamIndex,
			};

			// Add the vote to the reports array
			pug.results.reports.push(vote);

			// Before determining the winner, check if all players have voted
			if (pug.results.reports.length >= doc.totalNumOfPlayersPerPUG / 2 + 1) {
				// All players have voted, tally the votes to determine the winner
				const voteTally = pug.results.reports.reduce((acc, vote) => {
					acc[vote.votedForTeam] = (acc[vote.votedForTeam] || 0) + 1;
					return acc;
				}, {});

				let winningTeamIndex = -1;
				let maxVotes = 0;
				Object.entries(voteTally).forEach(([index, votes]) => {
					if (votes > maxVotes) {
						winningTeamIndex = parseInt(index, 10);
						maxVotes = votes;
					}
				});
				if (winningTeamIndex !== -1) {
					// Fetch the specific PUG instance based on matchCounter
					const pug = doc.onGoingPugs.find(
						(p) => p.matchCounter === matchCounter
					);
					if (!pug) {
						console.error(
							"PUG instance with the specified matchCounter not found."
						);
						// Handle the error, possibly by sending a reply to the interaction
						return;
					}
					// Constants for ELO calculation
					const WINNER_ELO_CHANGE = 25;
					const LOSER_ELO_CHANGE = -25;

					// Set the winning team index in the results
					pug.results.winningTeamIndex = winningTeamIndex;

					// Assuming pug.onGoingPugs.teams is an array of all teams in the PUG.
					const allTeams = pug.teams;

					// All teams except the winning one are losing teams.
					const losingTeamIndices = allTeams
						.map((_, index) => index) // Create an array of all indices
						.filter((index) => index !== winningTeamIndex); // Exclude the winning index

					// Create an embed to display match result information
					const embed = new EmbedBuilder()
						.setColor(0x0099ff) // Blue color for success
						.setTitle("PUG Match Results Updated")
						.setDescription(
							`ELO updated for players in the specified match of the PUG.\nWinners gained ${WINNER_ELO_CHANGE} ELO, losers lost ${LOSER_ELO_CHANGE} ELO.`
						)
						.addFields(
							{
								name: "🏆 Winning Team",
								value: `Team ${winningTeamIndex + 1}`,
								inline: true,
							},
							{
								name: "💔 Losing Teams",
								value: losingTeamIndices
									.map((index) => `Team ${index + 1}`)
									.join(", "),
								inline: true,
							},
							{
								name: "⚔️ Match Counter",
								value: pug.matchCounter.toString(),
								inline: true,
							}
						);

					const playerProfileDoc = await pugModel.findOne({
						serverId: interaction.guild.id,
						categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
					});
					// Create strings to hold player information for the embed
					let winningTeamPlayersValue = "";
					let losingTeamPlayersValue = "";

					// Winning Team Players
					const winningTeamPlayers = allTeams[winningTeamIndex].players;
					winningTeamPlayers.forEach((playerTag) => {
						const playerProfile = playerProfileDoc.playerProfiles.find(
							(profile) => profile.userTag === playerTag
						);
						winningTeamPlayersValue += `${playerTag} (ELO: ${
							playerProfile.userELO
						} ➡️ ${playerProfile.userELO + WINNER_ELO_CHANGE})\n`;
					});

					// Losing Team Players
					losingTeamIndices.forEach((losingIndex) => {
						allTeams[losingIndex].players.forEach((playerTag) => {
							const playerProfile = playerProfileDoc.playerProfiles.find(
								(profile) => profile.userTag === playerTag
							);
							losingTeamPlayersValue += `${playerTag} (ELO: ${
								playerProfile.userELO
							} ➡️ ${playerProfile.userELO + LOSER_ELO_CHANGE})\n`;
						});
					});

					// Add team player fields to the embed
					embed.addFields(
						{
							name: `🥇 Winning Team (Team ${winningTeamIndex + 1})`,
							value: winningTeamPlayersValue || "No players",
							inline: false,
						},
						{
							name: `💔 Losing Teams`,
							value: losingTeamPlayersValue || "No players",
							inline: false,
						}
					);

					// Set the footer using an object
					embed.setFooter({
						text: "PUG Match Results",
						iconURL: "https://example.com/icon.png", // Replace with the actual URL of your icon
					});

					// Create a button for disputes
					const disputeButton = new ButtonBuilder()
						.setCustomId("dispute_results")
						.setLabel("Dispute Results")
						.setStyle(ButtonStyle.Danger); // 'Danger' style to indicate a dispute action

					// Create an action row and add the button to it
					const row = new ActionRowBuilder().addComponents(disputeButton);

					// Send the embed with the interaction
					await interaction.reply({
						embeds: [embed],
						components: [row],
						ephemeral: false, // Visible to all users
					});

					await updatePlayerStatsForMatch(pug.matchCounter, winningTeamIndex);

					// Set the players array to an empty array, indicating no players are in this PUG
					pug.players = [];

					// Proceed to update the document in the database to reflect this change
					await pugModel.updateOne(
						{
							serverId: interaction.guild.id, // Match the document by server ID
							categoryIds: { $in: [interaction.channel.parentId] }, // Ensure the current category ID is within the categoryIds array
							"onGoingPugs.matchCounter": pug.matchCounter, // Additionally match the specific matchCounter within onGoingPugs
						},
						{ $set: { "onGoingPugs.$.players": [] } } // Directly set to an empty array
					);

					// Save the updated document
					await pugModel.updateOne(
						{
							serverId: interaction.guild.id, // Match the document by server ID
							categoryIds: { $in: [interaction.channel.parentId] }, // Ensure the current category ID is within the categoryIds array
						},
						{ $set: { onGoingPugs: playerProfileDoc.onGoingPugs } }
					);
				}
			} else {
				// Assume `pug` is the match instance and `userId` is defined
				const updatedPlayers = pug.players.filter(
					(player) => player.userId !== interaction.user.id
				);
				pug.players = updatedPlayers;

				// Proceed to update the document in the database
				await pugModel.updateOne(
					{
						serverId: interaction.guild.id, // Use the serverId from the interaction
						categoryIds: { $in: [interaction.channel.parentId] }, // Make sure the current categoryId is in the document's categoryIds array
						"onGoingPugs.matchCounter": pug.matchCounter, // Match the specific pug by its matchCounter
					},
					{ $set: { "onGoingPugs.$.players": updatedPlayers } } // Update the players array for the matched pug
				);

				const pugCategory = await pugModel.findOne({
					serverId: interaction.guild.id,
					categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
				});

				const pugQueueChannelMention = `<#${pugCategory.pugQueEmbedChannelId}>`;
				const howToPugChannelMention = `<#${pugCategory.howToPugChannelId}>`;
				// Not all players have voted yet
				await interaction.reply({
					content: `Thanks for voting <@${
						interaction.user.id
					}>, Your vote for Team ${
						teamIndex + 1
					} has been successfully recorded. You may now queue again in ${pugQueueChannelMention} while waiting for votes from all players.`,
					ephemeral: false,
				});
			}

			// Save the updated document
			await pugModel.updateOne(
				{
					serverId: interaction.guild.id, // Use the serverId from the interaction
					categoryIds: { $in: [interaction.channel.parentId] }, // Make sure the current categoryId is in the document's categoryIds array
				},
				{ $set: { onGoingPugs: doc.onGoingPugs } }
			);
		} else {
			// Handle the case where the PUG could not be found
			await interaction.reply({
				content: "Could not find the match you are voting for.",
				ephemeral: true,
			});
		}
	} else if (interaction.customId === "cancel_report") {
		// Handle cancellation
		await interaction.reply({
			content: "Report cancelled.",
			ephemeral: true,
		});
	} else if (interaction.customId === "dispute_results") {
		// Acknowledge the button press
		await interaction.reply({
			content: "A request for a dispute was made. Mods have been notified.",
			ephemeral: true, // This can be ephemeral: true if you only want the person who clicked to see it
		});
		const pug = doc.onGoingPugs.find((p) => p.matchCounter === matchCounter);
		// Fetch the server configuration from your database
		const serverConfig = await pugModel.findOne({
			serverId: interaction.guild.id,
			categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
		});

		if (!serverConfig || !serverConfig.modChannelId) {
			console.error("Moderator channel ID not set for this server.");
			return;
		}

		// Notify moderators by sending a message to the stored moderator channel ID
		const modChannel = interaction.guild.channels.cache.get(
			serverConfig.modChannelId
		);

		if (modChannel) {
			const disputeEmbed = new EmbedBuilder()
				.setColor(0xff0000) // Red color to signify alert or attention needed
				.setTitle("🚩 Dispute Requested")
				.setDescription(
					"A dispute has been initiated for a match result. Please review the dispute."
				)
				.addFields(
					{ name: "Match Counter", value: `${pug.matchCounter}`, inline: true },
					{ name: "Initiator", value: `${interaction.user.tag}`, inline: true },
					// Use a mention to make the channel name clickable
					{
						name: "Channel",
						value: `<#${interaction.channel.id}>`,
						inline: true,
					}
				)
				.setTimestamp()
				.setFooter({
					text: "Quickly navigate to the channel to review the dispute.",
				});

			modChannel.send({ embeds: [disputeEmbed] }).catch(console.error); // Ensure to catch any errors
		} else {
			console.log(
				"Moderator channel not found or bot lacks permission to access it."
			);
		}
	}
};
