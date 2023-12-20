// src/events/interactionCreate/handle-queued-players.js
const { ChannelType } = require("discord.js");
const mongoose = require("mongoose");
const {
	matchFoundEmbed,
	matchFoundComponents,
} = require("../../assets/embeds/match-found-embed");

const {
	matchRoomEmbed,
	matchRoomComponents,
} = require("../../assets/embeds/match-room-embed");

const pugModel = require("../../models/pug-model");

module.exports = async (client, interaction) => {
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
	let onGoingPugs = doc.onGoingPugs;

	// totalNumOfPlayersPerPUG = user input
	if (queuedPlayers.length >= totalNumOfPlayersPerPUG) {
		// Step 1: Grab the players from the doc.queuedPlayers array and add them to the matchFoundPlayers array
		console.log(
			`Transfering Data...\n`.magenta.inverse +
				`Moving doc.queuedPlayers to matchFoundPlayers...`.magenta
		);
		// transfer players from doc.queuedPlayers to matchFoundPlayers and store it in the database
		console.log(
			`Checking values before transfer...\n${doc.queuedPlayers}`.black
		);
		let matchFoundPlayers = doc.queuedPlayers.splice(
			0,
			doc.totalNumOfPlayersPerPUG
		);
		for (let i = 0; i < matchFoundPlayers.length; i++) {
			console.log(`Moved Player: ${matchFoundPlayers[i]}`.magenta);
		}
		console.log(
			`Data Stored!...`.green.inverse +
				`\nmatchFoundPlayers : ${matchFoundPlayers}`.green
		);

		// use CRUD to now update the matchFoundPlayers array in the database
		await pugModel.updateOne(
			{ categoryName: categoryName },
			{ matchFoundPlayers: matchFoundPlayers }
		);

		// Step 2: Save the modified doc to the database
		await doc.save();

		// Step 3: update the embed on pug-que-interface
		try {
			const {
				pugQueEmbed,
				components,
			} = require("../../assets/embeds/pug-que-embed");
			// Fetch the message from the channel
			const message = await interaction.channel.messages.fetch(
				interaction.message.id
			);
			// Update the embed
			const embed = pugQueEmbed();

			console.log("This is the embed: ", embed);
			console.log("hi from handle-queued-players.js");
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
				{ name: "Who's Queued:", value: doc.queuedPlayers.join("\n") },
			]);

			await message.edit({
				embeds: [embed],
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
				name: `${baseCategoryName} Ready Check!`,
				type: ChannelType.GuildCategory,
			});
			// send the match found interface message
			const matchFoundInterfaceChannel = await guild.channels.create({
				name: "match-found-interface",
				type: ChannelType.GuildText,
				parent: matchFoundCategory.id,
			});
			await matchFoundInterfaceChannel.send({
				embeds: [embed],
				components: components,
			});
			console.log(
				`Match Found Channels created for ${categoryName} Ready Check`.blue
					.inverse
			);
		} catch (error) {
			console.error("Error creating match found category and channels:", error);
		}
	}

	// figure out a way to handle if everyone doesn't accept the match and then remove the matchFoundPlayers from the database and put them back into the queuedPlayers array if they weren't the ones who declined the match like if matchFoundPlayers length is equal to the acceptedMatchFoundPlayers length then we should create the rest of the voice and text channels

	if (acceptedMatchFoundPlayers.length >= totalNumOfPlayersPerPUG) {
		// condition met to create the match room category and channels
		console.log(
			`Condition met...\n`.blue.inverse +
				`acceptedMatchFoundPlayers length is equal to the totalNumOfPlayersPerPUG\n`
					.blue
		);

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

		// store all of the acceptedMatchFoundPlayers into the onGoingPugs array as an object
		onGoingPugs = [
			{
				matchCounter: newMatchCounter,
				players: acceptedMatchFoundPlayers,
			},
		];

		// use CRUD to update the onGoingPugs array in the database
		await pugModel.updateOne(
			{ categoryName: baseCategoryName },
			{ onGoingPugs: onGoingPugs }
		);

		// delete the users from the matchFoundPlayers array and acceptMatchFoundPlayers array
		// initialize the array back to empty
		matchFoundPlayers = [];
		acceptedMatchFoundPlayers = [];

		// use CRUD to now update the matchFoundPlayers array in the database
		await pugModel.updateOne(
			{ categoryName: baseCategoryName },
			{ $set: { matchFoundPlayers: matchFoundPlayers } }
		);
		// use CRUD to now update the acceptedMatchFoundPlayers array in the database
		await pugModel.updateOne(
			{ categoryName: baseCategoryName },
			{ $set: { acceptedMatchFoundPlayers: acceptedMatchFoundPlayers } }
		);

		// Fetch all channels of the guild
		guild.channels
			.fetch()
			.then((channels) => {
				// Find the category to delete based on the provided name
				const categoryToDelete = channels.find(
					(channel) =>
						channel.name === `${baseCategoryName} Ready Check!` &&
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
					// If the category does not exist, reply to the interaction accordingly
					interaction.reply(`Category "${categoryName}" does not exist.`);
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
			ca;
		} catch (error) {
			console.error("Error creating match category and channels:", error);
		}
	}
};
