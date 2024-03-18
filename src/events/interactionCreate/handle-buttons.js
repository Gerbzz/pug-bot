/** @format */

// src/events/interactionCreate/handle-buttons.js
const pugModel = require("../../models/pug-model");
const { ChannelType } = require("discord.js");
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
				categoryName: baseCategoryName,
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
			const doc = await pugModel.findOne({ categoryName: baseCategoryName });
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
				categoryName: baseCategoryName,
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
	async function updateMatchAndAcceptedPlayers(
		docId,
		matchFoundPlayers,
		acceptedMatchFoundPlayers
	) {
		try {
			await pugModel.updateOne(
				{ _id: docId },
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

	async function deleteEmptyPug(docId) {
		const doc = await pugModel.findById(docId);
		if (!doc) {
			console.log("Document not found.");
			return;
		}

		// Assuming each onGoingPug has a categoryId for the associated Discord category
		doc.onGoingPugs.forEach(async (pug, index) => {
			if (pug.players.length === 0) {
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
					}
				} else {
					console.error("Channel to delete not found");
				}
			}
		});
	}

	const channel = interaction.channel;
	const category = channel.parent;
	const categoryName = category ? category.name : "Unknown Category";
	const baseCategoryName = categoryName.split(" ")[0];

	// Fetch the document from the database
	let doc = await pugModel.findOne({
		serverId: interaction.guild.id,
		categoryName: baseCategoryName,
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
		if (
			!doc.queuedPlayers.includes(interaction.user.tag) &&
			!doc.matchFoundPlayers.some((match) =>
				match.players.includes(interaction.user.tag)
			) &&
			!doc.acceptedMatchFoundPlayers.some((match) =>
				match.players.includes(interaction.user.tag)
			) &&
			!doc.onGoingPugs.some((match) =>
				match.players.includes(interaction.user.tag)
			)
		) {
			doc.queuedPlayers.push(interaction.user.tag);
			console.log(`${interaction.user.tag} joined the queue...`.magenta);

			// Update the database with the new queuedPlayers array
			await pugModel.updateOne(
				{ _id: doc._id },
				{ queuedPlayers: doc.queuedPlayers }
			);
			await interaction.reply({
				content: `You have joined the queue for ${categoryName}!`,
				ephemeral: true,
			});
			updatePugQueueEmbed();
			updatePugQueueEmbed();
		} else {
			await interaction.reply({
				content: `You are already in the queue or a match for ${categoryName}.`,
				ephemeral: true,
			});
		}
		return;
	}

	// **********************************************************************************
	// Section : Leave Queue
	// **********************************************************************************
	else if (interaction.customId === "leaveQueue") {
		if (doc.queuedPlayers.includes(interaction.user.tag)) {
			doc.queuedPlayers = doc.queuedPlayers.filter(
				(tag) => tag !== interaction.user.tag
			);

			// Remove the user from matchFoundPlayers and acceptedMatchFoundPlayers
			doc.matchFoundPlayers = doc.matchFoundPlayers.map((match) => ({
				...match,
				players: match.players.filter((tag) => tag !== interaction.user.tag),
			}));
			doc.acceptedMatchFoundPlayers = doc.acceptedMatchFoundPlayers.filter(
				(match) => !match.players.includes(interaction.user.tag)
			);

			// Update the database with the updated arrays
			await pugModel.updateOne(
				{ _id: doc._id },
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
		console.log(interaction.user.tag + " pressed the accept button".red);
		console.log(interaction.user.tag + " pressed the accept button".red);
		console.log(interaction.user.tag + " pressed the accept button".red);

		// Remove the user's name from the "Waiting on Response From" list
		const matchToAccept = doc.matchFoundPlayers.find((match) =>
			match.players.includes(interaction.user.tag)
		);

		if (matchToAccept) {
			// Find or create the acceptedMatch object
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

			// Prevent adding player if they already accepted
			if (!acceptedMatch.players.includes(interaction.user.tag)) {
				acceptedMatch.players.push(interaction.user.tag);

				// Update the database with the new acceptedMatchFoundPlayers array
				await pugModel.updateOne(
					{ _id: doc._id },
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
		}
		return;
	} else if (interaction.customId === "declineMatchButton") {
		// Find the index of the match the user wants to decline
		const matchIndex = doc.matchFoundPlayers.findIndex(
			(match) =>
				match.players.includes(interaction.user.tag) &&
				match.readyCheckCounter === doc.readyCheckCounter
		);

		if (matchIndex !== -1) {
			console.log(`${interaction.user.tag} declined the match...`.red);

			// Update the players array to remove the declining player
			doc.matchFoundPlayers[matchIndex].players = doc.matchFoundPlayers[
				matchIndex
			].players.filter((player) => player !== interaction.user.tag);

			// Re-queue remaining players
			const playersToRequeue = doc.matchFoundPlayers[matchIndex].players;
			doc.queuedPlayers.push(...playersToRequeue);

			// Update the database to reflect these changes
			await pugModel.updateOne(
				{ _id: doc._id },
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
	} else if (interaction.customId === "leave_game") {
		// 1. Find the active match the player is in
		const matchData = doc.onGoingPugs.find((pug) =>
			pug.players.includes(interaction.user.tag)
		);
		if (!matchData) {
			await interaction.reply({
				content: "You are not currently in an active match.",
				ephemeral: true,
			});
			return;
		}

		// 2. Remove the player from the 'players' array in onGoingPugs
		matchData.players = matchData.players.filter(
			(player) => player !== interaction.user.tag
		);

		// 3. Update the database
		await pugModel.updateOne(
			{ _id: doc._id },
			{ onGoingPugs: doc.onGoingPugs } // Update the entire ongoingPugs array
		);

		// delete the pug after everyone is done
		deleteEmptyPug(doc._id);

		// 4. Send a confirmation message or update the embed
		await interaction.reply({
			content: "You have left the game.",
			ephemeral: true,
		});

		// You likely need to update the match room embed:
		updateMatchRoomEmbed();
	} else if (interaction.customId === "play_again") {
		// 1. Find the active match the player is in
		const matchData = doc.onGoingPugs.find((pug) =>
			pug.players.includes(interaction.user.tag)
		);
		if (matchData) {
			//  2. Remove player from `onGoingPugs` in the database
			matchData.players = matchData.players.filter(
				(player) => player !== interaction.user.tag
			);
			await pugModel.updateOne(
				{ _id: doc._id },
				{ onGoingPugs: doc.onGoingPugs } // Update the entire ongoingPugs array
			);
		}

		// 3. Check if the user is already queued
		if (
			doc.queuedPlayers.includes(interaction.user.tag) ||
			doc.matchFoundPlayers.some((match) =>
				match.players.includes(interaction.user.tag)
			)
		) {
			await interaction.reply({
				content: "You are already in the queue or in a match",
				ephemeral: true,
			});
			return;
		}

		// 4. Add the user to the queuedPlayers array
		doc.queuedPlayers.push(interaction.user.tag);

		// 5. Update the database
		await pugModel.updateOne({ _id: doc._id }, doc); // Update the queuedPlayers

		// delete the pug after everyone is done
		deleteEmptyPug(doc._id);

		// 6. Send a confirmation message or update the embed
		await interaction.reply({
			content: "You are ready to play!",
			ephemeral: true,
		});

		// 7. Update embeds if necessary:
		updatePugQueueEmbed();
	}
};
