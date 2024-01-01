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
	if (queuedPlayers.length >= totalNumOfPlayersPerPUG) {
		// Increment match counter
		let newReadyCheckCounter = readyCheckCounter + 1;
		doc.readyCheckCounter = newReadyCheckCounter;
		// also update the matchFoundKey
		let newMatchFoundKey = matchFoundKey + 1;
		doc.matchFoundKey = newMatchFoundKey;
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
			const embed = pugQueEmbed();
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
			const embed = matchFoundEmbed();
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

			// store the matchFoundEmbedChannelId and matchFoundEmbedMessageId into the database
			doc.matchFoundEmbedChannels.push({
				matchFoundEmbedChannelId,
				matchFoundEmbedMessageId,
			});
			await doc.save();
			console.log(`matchFoundEmbedChannels: ${doc.matchFoundEmbedChannels}`);
			console.log(
				`matchFoundEmbedChannels length: ${doc.matchFoundEmbedChannels.length}`
			);
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

	if (
		acceptedMatchFoundPlayers[doc.readyCheckCounter - 1] &&
		acceptedMatchFoundPlayers[doc.readyCheckCounter - 1].players.length ===
			totalNumOfPlayersPerPUG
	) {
		console.log(
			`Condition met...\n`.blue.inverse +
				`acceptedMatchFoundPlayers length is equal to the totalNumOfPlayersPerPUG\n`
					.blue
		);
		console.log(
			`acceptedMatchFoundPlayers players length: ${acceptedMatchFoundPlayers[matchFoundKey].players.length}`
		);
		// console log the matchFoundKey now
		console.log(`matchFoundKey: ${matchFoundKey}`);
		// Create the match room category and channels
		const guild = interaction.guild;
		const embed = matchRoomEmbed();
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

		// Accessing the players array inside matchFoundPlayers using dot notation
		const players = matchFoundPlayers[matchFoundKey].players;
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

			// Create voice channels for each team
			for (let i = 1; i <= numOfTeamsPerPUG; i++) {
				await guild.channels.create({
					name: `Team ${i}`,
					type: ChannelType.GuildVoice,
					parent: matchCategory.id,
				});
			}

			// Create the match room text channel
			await guild.channels.create({
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

			await matchRoomInterfaceChannel.send({
				embeds: [embed],
				components: components,
			});

			console.log(
				`Match channels created for ${baseCategoryName} `.blue +
					`PUG#${newMatchCounter}`.blue.inverse
			);
		} catch (error) {
			console.error("Error creating match category and channels:", error);
		}
	}
	const objectToRemove = acceptedMatchFoundPlayers[doc.readyCheckCounter];
	const indexToRemove = acceptedMatchFoundPlayers.indexOf(objectToRemove);
	if (indexToRemove !== -1) {
		acceptedMatchFoundPlayers.splice(indexToRemove, 1);
		await doc.save();
		console.log(`Object removed from acceptedMatchFoundPlayers array.`);
	} else {
		console.log(`Object not found in acceptedMatchFoundPlayers array.`);
	}
};
