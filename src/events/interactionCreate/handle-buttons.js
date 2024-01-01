// src/events/interactionCreate/handle-buttons.js
const pugModel = require("../../models/pug-model");
const { ChannelType } = require("discord.js");
const mongoose = require("mongoose");

module.exports = async (client, interaction) => {
	if (!interaction.isButton()) return;

	// await interaction.deferReply({ ephemeral: true });

	const channel = interaction.channel;
	const category = channel.parent;
	const categoryName = category ? category.name : "Unknown Category";
	const baseCategoryName = categoryName.split(" ")[0];

	// Fetch the document from the database
	let doc = await pugModel.findOne({
		serverId: interaction.guild.id,
		categoryName: baseCategoryName,
	});

	if (!doc) {
		console.log(
			"No pugModel found for the given categoryName and serverId! in handle-buttons.js"
		);
		await interaction.editReply({
			content: "No match information found. In handle-buttons.js",
		});
		return;
	}

	let queuedPlayers = doc.queuedPlayers;
	let matchFoundPlayers = doc.matchFoundPlayers;
	let acceptedMatchFoundPlayers = doc.acceptedMatchFoundPlayers;
	let totalNumOfPlayersPerPUG = doc.totalNumOfPlayersPerPUG;
	let shouldUpdateMatchFoundEmbed = false;
	let shouldUpdatePugQueEmbed = false;

	// Dummy players array for testing
	const dummyPlayers = [
		"player1",
		"player2",
		"player3",
		"player4",
		"player5",
		"player6",
		"player7",
		"player8",
		"player9",
		"player10",
	];
	// **********************************************************************************
	// Section : Join Queue
	// **********************************************************************************
	// **********************************************************************************
	// Section : Join Queue
	// **********************************************************************************
	// **********************************************************************************
	// Section : Join Queue
	// **********************************************************************************
	// **********************************************************************************
	// Section : Join Queue
	// **********************************************************************************
	// **********************************************************************************
	// Section : Join Queue
	// **********************************************************************************

	if (interaction.customId === "joinQueue") {
		if (
			!queuedPlayers.includes(interaction.user.tag) &&
			!matchFoundPlayers.includes(interaction.user.tag) &&
			!doc.matchFoundPlayers.some((player) =>
				player.players.includes(interaction.user.tag)
			)
		) {
			console.log(
				"players.players.includes logic:",
				doc.matchFoundPlayers.some((player) =>
					player.players.includes(interaction.user.tag)
				)
			);
			queuedPlayers.push(interaction.user.tag);
			// console log each player that is added to the queue
			console.log(`${interaction.user.tag} joined the queue...`.magenta);

			// *****************************************
			// Section : start of DUMMY PLAYERS
			// *****************************************
			console.log(`Adding dummy players...`.magenta.inverse);
			// Adding dummy players for testing
			for (const player of dummyPlayers) {
				if (!queuedPlayers.includes(player)) {
					queuedPlayers.push(player);
					// console log each player that is added to the queue
					console.log(
						`Dummy Player added... ${player} joined the queue`.magenta
					);
				}
			}
			// *****************************************
			// Section : end of DUMMY PLAYERS
			// *****************************************

			await pugModel.updateOne(
				{ _id: doc._id },
				{ queuedPlayers: queuedPlayers }
			);
			await interaction.reply(`You have joined the queue for ${categoryName}!`);
			shouldUpdatePugQueEmbed = true;
		} else {
			await interaction.reply(
				`You are already in the queue for ${categoryName}.`
			);
		}
		return;
		// **********************************************************************************
		// Section : Leave Queue
		// **********************************************************************************
		// **********************************************************************************
		// Section : Leave Queue
		// **********************************************************************************
		// **********************************************************************************
		// Section : Leave Queue
		// **********************************************************************************
		// **********************************************************************************
		// Section : Leave Queue
		// **********************************************************************************
		// **********************************************************************************
		// Section : Leave Queue
		// **********************************************************************************
	} else if (interaction.customId === "leaveQueue") {
		if (queuedPlayers.includes(interaction.user.tag)) {
			queuedPlayers = queuedPlayers.filter(
				(tag) => tag !== interaction.user.tag
			);

			// Check and modify the state of acceptedMatchFoundPlayers
			let index = acceptedMatchFoundPlayers.findIndex(
				(p) => p.id === interaction.user.id
			);
			if (index !== -1) {
				acceptedMatchFoundPlayers.splice(index, 1);
				// Update any necessary states/counters
			}
			// *****************************************
			// Section : start of DUMMY PLAYERS
			// *****************************************
			// Removing dummy players for testing
			queuedPlayers = queuedPlayers.filter(
				(tag) => !dummyPlayers.includes(tag)
			);
			// *****************************************
			// Section : end of DUMMY PLAYERS
			// *****************************************
			await pugModel.updateOne(
				{ _id: doc._id },
				{ queuedPlayers: queuedPlayers }
			);

			await interaction.reply(`You have left the queue for ${categoryName}!`);
			shouldUpdatePugQueEmbed = true;
		} else {
			await interaction.reply(`You are not in the queue for ${categoryName}.`);
		}
		return;
		// **********************************************************************************
		// Section : Accept Match Button
		// **********************************************************************************
		// **********************************************************************************
		// Section : Accept Match Button
		// **********************************************************************************
		// **********************************************************************************
		// Section : Accept Match Button
		// **********************************************************************************
		// **********************************************************************************
		// Section : Accept Match Button
		// **********************************************************************************
		// **********************************************************************************
		// Section : Accept Match Button
		// **********************************************************************************
		// **********************************************************************************
		// Section : Accept Match Button
		// **********************************************************************************
	} else if (interaction.customId === "acceptMatchButton") {
		if (!acceptedMatchFoundPlayers.includes(interaction.user.tag)) {
			// acceptedMatchFoundPlayers.push(interaction.user.tag);
			console.log(`${interaction.user.tag} accepted the match.`.green);

			// *****************************************
			// Section : start of DUMMY PLAYERS
			// *****************************************
			// this code is also adding myself..
			// are you saying i am a dummy player? :(
			for (const player of matchFoundPlayers) {
				if (!acceptedMatchFoundPlayers.includes(player)) {
					acceptedMatchFoundPlayers.push(player);
					console.log(
						`acceptedMatchFoundPlayers: ${acceptedMatchFoundPlayers}`.green
							.inverse
					);
				}
			}
			// *****************************************
			// Section : end of DUMMY PLAYERS
			// *****************************************

			await pugModel.updateOne(
				{ _id: doc._id },
				{ acceptedMatchFoundPlayers: acceptedMatchFoundPlayers }
			);
			await interaction.reply(
				"You've accepted the match for " + categoryName + "!"
			);
			shouldUpdateMatchFoundEmbed = true;
			return;
		} else {
			await interaction.reply(
				"You've already accepted the match for " + categoryName + "!"
			);
		}

		// **********************************************************************************
		// Section : Decline Match Button
		// **********************************************************************************
		// **********************************************************************************
		// Section : Decline Match Button
		// **********************************************************************************
		// **********************************************************************************
		// Section : Decline Match Button
		// **********************************************************************************
		// **********************************************************************************
		// Section : Decline Match Button
		// **********************************************************************************
		// **********************************************************************************
		// Section : Decline Match Button
		// **********************************************************************************
		// **********************************************************************************
		// Section : Decline Match Button
		// **********************************************************************************
	} else if (interaction.customId === "declineMatchButton") {
		const newMatchFoundPlayers = matchFoundPlayers.find(
			(m) => m.readyCheckCounter === doc.readyCheckCounter
		);

		console.log(
			`newMatchFoundPlayers: ${JSON.stringify(newMatchFoundPlayers)}`.green
				.inverse
		);
		// Repeat this for each console.log statement where you want to view the details of newMatchFoundPlayers
		console.log(
			`newMatchFoundPlayers: ${JSON.stringify(newMatchFoundPlayers)}`.green
				.inverse
		);
		// Repeat this for each console.log statement where you want to view the details of newMatchFoundPlayers
		console.log(
			`newMatchFoundPlayers: ${JSON.stringify(newMatchFoundPlayers)}`.green
				.inverse
		);
		// Repeat this for each console.log statement where you want to view the details of newMatchFoundPlayers
		console.log(
			`newMatchFoundPlayers: ${JSON.stringify(newMatchFoundPlayers)}`.green
				.inverse
		);
		// Repeat this for each console.log statement where you want to view the details of newMatchFoundPlayers

		if (
			newMatchFoundPlayers &&
			newMatchFoundPlayers.players.includes(interaction.user.tag)
		) {
			console.log(
				`${interaction.user.tag} declined the match..............`.red
			);

			newMatchFoundPlayers.players = newMatchFoundPlayers.players.filter(
				(player) => player !== interaction.user.tag
			);
			acceptedMatchFoundPlayers = acceptedMatchFoundPlayers.filter(
				(obj) =>
					obj.readyCheckCounter !== doc.readyCheckCounter ||
					!obj.players.includes(interaction.user.tag)
			);
			const nonResponders = newMatchFoundPlayers.players.filter(
				(player) =>
					!acceptedMatchFoundPlayers.some((obj) => obj.players.includes(player))
			);
			queuedPlayers.push(...nonResponders);

			// // Save changes to the database
			// await pugModel.updateOne(
			// 	{ _id: doc._id },
			// 	{
			// 		matchFoundPlayers: matchFoundPlayers,
			// 		acceptedMatchFoundPlayers: acceptedMatchFoundPlayers,
			// 		queuedPlayers: queuedPlayers,
			// 	}
			// );

			// Update the database accordingly
			await pugModel.updateMany(
				{ _id: doc._id },
				{
					$pull: {
						matchFoundPlayers: interaction.user.tag,
						acceptedMatchFoundPlayers: interaction.user.tag,
					},
					$set: { queuedPlayers: queuedPlayers },
				}
			);
			console.log(
				`this is a test to see if readyCheckCounter: ${doc.readyCheckCounter}`
					.yellow.inverse
			);
			await interaction.reply({
				content: `You've declined the match for ${categoryName}!`,
			});
			shouldUpdatePugQueEmbed === true;

			// 	// Get the channel from the interaction
			// 	const channel = interaction.channel;
			// 	// Fetch the category using the parentId of the channel
			// 	const category = channel.guild.channels.cache.get(channel.parentId);
			// 	// Log the category name
			// 	console.log(`The category name is: ${category.name}`);
			// 	// // Fetch all channels of the guild and delete the category
			// 	// Assuming category.name is something like "5v5 Ready Check#2"
			// 	const readyCheckCategoryName = category.name;
			// 	// Find the index of "Ready Check#"
			// 	const index = readyCheckCategoryName.indexOf("Ready Check#");
			// 	// Get the substring after "Ready Check#"
			// 	const substringAfter = readyCheckCategoryName.substring(
			// 		index + "Ready Check#".length
			// 	);
			// 	// Log the result
			// 	console.log(
			// 		`The part of the category name after 'Ready Check#' is: ${substringAfter.trim()}`
			// 	);

			//     const categoryId = /* Retrieve the correct category ID from matchFoundEmbedChannels */;
			//     const categoryToDelete = await interaction.guild.channels.cache.get(categoryId);

			//     if (categoryToDelete) {
			//         const childChannels = categoryToDelete.children;
			//         for (const [channelId, channel] of childChannels) {
			//             await channel.delete();
			//             console.log(`Deleted channel: ${channel.name}`);
			//         }
			//         await categoryToDelete.delete();
			//         console.log(`Deleted category: ${categoryToDelete.name}`);
			//     } else {
			//         console.log(`Category with ID ${categoryId} does not exist.`);
			//     }
			// }

			// Get the channel from the interaction
			const channel = interaction.channel;
			// Fetch the category using the parentId of the channel
			const category = channel.guild.channels.cache.get(channel.parentId);
			// Log the category name
			console.log(`The category name is: ${category.name}`);
			// Fetch all channels of the guild and delete the category
			// Assuming category.name is something like "5v5 Ready Check#2"
			const readyCheckCategoryName = category.name;
			// Find the index of "Ready Check#"
			const index = readyCheckCategoryName.indexOf("Ready Check#");
			// Get the substring after "Ready Check#"
			const substringAfter = readyCheckCategoryName.substring(
				index + "Ready Check#".length
			);
			// Log the result
			console.log(
				`The part of the category name after 'Ready Check#' is: ${substringAfter.trim()}`
			);

			// Convert the string to an integer
			const readyCheckNumber = parseInt(substringAfter);

			//Fetch all channels of the guild and delete the category
			const channels = await interaction.guild.channels.fetch();
			const categoryToDelete = channels.find(
				(channel) =>
					channel.name ===
						`${baseCategoryName} Ready Check#${readyCheckNumber}` &&
					channel.type === ChannelType.GuildCategory
			);

			if (categoryToDelete) {
				const childChannels = channels.filter(
					(channel) => channel.parentId === categoryToDelete.id
				);
				for (const channel of childChannels.values()) {
					await channel.delete();
				}
				await categoryToDelete.delete();
				console.log(
					`Category "${categoryName}" and its channels have been deleted.`
				);
			} else {
				console.log(`Category "${categoryName}" does not exist.`);
			}
		}
		return;
	}

	// **********************************************************************************
	// Section : Updating the embeds
	// **********************************************************************************
	// **********************************************************************************
	// Section : Updating the embeds
	// **********************************************************************************
	// **********************************************************************************
	// Section : Updating the embeds
	// **********************************************************************************
	// **********************************************************************************
	// Section : Updating the embeds
	// **********************************************************************************
	// **********************************************************************************
	// Section : Updating the embeds
	// **********************************************************************************
	// **********************************************************************************
	// Section : Updating the embeds
	// **********************************************************************************

	// Update the embed if the matchFoundQueue has changed
	if (shouldUpdateMatchFoundEmbed === true) {
		try {
			const {
				matchFoundEmbed,
				components,
			} = require("../../assets/embeds/match-found-embed");

			// Fetch the updated document from the database
			let updatedDoc = await pugModel.findOne({
				categoryName: baseCategoryName,
			});
			// Fetch the document from the database
			if (!updatedDoc) {
				console.log("No document found for updating embed!");
				return;
			}

			// Use the data from the database to update the Discord message
			const channel = await client.channels.fetch(
				updatedDoc.matchFoundEmbedChannelId
			);

			// Check if the message exists before trying to edit it
			if (!channel) {
				console.log("Message not found!");
				return;
			}
			const message = await channel.message.fetch(
				updatedDoc.matchFoundEmbedMessageId
			);
			// Check if the message exists before trying to edit it
			if (!message) {
				console.log("Message not found!");
				return;
			}

			const embed = matchFoundEmbed();

			// Update the description of the embed
			embed.setFields([
				{
					name: "Waiting on Response From:",
					value: matchFoundPlayers.join("\n,") || "No players accepted yet.",
				},
			]);
			await message.edit({ embeds: [embed], components: components });
			// Edit the original message with the updated embed
		} catch (err) {
			console.log("Something wrong when updating data!", err);
		}
		return;
	} else if (shouldUpdatePugQueEmbed === true) {
		try {
			// Fetch the updated document from the database
			let updatedDoc = await pugModel.findOne({
				categoryName: baseCategoryName,
			});

			// Fetch the document from the database
			if (!updatedDoc) {
				console.log("No document found for updating embed!");
				return;
			}

			// Use the updated data to create a new embed
			const {
				pugQueEmbed,
				components,
			} = require("../../assets/embeds/pug-que-embed");

			const channel = await client.channels.fetch(
				updatedDoc.pugQueEmbedChannelId
			);
			const message = await channel.messages.fetch(
				updatedDoc.pugQueEmbedMessageId
			);
			const embed = pugQueEmbed();

			// Check if the message exists before trying to edit it
			if (!message) {
				console.log("Message not found!");
				return;
			}
			embed.setFields([
				{
					name: "Players Queued",
					value: updatedDoc.queuedPlayers.length.toString(),
					inline: true,
				},
				{
					name: "Players Needed:",
					value: updatedDoc.totalNumOfPlayersPerPUG.toString(),
					inline: true,
				},
				{
					name: "Who's Queued:",
					value: updatedDoc.queuedPlayers.join("\nWaiting for players..."),
				},
			]);

			// Edit the original message with the updated embed
			await message.edit({ embeds: [embed], components: components });
		} catch (err) {
			console.log("Something wrong when updating data!", err);
		}
	}
	return;
};
