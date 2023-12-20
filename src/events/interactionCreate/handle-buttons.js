// src/events/interactionCreate/handle-buttons.js
const pugModel = require("../../models/pug-model");
const { ChannelType } = require("discord.js");

module.exports = async (client, interaction) => {
	if (!interaction.isButton()) return;

	await interaction.deferReply({ ephemeral: true });

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

	let responseMessage = "";

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

	if (interaction.customId === "joinQueue") {
		if (
			!queuedPlayers.includes(interaction.user.tag) &&
			!matchFoundPlayers.includes(interaction.user.tag)
		) {
			queuedPlayers.push(interaction.user.tag);
			// console log each player that is added to the queue
			console.log(`${interaction.user.tag} joined the queue...`.magenta);

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

			await pugModel.updateOne(
				{ _id: doc._id },
				{ queuedPlayers: queuedPlayers }
			);
			responseMessage = "You have joined the queue for " + categoryName + "!";
			shouldUpdatePugQueEmbed = true;
		} else {
			responseMessage =
				"You are already in the queue for " + categoryName + ".";
		}
	} else if (interaction.customId === "leaveQueue") {
		if (queuedPlayers.includes(interaction.user.tag)) {
			queuedPlayers = queuedPlayers.filter(
				(tag) => tag !== interaction.user.tag
			);
			// Removing dummy players for testing
			queuedPlayers = queuedPlayers.filter(
				(tag) => !dummyPlayers.includes(tag)
			);

			await pugModel.updateOne(
				{ _id: doc._id },
				{ queuedPlayers: queuedPlayers }
			);
			responseMessage = "You have left the queue for " + categoryName + "!";
			shouldUpdatePugQueEmbed = true;
		} else {
			responseMessage = "You are not in the queue for " + categoryName + ".";
		}
	} else if (interaction.customId === "acceptMatchButton") {
		if (!acceptedMatchFoundPlayers.includes(interaction.user.tag)) {
			acceptedMatchFoundPlayers.push(interaction.user.tag);
			console.log(`${interaction.user.tag} accepted the match.`.green);
			// Adding dummy players from matchFoundPlayers to acceptedMatchFoundPlayers if they are not already in acceptedMatchFoundPlayers
			for (const player of matchFoundPlayers) {
				if (!acceptedMatchFoundPlayers.includes(player)) {
					acceptedMatchFoundPlayers.push(player);
					console.log(
						`acceptedMatchFoundPlayers: ${acceptedMatchFoundPlayers}`.green
							.inverse
					);
				}
			}
			await pugModel.updateOne(
				{ _id: doc._id },
				{ acceptedMatchFoundPlayers: acceptedMatchFoundPlayers }
			);
			responseMessage = "You've accepted the match for " + categoryName + "!";
			shouldUpdateMatchFoundEmbed = true;
		} else {
			responseMessage =
				"You've already accepted the match for " + categoryName + "!";
		}
	} else if (interaction.customId === "declineMatchButton") {
		if (matchFoundPlayers.includes(interaction.user.tag)) {
			//before we revert all lets delete the category and channels called ready
			// *****************************************
			// Section : deletes ready check channel when everyone accepts the match
			// *****************************************
			const guild = interaction.guild;
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

			// Remove the player from the matchFoundPlayers array
			matchFoundPlayers = matchFoundPlayers.filter(
				(player) => player !== interaction.user.tag
			);
			acceptedMatchFoundPlayers = acceptedMatchFoundPlayers.filter(
				(player) => player !== interaction.user.tag
			);

			// Revert all non-declining, match-found players back to the queuedPlayers queue
			queuedPlayers.push(
				...matchFoundPlayers.filter(
					(player) => !acceptedMatchFoundPlayers.includes(player)
				)
			);
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
			responseMessage = "You've declined the match for " + categoryName + "!";
			shouldUpdateMatchFoundEmbed = true;
		} else {
			responseMessage =
				"You are not in the match found players for " + categoryName + ".";
		}
	}

	// Update the embed if the matchFoundQueue has changed
	if (shouldUpdateMatchFoundEmbed === true) {
		try {
			const {
				matchFoundEmbed,
				components,
			} = require("../../assets/embeds/match-found-embed");
			// Fetch the document from the database
			let doc = await pugModel.findOne({
				serverId: interaction.guild.id,
				categoryName: categoryName,
			});

			if (!doc) {
				console.log("No document found for updating embed!");
				return;
			}

			// Use the data from the database to update the Discord message
			const message = await interaction.message.fetch();
			const embed = matchFoundEmbed();

			// Update the description of the embed
			// switch from using description and start adding feilds to the embed

			embed.setFields([
				{
					name: "Waiting on Response From:",
					value: matchFoundPlayers.join("\n"),
				},
			]);

			// Edit the original message with the updated embed
			await message.edit({ embeds: [embed], components: components });
		} catch (err) {
			console.log("Something wrong when updating data!", err);
		}
		console.log(
			"matchFoundEmbed updated!\n This a test to see if queuePlayers and totalNumOfPlayersPerPUG exists: "
				.yellow.inverse,
			queuedPlayers,
			totalNumOfPlayersPerPUG
		);
	} else if (shouldUpdatePugQueEmbed === true) {
		try {
			const {
				pugQueEmbed,
				components,
			} = require("../../assets/embeds/pug-que-embed");
			// Fetch the document from the database
			let doc = await pugModel.findOne({
				serverId: interaction.guild.id,
				categoryName: categoryName,
			});

			console.log("once upon a time there was a doc: ", doc);

			if (!doc) {
				console.log("No document found for updating embed!");
				return;
			}

			// Use the data from the database to update the Discord message
			const message = await interaction.message.fetch();
			const embed = pugQueEmbed();

			// Update the description of the embed
			// embed.setDescription(`Queued Players: \n${doc.queuedPlayers.join("\n")}`);

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
					value: doc.queuedPlayers.join("\n"),
				},
			]);

			// Edit the original message with the updated embed
			await message.edit({ embeds: [embed], components: components });
		} catch (err) {
			console.log("Something wrong when updating data!", err);
		}
	}

	// Send a reply to the user
	await interaction.editReply({ content: responseMessage });
};
