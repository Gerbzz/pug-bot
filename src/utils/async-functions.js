/** @format */
// src/utils/async-functions.js
// Function to periodically check and remove expired queue entries

const pugModel = require("../models/pug-model");

const {
	ChannelType,
	PermissionsBitField,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");

const {
	matchRoomEmbed,
	matchRoomComponents,
	teams,
} = require("../assets/embeds/match-room-embed");

const {
	matchFoundEmbed,
	matchFoundComponents,
} = require("../assets/embeds/match-found-embed");

// function to update the pug que embed
async function updatePugQueueEmbed(client, doc, pugQueEmbed) {
	try {
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
		let category = channel.parent;
		if (!category) {
			console.error("The channel does not have an associated category.".yellow);
			return;
		}
		let categoryName = category.name;
		let baseCategoryName = categoryName.split(" ")[0]; // This will give you "5v5" if categoryName is "5v5 PUG#1"

		if (!doc) {
			console.log("No document found for updating embed!");
			return;
		}

		const embed = pugQueEmbed(doc); // Pass the MongoDB data
		await message.edit({ embeds: [embed] });
	} catch (err) {
		console.log("Something went wrong when updating embed data!", err);
	}
}

async function clearAllPlayersForSpecificPug(
	interaction,
	serverId,
	categoryName,
	readyCheckCounter
) {
	try {
		// Locate the document for the specific server and category to ensure it exists
		const doc = await pugModel.findOne({
			serverId: interaction.guild.id,
			categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
		});

		if (!doc) {
			console.log("Document not found in clearAllPlayersForSpecificPug.");
			return;
		}
		console.log("clearAllPlayersForSpecificPug ran!!! ");
		// Prepare the updates for matchFoundPlayers and acceptedMatchFoundPlayers by clearing players array
		// where the readyCheckCounter matches.
		const updatedMatchFoundPlayers = doc.matchFoundPlayers.map((pug) => {
			if (pug.readyCheckCounter === readyCheckCounter) {
				return { ...pug, players: [] }; // Clear the players array for matching counter
			}
			return pug;
		});

		const updatedAcceptedMatchFoundPlayers = doc.acceptedMatchFoundPlayers.map(
			(pug) => {
				if (pug.readyCheckCounter === readyCheckCounter) {
					return { ...pug, players: [] }; // Similarly clear the players array
				}
				return pug;
			}
		);

		// Update the document using pugModel.updateOne
		await pugModel.updateOne(
			{
				_id: doc._id,
				serverId: interaction.guild.id, // Use the serverId from the interaction
				categoryIds: { $in: [interaction.channel.parentId] }, // Make sure the current categoryId is in the document's categoryIds array },
			},
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
async function initiateReadyCheck(
	client,
	guild,
	interaction,
	doc,
	pugQueEmbed,
	matchFoundEmbed,
	matchFoundComponents,
	matchFoundPlayers,
	acceptedMatchFoundPlayers,
	categoryName,
	baseCategoryName
) {
	if (
		doc.queuedPlayers.length >= doc.totalNumOfPlayersPerPUG &&
		!doc.matchFoundEmbedChannelId
	) {
		let newReadyCheckCounter = doc.readyCheckCounter + 1;
		doc.readyCheckCounter = newReadyCheckCounter;

		await doc.save();

		console.log(
			`Transferring Data...\n`.magenta.inverse +
				`Moving doc.queuedPlayers to matchFoundPlayers...`.magenta
		);

		console.log(
			`Checking values before transfer...\n${doc.queuedPlayers}`.black
		);

		let newMatchFoundPlayers = doc.queuedPlayers.splice(
			0,
			doc.totalNumOfPlayersPerPUG
		);

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

		await updatePugQueueEmbed(client, doc, pugQueEmbed);

		try {
			const guild = interaction.guild;
			const embed = matchFoundEmbed(doc);
			const components = matchFoundComponents;

			const matchFoundCategory = await guild.channels.create({
				name: `${categoryName} Ready Check#${newReadyCheckCounter}`,
				type: ChannelType.GuildCategory,
			});

			const matchFoundInterfaceChannel = await guild.channels.create({
				name: "match-found-interface",
				type: ChannelType.GuildText,
				parent: matchFoundCategory.id,
				permissionOverwrites: [
					{
						id: guild.id,
						deny: [PermissionsBitField.Flags.SendMessages.toString()],
					},
				],
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
			const matchFoundCategoryID = matchFoundInterfaceChannel.parentId;

			console.log(
				`Added Match Found Category ID to Database: ${matchFoundCategoryID}`
			);
			doc.categoryIds.push(matchFoundCategoryID);

			await doc.save();

			console.log(
				`matchFoundEmbedChannelId type: ${typeof matchFoundEmbedChannelId}\n and the value is: ${matchFoundEmbedChannelId} `
			);
			console.log(
				`matchFoundEmbedMessageId type: ${typeof matchFoundEmbedMessageId} \n and the value is: ${matchFoundEmbedMessageId}`
			);

			await pugModel.updateOne(
				{
					serverId: interaction.guild.id, // Use the serverId from the interaction
					categoryIds: { $in: [interaction.channel.parentId] }, // Make sure the current categoryId is in the document's categoryIds array },
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
					arrayFilters: [{ "match.readyCheckCounter": newReadyCheckCounter }],
				}
			);

			for (const player of newMatchFoundPlayers) {
				const userId = player.userId;
				try {
					const user = await pugModel.findOne({
						serverId: interaction.guild.id, // Use the serverId from the interaction
						categoryIds: { $in: [interaction.channel.parentId] }, // Make sure the current categoryId is in the document's categoryIds array },
						"playerProfiles.userId": userId,
					});

					if (user) {
						const userTag = user.playerProfiles.find(
							(profile) => profile.userId === userId
						).userTag;

						const pugCategory = await pugModel.findOne({
							serverId: interaction.guild.id,
							categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
						});

						const howToPugChannelId = pugCategory.howToPugChannelId;
						const howToPugChannelMention = `<#${howToPugChannelId}>`;
						const channelMention = `<#${matchFoundEmbedChannelId}>`;

						const embedMessage = new EmbedBuilder()
							.setColor(0x0099ff)
							.setTitle("PUG-Bot Ready Check Initiated")
							.setDescription(
								`Your PUG-Bot game is waiting for you! Here's what you need to do:`
							)
							.addFields(
								{
									name: "Ready Up",
									value: `• Ready up in ${channelMention} by clicking on the green "Accept Match" button.`,
									inline: false,
								},
								{
									name: "Help",
									value: `• For further assistance, refer to ${howToPugChannelMention} how-to-pug.`,
									inline: false,
								}
							)
							.setFooter({
								text: "Thanks for choosing PUG-Bot!",
								iconURL: "https://your-icon-url-here.com",
							});

						const member = interaction.guild.members.cache.get(userId);
						if (member) {
							await member.send({
								embeds: [embedMessage],
							});
						} else {
							console.log(
								`Member with ID ${userId} not found in guild inside of ready check logic..`
							);
						}
					} else {
						console.log(`User with ID ${userId} not found in database.`);
					}
				} catch (error) {
					console.error(`Error sending message to user ${userId}:`, error);
				}
			}

			await processReadyCheck(
				client,
				guild,
				doc,
				doc._id,
				categoryName,
				baseCategoryName,
				newReadyCheckCounter,
				interaction,
				pugQueEmbed
			);
		} catch (error) {
			console.error("Error creating match found category and channels:", error);
		}
	}
}

async function processReadyCheck(
	client,
	guild,
	doc,
	docId,
	categoryName,
	baseCategoryName,
	readyCheckCounter,
	interaction,
	pugQueEmbed
) {
	let readyMatchFound = false; // Flag to indicate if the ready match condition is met

	// Function to check the ready match condition
	async function checkReadyMatchCondition() {
		const currentDoc = await pugModel.findById(doc._id);
		const acceptedMatch = currentDoc.acceptedMatchFoundPlayers.find(
			(am) => am.readyCheckCounter === readyCheckCounter
		);
		const acceptedPlayersCount = acceptedMatch
			? acceptedMatch.players.length
			: 0;

		if (acceptedPlayersCount >= currentDoc.totalNumOfPlayersPerPUG) {
			// If all players have accepted, set the flag to true
			readyMatchFound = true;
			// Clear the interval and timeout as the condition is met
			clearInterval(checkIntervalID);
			clearTimeout(timeoutID);
			// Proceed with match setup
			await startMatch(
				client,
				interaction,
				doc,
				currentDoc.acceptedMatchFoundPlayers,
				currentDoc.totalNumOfPlayersPerPUG,
				currentDoc.matchCounter,
				ChannelType,
				pugModel,
				EmbedBuilder,
				PermissionsBitField,
				matchRoomEmbed,
				matchRoomComponents,
				categoryName,
				baseCategoryName,
				readyCheckCounter,
				pugQueEmbed,
				matchFoundEmbed,
				matchFoundComponents
			);
		}
	}

	// Set an interval to check the ready match condition periodically
	const checkIntervalID = setInterval(() => {
		if (!readyMatchFound) {
			checkReadyMatchCondition();
		}
	}, 5000); // Check every 5 seconds, adjust as needed

	const timeoutID = setTimeout(async () => {
		if (!readyMatchFound) {
			clearInterval(checkIntervalID); // Clear the interval as the timeout expires

			// Logic to handle the case when not all players accepted the ready check
			console.log(
				`Ready check #${readyCheckCounter} expired. Moving accepted players back to queue.`
			);

			// Fetch the current document state
			const currentDoc = await pugModel.findById(doc._id);
			const match = currentDoc.matchFoundPlayers.find(
				(m) => m.readyCheckCounter === readyCheckCounter
			);
			if (match) {
				// Move accepted players back to the queue
				const acceptedMatch = currentDoc.acceptedMatchFoundPlayers.find(
					(am) => am.readyCheckCounter === readyCheckCounter
				);
				// Assume `currentDoc` has been fetched and contains the latest document state.
				const matchFound = currentDoc.matchFoundPlayers.find(
					(m) => m.readyCheckCounter === readyCheckCounter
				);

				if (matchFound) {
					// Players who accepted the ready check
					const acceptedPlayers = acceptedMatch
						? acceptedMatch.players.map((p) => p.userId)
						: [];

					// Notify players who accepted the ready check
					// (Your existing logic here)

					// Identify players who didn't accept the ready check
					const playersDidNotAccept = matchFound.players.filter(
						(player) => !acceptedPlayers.includes(player.userId)
					);

					// Notify players who didn't accept the ready check
					for (const player of playersDidNotAccept) {
						const userId = player.userId;
						try {
							const user = await client.users.fetch(userId);
							const howToPugChannelId = currentDoc.howToPugChannelId; // Assuming this is fetched or known
							const howToPugChannelMention = `<#${howToPugChannelId}>`;
							const pugCategory = await pugModel.findOne({
								serverId: interaction.guild.id,
								categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
							});

							const pugQueueChannelMention = `<#${pugCategory.pugQueEmbedChannelId}>`;

							const embedMessage = new EmbedBuilder()
								.setColor(0xff5555) // Different color to indicate a missed check
								.setTitle("Missed Ready Check")
								.setDescription(
									"You did not respond to the ready check in time."
								)
								.addFields(
									{
										name: "Missed the Ready Check?",
										value:
											"It seems you've missed the ready check for your PUG match.",
										inline: false,
									},
									{
										name: "What Can You Do?",
										value: `Please ensure you're ready for the next match and keep an eye on the PUG queue in ${pugQueueChannelMention}.`,
										inline: false,
									}
								)
								.setFooter({
									text: "Staying ready ensures smoother match setups!",
								});

							// Attempt to send the message
							await user.send({ embeds: [embedMessage] }).catch(console.error);
						} catch (error) {
							console.error(`Error sending message to user ${userId}:`, error);
						}
					}

					// Continue with the rest of your logic (e.g., updating the document, cleaning up, etc.)
				}
				if (acceptedMatch) {
					// Assuming 'acceptedMatch.players' contains the list of players who accepted the match
					for (const player of acceptedMatch.players) {
						// Extract userId from player object
						const userId = player.userId;
						try {
							// Retrieve user details from the database using userId
							const user = await pugModel.findOne({
								serverId: interaction.guild.id, // Use the serverId from the interaction
								categoryIds: { $in: [interaction.channel.parentId] }, // Make sure the current categoryId is in the document's categoryIds array },
								"playerProfiles.userId": userId,
							});

							if (user) {
								// Assuming you have a field called 'userTag' in the playerProfiles
								const userTag = user.playerProfiles.find(
									(profile) => profile.userId === userId
								).userTag;

								// Retrieve PUG category details from the database using the interaction's guild ID and baseCategoryName
								const pugCategory = await pugModel.findOne({
									serverId: interaction.guild.id,
									categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
								});

								if (pugCategory) {
									// Assuming howToPugChannelId is stored in pugCategory
									const howToPugChannelId = pugCategory.howToPugChannelId;
									const howToPughannelMention = `<#${howToPugChannelId}>`;

									// Create a detailed embed message
									const embedMessage = new EmbedBuilder()
										.setColor(0x0099ff) // Set a color for the embed
										.setTitle("PUG Ready Check Expired")
										.setDescription(
											`The ready check for your PUG has expired, and you have been moved back to the queue. Please be ready for the next match.`
										)
										.addFields(
											{
												name: "Next Steps",
												value: `Please wait for the next ready check to participate in a PUG.`,
												inline: false,
											},
											{
												name: "Need Help?",
												value: `For assistance or more information, refer to ${howToPughannelMention}.`,
												inline: false,
											}
										)
										.setFooter({
											text: "Thanks for using PUG-Bot!",
											//iconURL: thumbnailUrl, // Optionally, update this URL to your preferred icon for the bot
										});

									// Send the embed message to the user
									const member = interaction.guild.members.cache.get(userId);
									if (member) {
										await member.send({
											embeds: [embedMessage],
										});
									} else {
										console.log(`Member with ID ${userId} not found in guild.`);
									}
								} else {
									console.log(
										`PUG category not found in the database for server ${interaction.guild.id} and category ${categoryName}.`
									);
								}
							} else {
								console.log(`User with ID ${userId} not found in database.`);
							}
						} catch (error) {
							console.error(`Error sending message to user ${userId}:`, error);
						}
					}

					acceptedMatch.players.forEach((player) => {
						currentDoc.queuedPlayers.push(player); // Move accepted players back to queue
					});
					acceptedMatch.players = []; // Clear the players from the acceptedMatchFoundPlayers for the current ready check
				}

				match.players = []; // Clear the players from the current match

				// Update the document in the database
				await pugModel.updateOne(
					{
						_id: currentDoc._id,
						serverId: interaction.guild.id, // Use the serverId from the interaction
						categoryIds: { $in: [interaction.channel.parentId] }, // Make sure the current categoryId is in the document's categoryIds array },
					},
					{
						$set: {
							queuedPlayers: currentDoc.queuedPlayers,
							matchFoundPlayers: currentDoc.matchFoundPlayers,
							acceptedMatchFoundPlayers: currentDoc.acceptedMatchFoundPlayers,
						},
					}
				);

				// Update the PUG queue embed to reflect the changes
				await updatePugQueueEmbed(client, currentDoc, pugQueEmbed);

				// Logic to delete the ready check channel and notify as necessary
				// Include your specific logic here
				// Here, insert your logic to delete the ready check channel and notify as necessary
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
									`${categoryName} Ready Check#${readyCheckCounter}` &&
								channel.type === ChannelType.GuildCategory
						);

						// Check if the specified category exists
						if (categoryToDelete) {
							// Filter out all channels that are children of the specified category
							// Remove the category ID from the categoryIds array in the MongoDB document
							pugModel.updateOne(
								{
									serverId: interaction.guild.id,
									categoryIds: { $in: [categoryToDelete.id] }, // Ensure the document contains the categoryId to be deleted
								},
								{
									$pull: { categoryIds: categoryToDelete.id }, // Remove the categoryId from the categoryIds array
								}
							);
							console.log(
								`Category ID ${categoryToDelete.id} removed from categoryIds array in MongoDB document.`
							);
							console.log(`Deletion in progress...`.red.inverse);
							channels
								.filter((channel) => channel.parentId === categoryToDelete.id)
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
							console.log(
								`Category "${categoryName}" does not exist in startReadyCheck Function.`
							);
						}
					})
					.catch(console.error); // Handle any errors during the fetching process
				console.log(
					`Ready check #${readyCheckCounter} expired. Accepted players have been moved back to the queue.`
				);
			} else {
				console.error(
					`Ready check #${readyCheckCounter} not found in the document.`
				);
			}
		}
	}, 30 * 1000); // Timeout adjusted for demonstration, set as needed
}

async function startMatch(
	client,
	interaction,
	doc,
	acceptedMatchFoundPlayers,
	totalNumOfPlayersPerPUG,
	matchCounter,
	ChannelType,
	pugModel,
	EmbedBuilder,
	PermissionsBitField,
	matchRoomEmbed,
	matchRoomComponents,
	categoryName,
	baseCategoryName,
	readyCheckCounter
) {
	console.log(
		`Condition met...\n`.blue.inverse +
			`acceptedMatchFoundPlayers length is equal to the totalNumOfPlayersPerPUG\n`
				.blue
	);

	// Create the match room category and channels

	const { embed, teams } = matchRoomEmbed(doc); // Destructure to get both embed and teams

	// Increment match counter
	let newMatchCounter = matchCounter + 1;

	// Save the incremented match counter to the database
	doc.matchCounter = newMatchCounter;

	// Step 2: Save the modified doc to the database
	await doc.save();
	// Fetch the document again to ensure it's up to date
	const updatedDoc = await pugModel.findOne({
		serverId: interaction.guild.id,
		categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
	});

	if (!updatedDoc) {
		console.error("Document not found in match start logic.");
		return;
	}

	// Find the specific match using readyCheckCounter
	const match = updatedDoc.matchFoundPlayers.find(
		(m) => m.readyCheckCounter === readyCheckCounter
	);

	// Check if the match exists and has players
	if (match && match.players) {
		console.log(
			`Ready check #${readyCheckCounter} has ended! Let the pug begin!`
		);
		const players = match.players; // Now safely accessed
		console.log(`players: ${JSON.stringify(players)}`);

		// clearing the old arrays
		clearAllPlayersForSpecificPug(
			interaction,
			updatedDoc.serverId,
			updatedDoc.categoryName,
			updatedDoc.readyCheckCounter
		);

		let guild = interaction.guild;

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
							`${categoryName} Ready Check#${readyCheckCounter}` &&
						channel.type === ChannelType.GuildCategory
				);

				// Check if the specified category exists
				if (categoryToDelete) {
					// Filter out all channels that are children of the specified category
					console.log(`Deletion in progress...`.red.inverse);
					// Remove the categoryId from the database before deleting the category in Discord
					pugModel.updateOne(
						{
							serverId: interaction.guild.id,
							categoryIds: { $in: [categoryToDelete.id] }, // Ensure the document contains the categoryId to be deleted
						},
						{
							$pull: { categoryIds: categoryToDelete.id }, // Remove the categoryId from the categoryIds array
						}
					);

					console.log(
						`CategoryId ${categoryToDelete.id} has been removed from the database.`
					);

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
					console.log(
						`Category "${categoryName}" does not exist in match start logic. `
					);
				}
			})
			.catch(console.error); // Handle any errors during the fetching process

		try {
			// Create the match category
			const matchCategory = await guild.channels.create({
				name: `${categoryName} PUG#${newMatchCounter}`,
				type: ChannelType.GuildCategory,
			});

			// Array to hold the IDs of the created voice channels
			const teamVoiceChannelIds = [];

			// Create voice channels for each team
			for (let i = 1; i <= updatedDoc.numOfTeamsPerPUG; i++) {
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
				permissionOverwrites: [
					{
						id: guild.id,
						deny: [PermissionsBitField.Flags.SendMessages.toString()], // Correctly deny SEND_MESSAGES permission
					},
				],
			});

			const sentMessage2 = await matchRoomInterfaceChannel.send({
				embeds: [embed],
				components: matchRoomComponents,
			});

			console.log(
				`Match channels created for ${categoryName} `.blue +
					`PUG#${newMatchCounter}`.blue.inverse
			);

			const matchRoomEmbedChannelId = sentMessage2.channel.id;
			const matchRoomEmbedMessageId = sentMessage2.id;
			const matchCategoryId = matchCategory.id;
			const matchRoomChannelId = matchRoomChannel.id;
			const pugTeams = teams;

			// use CRUD to update the onGoingPugs, matchFoundPlayers, and acceptedMatchFoundPlayers arrays in the database
			await pugModel.updateOne(
				{
					serverId: interaction.guild.id, // Use the serverId from the interaction
					categoryIds: { $in: [interaction.channel.parentId] }, // Make sure the current categoryId is in the document's categoryIds array },
				},
				{
					$push: {
						onGoingPugs: {
							matchCounter: newMatchCounter,
							players: players,
							matchRoomEmbedChannelId: matchRoomEmbedChannelId,
							matchRoomEmbedMessageId: matchRoomEmbedMessageId,
							teamVoiceChannelIds: teamVoiceChannelIds,
							matchCategoryId: matchCategoryId,
							matchRoomChannelId: matchRoomChannelId,
							pugStatus: "active", // Initialize as active
							teams: pugTeams,
						},
					},
					$addToSet: {
						categoryIds: matchCategoryId, // Add the matchCategoryId to the categoryIds array
					},
				}
			);

			console.log(`Category ID ${matchCategoryId} added to categoryIds array.`);

			for (const player of players) {
				// Extract userId from player object
				const userId = player.userId;
				try {
					// Retrieve user details from the database using userId
					const user = await pugModel.findOne({
						"playerProfiles.userId": userId, // Use the extracted userId
						serverId: interaction.guild.id, // Use the serverId from the interaction
						categoryIds: { $in: [interaction.channel.parentId] }, // Make sure the current categoryId is in the document's categoryIds array },
					});

					if (user) {
						// Assuming you have a field called 'userTag' in the playerProfiles
						const userTag = user.playerProfiles.find(
							(profile) => profile.userId === userId
						).userTag;

						// Retrieve PUG category details from the database using the interaction's guild ID and categoryName
						const pugCategory = await pugModel.findOne({
							serverId: interaction.guild.id,
							categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
						});

						if (pugCategory) {
							// Retrieve how-to-pug channel ID from the PUG category
							const howToPugChannelId = pugCategory.howToPugChannelId;
							// Construct the channel mention
							const howToPughannelMention = `<#${howToPugChannelId}>`;
							// Construct the channel mention
							const channelMention = `<#${matchRoomEmbedChannelId}>`;

							// Create a detailed embed message
							const embedMessage = new EmbedBuilder()
								.setColor(0x0099ff) // Set a color for the embed
								.setTitle("PUG-Bot Game is Ready")
								.setDescription(
									`Your PUG-Bot game is ready to go! Here's what you need to do:`
								)
								.addFields(
									{
										name: "PUG Started!",
										value: `The PUG has started! Please proceed to ${channelMention} to see what team you are on.`,
										inline: false,
									},
									{
										name: "Join Your Team",
										value: `• Join your team's voice channel in (${teamVoiceChannelIds
											.map((id) => `<#${id}>`)
											.join(", ")}).`,
										inline: false,
									},
									{
										name: "Help",
										value: `• For further assistance, refer to ${howToPughannelMention} how-to-pug.`,
										inline: false,
									}
								)
								.setFooter({
									text: "Thanks for choosing PUG-Bot!",
									//iconURL: thumbnailUrl, // You can update this URL to your preferred icon for the bot
								});

							// Send the embed message to the user
							const member = interaction.guild.members.cache.get(userId);
							if (member) {
								await member.send({
									embeds: [embedMessage],
								});
							} else {
								console.log(
									`Member with ID ${userId} not found in guild, inside of start match logic.`
								);
							}
						} else {
							console.log(
								`PUG category not found in the database for server ${interaction.guild.id} and category ${categoryName}.`
							);
						}
					} else {
						console.log(`User with ID ${userId} not found in database.`);
					}
				} catch (error) {
					console.error(`Error sending message to user ${userId}:`, error);
				}
			}

			monitorPugVoiceChannels(doc._id, guild, client, interaction);
		} catch (error) {
			console.error("Error creating match category and channels:", error);
		}
	} else {
		console.error(
			`Match for readyCheckCounter #${readyCheckCounter} not found.`
		);
	}
}

async function deleteEmptyPug(docId, guild, interaction) {
	const doc = await pugModel.findById(docId);
	if (!doc) return;

	for (const pug of doc.onGoingPugs) {
		if (pug.pugStatus === "cleanup-pending") {
			console.log("Preparing to delete channels for pug:", pug.matchCounter);

			// Includes all channel IDs to delete, including match room channels and the category
			const channelsToDelete = [
				...pug.teamVoiceChannelIds,
				pug.matchRoomEmbedChannelId,
				pug.matchRoomChannelId,
				pug.matchCategoryId,
			].filter((id) => id); // Ensure no undefined or null IDs

			// Check existence before attempting deletion
			const existingChannels = await Promise.all(
				channelsToDelete.map(
					(channelId) => guild.channels.fetch(channelId).catch(() => null) // Return null if channel doesn't exist
				)
			);

			for (const channel of existingChannels.filter(Boolean)) {
				// Filter out nulls (non-existent channels)
				try {
					await guild.channels.delete(channel.id);
					console.log(`Channel with ID ${channel.id} has been deleted.`);
				} catch (error) {
					// Log unexpected errors
					console.error(`Unexpected error for channel ${channel.id}:`, error);
				}
			}
			// Remove the category ID from the categoryIds array
			await pugModel.updateOne(
				{ _id: docId },
				{ $pull: { categoryIds: pug.matchCategoryId } } // Use $pull to remove the category ID
			);
			console.log(
				`Category ID ${pug.matchCategoryId} removed from categoryIds array.`
			);
			// Mark the pug as deleted in the document to prevent future attempts
			pug.pugStatus = "deleted";
		}
	}

	// Apply the document updates to reflect the changes
	await pugModel.updateOne(
		{ _id: docId },
		{ $set: { onGoingPugs: doc.onGoingPugs } }
	);
}

// Function to find and monitor voice channels for emptiness based on PUG properties
// Adjusted function to monitor and clean up based on PUG status and player array
async function monitorPugVoiceChannels(docId, guild, client, interaction) {
	const docs = await pugModel.find({ "onGoingPugs.pugStatus": "active" });

	for (const doc of docs) {
		for (const pug of doc.onGoingPugs) {
			// Proceed only if PUG status is active and players array is empty
			if (pug.pugStatus === "active" && pug.players.length === 0) {
				// Initialize map to track empty state and time for each voice channel
				const emptySinceMap = new Map(
					pug.teamVoiceChannelIds.map((id) => [id, null])
				);

				let allEmpty = true;

				for (const channelId of pug.teamVoiceChannelIds) {
					try {
						const channel = await client.channels.fetch(channelId);
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
					} catch (error) {
						if (error.code === 10003) {
							// "Unknown Channel"
							console.log(
								`Channel ${channelId} has been deleted, removing from monitoring.`
							);
							emptySinceMap.delete(channelId); // Remove from map since channel doesn't exist
						} else {
							console.error(`Failed to fetch channel ${channelId}:`, error);
						}
					}
				}

				// If all channels have been empty for at least 5 minutes, proceed with cleanup
				if (allEmpty || emptySinceMap.size === 0) {
					console.log(
						`All channels for PUG ${pug.matchCounter} are empty or deleted, and no players are present. Initiating cleanup.`
					);
					// Call your cleanup function here
					await clearPlayersAndPotentiallyDeletePug(
						doc._id,
						guild,
						pug.matchCounter,
						interaction
					);
				}
			}
		}
	}
}

// Adjusted function for cleanup based on matchCounter
async function clearPlayersAndPotentiallyDeletePug(
	docId,
	guild,
	matchCounter,
	interaction
) {
	// Ensure the document exists
	const docExists = await pugModel.exists({ _id: docId });
	if (!docExists) {
		console.log("Document not found in clearPlayersAndPotentiallyDeletePug.");
		return;
	}

	// Prepare the path to the players array and pugStatus for the specific PUG
	const playersPath = `onGoingPugs.$[elem].players`;
	const pugStatusPath = `onGoingPugs.$[elem].pugStatus`;

	// Prepare the update object to clear the players array and set pugStatus to "cleanup-pending"
	const update = {
		$set: {
			[playersPath]: [], // Clear the players array
			[pugStatusPath]: "cleanup-pending", // Update pugStatus
		},
	};

	// Define the filter for arrayFilters to identify the correct element in the onGoingPugs array
	const arrayFilters = [
		{ "elem.matchCounter": matchCounter }, // Filter to match the specific PUG by matchCounter
	];

	// Update the document using pugModel.updateOne with arrayFilters
	await pugModel.updateOne({ _id: docId }, update, { arrayFilters });

	console.log(
		`Cleared Players array and set pugStatus to cleanup-pending for PUG #${matchCounter}.`
	);

	// Call deleteEmptyPug to potentially delete the PUG
	// This call assumes deleteEmptyPug can handle cases where the PUG shouldn't be deleted yet.
	await deleteEmptyPug(docId, guild, interaction);
}

module.exports = {
	updatePugQueueEmbed,
	clearAllPlayersForSpecificPug,
	initiateReadyCheck,
	processReadyCheck,
	startMatch,
	deleteEmptyPug,
	monitorPugVoiceChannels,
	clearPlayersAndPotentiallyDeletePug,
};
