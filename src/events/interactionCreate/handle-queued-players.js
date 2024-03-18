/** @format */

// src/events/interactionCreate/handle-queued-players.js
const { ChannelType } = require("discord.js");
const mongoose = require("mongoose");
const pugModel = require("../../models/pug-model");

const {
	matchFoundEmbed,
	matchFoundComponents,
} = require("../../assets/embeds/match-found-embed");

const {
	matchRoomEmbed,
	matchRoomComponents,
} = require("../../assets/embeds/match-room-embed");

const {
	pugQueEmbed,
	components,
} = require("../../assets/embeds/pug-que-embed");

module.exports = async (client, interaction) => {
	// After a match is accepted and channels are created

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

	async function clearAllPlayersForSpecificPug(
		serverId,
		categoryName,
		readyCheckCounter
	) {
		try {
			// Locate the document for the specific server and category to ensure it exists
			const doc = await pugModel.findOne({
				serverId: serverId,
				categoryName: categoryName,
			});

			if (!doc) {
				console.log("Document not found.");
				return;
			}

			// Prepare the updates for matchFoundPlayers and acceptedMatchFoundPlayers by clearing players array
			// where the readyCheckCounter matches.
			const updatedMatchFoundPlayers = doc.matchFoundPlayers.map((pug) => {
				if (pug.readyCheckCounter === readyCheckCounter) {
					return { ...pug, players: [] }; // Clear the players array for matching counter
				}
				return pug;
			});

			const updatedAcceptedMatchFoundPlayers =
				doc.acceptedMatchFoundPlayers.map((pug) => {
					if (pug.readyCheckCounter === readyCheckCounter) {
						return { ...pug, players: [] }; // Similarly clear the players array
					}
					return pug;
				});

			// Update the document using pugModel.updateOne
			await pugModel.updateOne(
				{ _id: doc._id },
				{
					$set: {
						matchFoundPlayers: updatedMatchFoundPlayers,
						acceptedMatchFoundPlayers: updatedAcceptedMatchFoundPlayers,
					},
				}
			);

			console.log(
				`Cleared all players for PUGs with readyCheckCounter ${readyCheckCounter}.`
			);
		} catch (error) {
			console.error("Failed to clear all players for specific PUG:", error);
		}
	}

	async function startReadyCheck(serverId, categoryName, readyCheckCounter) {
		// Set a 5-minute timeout for the ready check
		setTimeout(async () => {
			try {
				// Fetch the latest document state
				const doc = await pugModel.findOne({ serverId, categoryName });
				if (!doc) {
					console.error("Document not found.");
					return;
				}
				console.log("Current readyCheckCounter:", readyCheckCounter);
				const match = doc.matchFoundPlayers.find(
					(match) => match.readyCheckCounter === readyCheckCounter
				);

				if (match) {
					console.log(`Ready check #${readyCheckCounter} started processing.`);

					// Fetch the accepted players for this ready check
					const acceptedPlayers = doc.acceptedMatchFoundPlayers.filter(
						(p) => p.readyCheckCounter === readyCheckCounter
					);

					if (acceptedPlayers.length < doc.totalNumOfPlayersPerPUG) {
						console.log(
							`Not all players accepted ready check #${readyCheckCounter}.`
						);

						// Log queuedPlayers before changes
						console.log(
							`Before updating, queuedPlayers: ${JSON.stringify(
								doc.queuedPlayers
							)}`
						);

						// Move accepted players to queuedPlayers, clearing their 'players' arrays
						doc.queuedPlayers.push(
							...acceptedPlayers.flatMap((player) => {
								if (player.players.length > 0) {
									const playerNames = player.players;
									player.players = []; // Clear players
									return playerNames;
								} else {
									return []; // No players to move
								}
							})
						);

						// Log queuedPlayers after changes
						console.log(
							`After updating, queuedPlayers: ${JSON.stringify(
								doc.queuedPlayers
							)}`
						);

						// Modified Update Logic
						await pugModel.updateOne(
							{ _id: doc._id },
							{
								$set: {
									queuedPlayers: doc.queuedPlayers,
									acceptedMatchFoundPlayers: doc.acceptedMatchFoundPlayers,
									matchFoundPlayers: doc.matchFoundPlayers.map((match) => {
										if (match.readyCheckCounter === readyCheckCounter) {
											match.players = [];
										}
										return match;
									}),
								},
							}
						);

						updatePugQueueEmbed();

						// *****************************************
						// Section : deletes ready check channel and category
						// *****************************************
						// Fetch all channels of the guild
						let guild = interaction.guild;
						guild.channels
							.fetch()
							.then((channels) => {
								// Find the category to delete based on the provided name
								const categoryToDelete = channels.find(
									(channel) =>
										channel.name ===
											`${baseCategoryName} Ready Check#${readyCheckCounter}` &&
										channel.type === ChannelType.GuildCategory
								);

								// Check if the specified category exists
								if (categoryToDelete) {
									// Filter out all channels that are children of the specified category
									console.log(`Deletion in progress...`.red.inverse);
									channels
										.filter(
											(channel) => channel.parentId === categoryToDelete.id
										)
										.forEach((channel) => {
											// Delete each channel found in the category
											channel.delete().catch(console.error);
											console.log(
												`Channel "${channel.name}" has been deleted.`.red
											);
										});

									// After deleting all channels, delete the category itself
									categoryToDelete
										.delete()
										.then(() => {
											// Log the successful deletion of the category
											console.log(
												`Category "${categoryName}" and its channels have been deleted in the discord.`
													.red.inverse
											);
										})
										.catch(console.error);
								} else {
									console.log(`Category "${categoryName}" does not exist.`);
								}
							})
							.catch(console.error); // Handle any errors during the fetching process
						console.log(
							`Ready check #${readyCheckCounter} expired. Accepted players have been moved back to the queue.`
						);
					} else {
						console.log(
							`All players accepted the ready check #${readyCheckCounter}!`
						);
						// Implement logic to handle a successful ready check (e.g., start the PUG)
					}
				} else {
					console.error(
						`Ready check #${readyCheckCounter} not found in the document.`
					);
				}
			} catch (error) {
				console.error(
					"An error occurred during ready check processing:",
					error
				);
			}
		}, 5 * 60 * 1000); // 1 minute = 60 * 1000
	}

	async function deleteEmptyPug(docId) {
		const doc = await pugModel.findById(docId);
		if (!doc) {
			console.log("Document not found.");
			return;
		}

		let guild = interaction.guild;

		// Loop through each onGoingPug
		for (let pug of doc.onGoingPugs) {
			// Check if the pug should be deleted (e.g., players array is empty)
			if (pug.players.length === 0) {
				// Delete team voice channels
				for (let channelId of pug.teamVoiceChannelIds) {
					try {
						await guild.channels.delete(channelId);
						console.log(`Voice channel with ID ${channelId} has been deleted.`);
					} catch (error) {
						console.error(
							`Error deleting voice channel with ID ${channelId}: `,
							error
						);
					}
				}

				// Delete match room text channel
				try {
					await guild.channels.delete(pug.matchRoomEmbedChannelId);
					console.log(
						`Text channel with ID ${pug.matchRoomEmbedChannelId} has been deleted.`
					);
				} catch (error) {
					console.error(
						`Error deleting text channel with ID ${pug.matchRoomEmbedChannelId}: `,
						error
					);
				}

				// Delete the match room channel (if separate from matchRoomEmbedChannelId and stored)
				if (pug.matchRoomChannelId) {
					try {
						await guild.channels.delete(pug.matchRoomChannelId);
						console.log(
							`Match room channel with ID ${pug.matchRoomChannelId} has been deleted.`
						);
					} catch (error) {
						console.error(
							`Error deleting match room channel with ID ${pug.matchRoomChannelId}: `,
							error
						);
					}
				}

				// Attempt to delete the category
				try {
					await guild.channels.delete(pug.matchCategoryId);
					console.log(
						`Category with ID ${pug.matchCategoryId} and its channels deleted successfully!`
					);
				} catch (error) {
					console.error(
						`Error deleting category with ID ${pug.matchCategoryId}: `,
						error
					);
				}

				// ...rest of your code for handling the pug deletion in the database
			}
		}

		// ...rest of your code
	}

	// Function to find and monitor voice channels for emptiness based on PUG properties
	// Function to monitor voice channels for a specific PUG based on matchCounter
	async function monitorPugVoiceChannels(docId, matchCounter, guild) {
		const doc = await pugModel.findById(docId);
		if (!doc) {
			console.log("Document not found.");
			return;
		}

		// Find the PUG using matchCounter
		const pug = doc.onGoingPugs.find(
			(pug) => pug.matchCounter === matchCounter
		);
		if (!pug) {
			console.log(`PUG with matchCounter ${matchCounter} not found.`);
			return;
		}

		// Initialize map to track empty state and time for each voice channel
		const emptySinceMap = new Map(
			pug.teamVoiceChannelIds.map((id) => [id, null])
		);

		// Function to check emptiness of channels and decide on cleanup
		const checkChannels = async () => {
			let allEmpty = true;

			for (const channelId of pug.teamVoiceChannelIds) {
				const channel = await guild.channels.fetch(channelId);
				const isEmpty = channel.members.size === 0;

				if (isEmpty) {
					if (!emptySinceMap.get(channelId)) {
						emptySinceMap.set(channelId, new Date()); // Mark as empty now
					} else if (
						new Date() - emptySinceMap.get(channelId) <
						5 * 60 * 1000
					) {
						allEmpty = false; // Not empty long enough
					}
				} else {
					emptySinceMap.set(channelId, null); // Not empty
					allEmpty = false;
				}
			}

			// If all channels have been empty for at least 5 minutes, proceed with cleanup
			if (allEmpty) {
				clearInterval(checkInterval);
				await clearPlayersAndPotentiallyDeletePug(doc._id, matchCounter);
			}
		};

		// Start periodic checks
		const checkInterval = setInterval(checkChannels, 5 * 60 * 1000); // Check every 5 minutes
	}

	// Adjusted function for cleanup based on matchCounter
	async function clearPlayersAndPotentiallyDeletePug(docId, matchCounter) {
		const doc = await pugModel.findById(docId);
		if (!doc) {
			console.log("Document not found.");
			return;
		}

		// Find the index of the PUG to clear players
		const pugIndex = doc.onGoingPugs.findIndex(
			(pug) => pug.matchCounter === matchCounter
		);
		if (pugIndex !== -1) {
			// Log before clearing for debugging
			console.log(doc.onGoingPugs[pugIndex].players);

			// Prepare the path to the players array for the specific PUG
			const playersPath = `onGoingPugs.${pugIndex}.players`;

			// Prepare the update object to clear the players array
			const update = { $set: {} };
			update.$set[playersPath] = [];

			// Update the document using pugModel.updateOne
			await pugModel.updateOne({ _id: docId }, update);

			// Log after updating for debugging
			console.log(`Cleared Players array for PUG #${matchCounter}.`);

			// Optionally delete the PUG here if it meets your criteria
			await deleteEmptyPug(doc._id); // Ensure deleteEmptyPug is awaited if it's an async function
		}
	}

	// *****************************************
	// Section : Initilize Variables
	// initilize the variables to be used throughout the code
	// *****************************************

	let channel = interaction.channel;
	if (!channel) {
		console.error(
			"The interaction does not have an associated channel.".yellow
		);
		return;
	}
	let category = channel.parent;
	if (!category) {
		console.error("The channel does not have an associated category.".yellow);
		return;
	}
	let categoryName = category.name;
	let baseCategoryName = categoryName.split(" ")[0]; // This will give you "5v5" if categoryName is "5v5 PUG#1"
	let doc = await pugModel.findOne({
		serverId: interaction.guild.id,
		categoryName: baseCategoryName,
	});
	if (!doc) {
		console.log(
			`No Doc Just yet waiting for the doc to be created for ${categoryName} PUG!`
				.yellow
		);
		return;
	}
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

	// **********************************************************************************
	// Section : Enough Players To Start Pug Logic (Full Queue)
	// **********************************************************************************
	// **********************************************************************************
	// Section : Enough Players To Start Pug Logic (Full Queue)
	// **********************************************************************************
	// **********************************************************************************
	// Section : Enough Players To Start Pug Logic (Full Queue)
	// **********************************************************************************
	// **********************************************************************************
	// Section : Enough Players To Start Pug Logic (Full Queue)
	// **********************************************************************************
	// **********************************************************************************
	// Section : Enough Players To Start Pug Logic (Full Queue)
	// **********************************************************************************
	// totalNumOfPlayersPerPUG = user input
	// if (queuedPlayers.length >= totalNumOfPlayersPerPUG) {
	if (
		queuedPlayers.length >= totalNumOfPlayersPerPUG &&
		!doc.matchFoundEmbedChannelId
	) {
		let newReadyCheckCounter = readyCheckCounter + 1;
		doc.readyCheckCounter = newReadyCheckCounter;

		await doc.save();
		// Grab the players from the doc.queuedPlayers array and add them to the matchFoundPlayers array
		console.log(
			`Transfering Data...\n`.magenta.inverse +
				`Moving doc.queuedPlayers to matchFoundPlayers...`.magenta
		);
		// transfer players from doc.queuedPlayers to matchFoundPlayers and store it in the database
		console.log(
			`Checking values before transfer...\n${doc.queuedPlayers}`.black
		);
		// slice the first 10 players from the queuedPlayers array and store it in a new array
		let newMatchFoundPlayers = doc.queuedPlayers.splice(
			0,
			doc.totalNumOfPlayersPerPUG
		);
		// store the players that we sliced from the queuedPlayers array into the matchFoundPlayers array as an object and we can access the pug we want by the readyCheckCounter - 1
		matchFoundPlayers.push({
			readyCheckCounter: newReadyCheckCounter,
			players: newMatchFoundPlayers,
		});
		await doc.save();
		for (let i = 0; i < matchFoundPlayers.length; i++) {
			console.log(
				`Moved Player: ${JSON.stringify(matchFoundPlayers[i])}`.magenta
			);
		}
		console.log(
			`Data Stored!...`.green.inverse +
				`\nmatchFoundPlayers : ${JSON.stringify(matchFoundPlayers)}`.green
		);

		// Step 3: update the embed on pug-que-interface
		try {
			const channelId = doc.pugQueEmbedChannelId;
			const messageId = doc.pugQueEmbedMessageId;

			const channel = await interaction.guild.channels.cache.get(channelId);
			const message = await channel.messages.fetch(messageId);

			// Update the embed
			const embed = pugQueEmbed(doc);
			embed.setFields([
				{
					name: "Players Queued",
					value: doc.queuedPlayers.length.toString(),
					inline: true,
				},
				{
					name: "Players Needed:",
					value: doc.totalNumOfPlayersPerPUG.toString(),
					inline: true,
				},
				{
					name: "Who's Queued:",
					value: doc.queuedPlayers.join("\n") || "No players queued.",
				},
			]);
			await message.edit({
				embeds: [embed],
				components: components,
			});
			console.log(
				`Embed updated for ${categoryName} PUG Que Interface`.blue.inverse
			);
		} catch (err) {
			console.log("Something wrong when updating data!", err);
		}
		try {
			// Step 5: Create the match room category and channels
			const guild = interaction.guild;
			const embed = matchFoundEmbed(doc);
			const components = matchFoundComponents;
			// create the match found category
			const matchFoundCategory = await guild.channels.create({
				name: `${baseCategoryName} Ready Check#${newReadyCheckCounter}`,
				type: ChannelType.GuildCategory,
			});
			// send the match found interface message
			const matchFoundInterfaceChannel = await guild.channels.create({
				name: "match-found-interface",
				type: ChannelType.GuildText,
				parent: matchFoundCategory.id,
			});
			const sentMessage = await matchFoundInterfaceChannel.send({
				embeds: [embed],
				components: components,
			});
			console.log(
				`Match Found Channels created for ${categoryName} Ready Check`.blue
					.inverse
			);

			const matchFoundEmbedChannelId = sentMessage.channel.id;
			const matchFoundEmbedMessageId = sentMessage.id;

			//console log the type of matchFoundEmbedChannelId and matchFoundEmbedMessageId
			console.log(
				`matchFoundEmbedChannelId type: ${typeof matchFoundEmbedChannelId}\n and the value is: ${matchFoundEmbedChannelId} `
			);
			console.log(
				`matchFoundEmbedMessageId type: ${typeof matchFoundEmbedMessageId} \n and the value is: ${matchFoundEmbedMessageId}`
			);

			await pugModel.updateOne(
				{
					categoryName: baseCategoryName, // Identify the correct document
				},
				{
					$set: {
						"matchFoundPlayers.$[match].matchFoundEmbedChannelId":
							matchFoundEmbedChannelId,
						"matchFoundPlayers.$[match].matchFoundEmbedMessageId":
							matchFoundEmbedMessageId,
					},
				},
				{
					arrayFilters: [
						{ "match.readyCheckCounter": newReadyCheckCounter }, // Filter for the subdocument to update
					],
				}
			);

			// Call startReadyCheck() where you initiate the ready check
			startReadyCheck(doc.serverId, categoryName, newReadyCheckCounter);
		} catch (error) {
			console.error("Error creating match found category and channels:", error);
		}
	}

	// ********************************************************************************************************************************
	// Section : Enough To Start Match because everyone accepted the match (acceptedMatchFoundPlayers.length = totalNumOfPlayersPerPUG)
	// ********************************************************************************************************************************
	// ********************************************************************************************************************************
	// Section : Enough To Start Match because everyone accepted the match (acceptedMatchFoundPlayers.length = totalNumOfPlayersPerPUG)
	// ********************************************************************************************************************************
	// ********************************************************************************************************************************
	// Section : Enough To Start Match because everyone accepted the match (acceptedMatchFoundPlayers.length = totalNumOfPlayersPerPUG)
	// ********************************************************************************************************************************
	// ********************************************************************************************************************************
	// Section : Enough To Start Match because everyone accepted the match (acceptedMatchFoundPlayers.length = totalNumOfPlayersPerPUG)
	// ********************************************************************************************************************************
	// ********************************************************************************************************************************
	// Section : Enough To Start Match because everyone accepted the match (acceptedMatchFoundPlayers.length = totalNumOfPlayersPerPUG)
	// ********************************************************************************************************************************
	// ********************************************************************************************************************************
	// Section : Enough To Start Match because everyone accepted the match (acceptedMatchFoundPlayers.length = totalNumOfPlayersPerPUG)
	// ********************************************************************************************************************************

	// if (acceptedMatchFoundPlayers.length === totalNumOfPlayersPerPUG) {
	// 	// condition met to create the match room category and channels

	// **********************************************************************************
	// Section: Match Start Logic
	// **********************************************************************************
	// Find a match that is ready to start without relying on readyCheckCounter alignment
	const readyMatch = acceptedMatchFoundPlayers.find(
		(match) => match.players.length === totalNumOfPlayersPerPUG
		// Add any other conditions here if needed
	);

	if (readyMatch) {
		console.log(
			`Condition met...\n`.blue.inverse +
				`acceptedMatchFoundPlayers length is equal to the totalNumOfPlayersPerPUG\n`
					.blue
		);

		// Create the match room category and channels
		const guild = interaction.guild;
		const embed = matchRoomEmbed(doc);
		const components = matchRoomComponents;

		// Increment match counter
		let newMatchCounter = matchCounter + 1;
		//  TODO: Add a check to make sure the matchCounter doesn't exceed the max value of a 32-bit integer
		if (newMatchCounter >= 2147483647) {
			newMatchCounter = 1;
		}
		// Save the incremented match counter to the database
		doc.matchCounter = newMatchCounter;

		// Step 2: Save the modified doc to the database
		await doc.save();
		// Re-fetch the updated document from the database
		doc = await pugModel.findOne({
			serverId: interaction.guild.id,
			categoryName: baseCategoryName,
		});
		// Accessing the players array inside matchFoundPlayers using dot notation
		const players = matchFoundPlayers[doc.readyCheckCounter - 1].players;
		console.log(`players: ${players}`);

		// use CRUD to update the onGoingPugs, matchFoundPlayers, and acceptedMatchFoundPlayers arrays in the database
		await pugModel.updateOne(
			{ categoryName: baseCategoryName },
			{
				$set: {
					onGoingPugs: {
						matchCounter: newMatchCounter,
						players: players,
					},
				},
			}
		);

		// clearing the old arrays
		clearAllPlayersForSpecificPug(
			doc.serverId,
			doc.categoryName,
			doc.readyCheckCounter
		);

		// *****************************************
		// Section : deletes ready check channel when everyone accepts the match
		// *****************************************
		// Fetch all channels of the guild
		guild.channels
			.fetch()
			.then((channels) => {
				// Find the category to delete based on the provided name
				const categoryToDelete = channels.find(
					(channel) =>
						channel.name ===
							`${baseCategoryName} Ready Check#${readyCheckCounter}` &&
						channel.type === ChannelType.GuildCategory
				);

				// Check if the specified category exists
				if (categoryToDelete) {
					// Filter out all channels that are children of the specified category
					console.log(`Deletion in progress...`.red.inverse);
					channels
						.filter((channel) => channel.parentId === categoryToDelete.id)
						.forEach((channel) => {
							// Delete each channel found in the category
							channel.delete().catch(console.error);
							console.log(`Channel "${channel.name}" has been deleted.`.red);
						});

					// After deleting all channels, delete the category itself
					categoryToDelete
						.delete()
						.then(() => {
							// Log the successful deletion of the category
							console.log(
								`Category "${categoryName}" and its channels have been deleted in the discord.`
									.red.inverse
							);
						})
						.catch(console.error);
				} else {
					console.log(`Category "${categoryName}" does not exist.`);
				}
			})
			.catch(console.error); // Handle any errors during the fetching process

		try {
			// Create the match category
			const matchCategory = await guild.channels.create({
				name: `${baseCategoryName} PUG#${newMatchCounter}`,
				type: ChannelType.GuildCategory,
			});

			// Array to hold the IDs of the created voice channels
			const teamVoiceChannelIds = [];

			// Create voice channels for each team
			for (let i = 1; i <= numOfTeamsPerPUG; i++) {
				const voiceChannel = await guild.channels.create({
					name: `Team ${i}`,
					type: ChannelType.GuildVoice,
					parent: matchCategory.id,
				});
				// Store the created voice channel's ID
				teamVoiceChannelIds.push(voiceChannel.id);
			}

			// Create the match room text channel
			const matchRoomChannel = await guild.channels.create({
				name: "match-room",
				type: ChannelType.GuildText,
				parent: matchCategory.id,
			});

			// Send the match room interface message
			const matchRoomInterfaceChannel = await guild.channels.create({
				name: "match-room-interface",
				type: ChannelType.GuildText,
				parent: matchCategory.id,
			});

			const sentMessage2 = await matchRoomInterfaceChannel.send({
				embeds: [embed],
				components: matchRoomComponents,
			});

			console.log(
				`Match channels created for ${baseCategoryName} `.blue +
					`PUG#${newMatchCounter}`.blue.inverse
			);

			const matchRoomEmbedChannelId = sentMessage2.channel.id;
			const matchRoomEmbedMessageId = sentMessage2.id;
			const matchCategoryId = matchCategory.id;
			const matchRoomChannelId = matchRoomChannel.id;
			// use CRUD to update the onGoingPugs, matchFoundPlayers, and acceptedMatchFoundPlayers arrays in the database
			await pugModel.updateOne(
				{ categoryName: baseCategoryName },
				{
					$set: {
						onGoingPugs: {
							matchCounter: newMatchCounter,
							players: players,
							matchRoomEmbedChannelId: matchRoomEmbedChannelId,
							matchRoomEmbedMessageId: matchRoomEmbedMessageId,
							teamVoiceChannelIds: teamVoiceChannelIds,
							matchCategoryId: matchCategoryId,
							matchRoomChannelId: matchRoomChannelId,
						},
					},
				}
			);

			monitorPugVoiceChannels(doc._id, newMatchCounter, guild);
		} catch (error) {
			console.error("Error creating match category and channels:", error);
		}
	}
};
