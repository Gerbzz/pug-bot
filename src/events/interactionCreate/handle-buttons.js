// // src/events/interactionCreate/handle-buttons.js
// const {
// 	pugQueEmbed,
// 	components: pugQueComponents,
// } = require("../../assets/embeds/pug-que-embed");

// const {
// 	matchFoundEmbed,
// 	components: matchFoundComponents,
// } = require("../../assets/embeds/match-found-embed");

// const pugModel = require("../../models/pug-model");

// module.exports = async (client, interaction) => {
// 	if (!interaction.isButton()) return;

// 	await interaction.deferReply({ ephemeral: true });

// 	const channel = interaction.channel;
// 	const category = channel.parent;
// 	const categoryName = category ? category.name : "Unknown Category";
// 	const baseCategoryName = categoryName.split(" ")[0];

// 	let doc = await pugModel.findOne({
// 		serverId: interaction.guild.id,
// 		categoryName: baseCategoryName,
// 	});

// 	if (!doc) {
// 		console.log("No pugModel found for the given categoryName and serverId!");
// 		return;
// 	}

// 	let queuedPlayers = doc.queuedPlayers;
// 	let totalNumOfPlayersPerPUG = doc.totalNumOfPlayersPerPUG;
// 	let matchFoundPlayers = doc.matchFoundPlayers;
// 	let acceptedMatchFoundPlayers = doc.acceptedMatchFoundPlayers;

// 	let responseMessage = "";
// 	let shouldUpdatePugQueEmbed = false;
// 	let shouldUpdateMatchFoundEmbed = false;

// 	if (interaction.customId === "joinQueue") {
// 		if (!queuedPlayers.includes(interaction.user.tag)) {
// 			queuedPlayers.push(interaction.user.tag);

// 			const userTag = interaction.user.tag;

// 			console.log(`${userTag} has joined the queue for ${categoryName}`.green);
// 			await pugModel.updateOne(
// 				{ categoryName: categoryName, queuedPlayers: { $ne: userTag } },
// 				{ $addToSet: { queuedPlayers: userTag } }
// 			);

// 			const players = [
// 				"player1",
// 				"player2",
// 				"player3",
// 				"player4",
// 				"player5",
// 				"player6",
// 				"player7",
// 				"player8",
// 				"player9",
// 			];

// 			try {
// 				for (let player of players) {
// 					await pugModel.updateOne(
// 						{ categoryName: categoryName, queuedPlayers: { $ne: player } },
// 						{ $addToSet: { queuedPlayers: player } }
// 					);
// 					console.log(
// 						`${player} has been added to the queue for ${categoryName}`.green
// 					);
// 				}
// 				console.log(
// 					"Dummy Players added successfully to the database".green.inverse
// 				);
// 			} catch (err) {
// 				console.log(
// 					"Something went wrong when adding dummy players to the database",
// 					err
// 				);
// 			}

// 			responseMessage = "You've joined the queue for " + categoryName + "!";
// 			shouldUpdatePugQueEmbed = true;

// 			// Log the current queue size for debugging
// 			console.log(
// 				`Queue size for ${categoryName} in server ${interaction.guild.id}: ${queuedPlayers.length} / ${totalNumOfPlayersPerPUG}`
// 					.magenta
// 			);
// 		} else {
// 			responseMessage =
// 				"You are already in the queue for " + categoryName + ".";
// 		}
// 	} else if (interaction.customId === "leaveQueue") {
// 		if (queuedPlayers.includes(interaction.user.tag)) {
// 			queuedPlayers = queuedPlayers.filter(
// 				(tag) => tag !== interaction.user.tag
// 			);

// 			const userTag = interaction.user.tag;
// 			queuedPlayers = queuedPlayers.filter((tag) => tag !== userTag);
// 			console.log(`${userTag} has left the pug queue for ${categoryName}`.red);
// 			console.log(`queuedPlayers: ${queuedPlayers}`.red.inverse);
// 			await pugModel.updateOne(
// 				{ categoryName: categoryName },
// 				{ $pull: { queuedPlayers: userTag } }
// 			);
// 			const players = [
// 				"player1",
// 				"player2",
// 				"player3",
// 				"player4",
// 				"player5",
// 				"player6",
// 				"player7",
// 				"player8",
// 				"player9",
// 			];

// 			try {
// 				for (let player of players) {
// 					await pugModel.updateOne(
// 						{ categoryName: categoryName, queuedPlayers: { $ne: player } },
// 						{ $pull: { queuedPlayers: player } }
// 					);
// 					console.log(`${player} has been removed from the queue`.red);
// 				}
// 				console.log("Players removed successfully".red.inverse);
// 			} catch (err) {
// 				console.log("Something went wrong when removing players", err);
// 			}

// 			responseMessage = "You've left the queue for " + categoryName + "!";
// 			shouldUpdatePugQueEmbed = true;

// 			// Log the current queue size for debugging
// 			console.log(`Queue size for ${categoryName}: ${queuedPlayers.length}`);
// 		} else {
// 			responseMessage = "You are not in the queue for " + categoryName + ".";
// 		}
// 	} else if (interaction.customId === "acceptMatchButton") {
// 		if (!acceptedMatchFoundPlayers.includes(interaction.user.tag)) {
// 			acceptedMatchFoundPlayers.push(interaction.user.tag);
// 			console.log(`${interaction.user.tag} accepted the match.`);
// 			console.log(
// 				`acceptedMatchFoundPlayers: ${acceptedMatchFoundPlayers}`.green.inverse
// 			);
// 			responseMessage = "You've accepted the match for " + categoryName + "!";

// 			const userTag = interaction.user.tag;

// 			console.log(
// 				`${userTag} has accepted the match for ${categoryName}`.green
// 			);

// 			console.log(`baseCategoryName: ${baseCategoryName}`.magenta);

// 			await pugModel.updateOne(
// 				{
// 					categoryName: baseCategoryName,
// 					matchFoundPlayers: { $ne: userTag },
// 				},
// 				{ $addToSet: { acceptedMatchFoundPlayers: userTag } }
// 			);
// 			// Log the current acceptedMatchFoundPlayers size for debugging
// 			console.log(
// 				`acceptedMatchFoundPlayers size for ${baseCategoryName} in server ${interaction.guild.id}: ${acceptedMatchFoundPlayers.length} / ${totalNumOfPlayersPerPUG}`
// 					.magenta
// 			);

// 			responseMessage = "You've accepted the match for " + categoryName + "!";
// 			shouldUpdateMatchFoundEmbed = true;
// 		} else {
// 			responseMessage =
// 				"You've already accepted the match for " + categoryName + "!";
// 		}
// 	} else if (interaction.customId === "declineMatchButton") {
// 		if (matchFoundPlayers.includes(interaction.user.tag)) {
// 			matchFoundPlayers = matchFoundPlayers.filter(
// 				(tag) => tag !== interaction.user.tag
// 			);
// 			console.log(`${interaction.user.tag} declined the match.`);
// 			responseMessage = "You've declined the match for " + categoryName + "!";
// 			shouldUpdateMatchFoundEmbed = true;
// 		}
// 		const userTag = interaction.user.tag;
// 		matchFoundPlayers = matchFoundPlayers.filter((tag) => tag !== userTag);
// 		console.log(`${userTag} has declined the match for :  ${categoryName}`.red);
// 		console.log(`matchFoundPlayers: ${matchFoundPlayers}`.red.inverse);
// 		await pugModel.updateOne(
// 			{ categoryName: categoryName },
// 			{ $pull: { matchFoundPlayers: userTag } }
// 		);

// 		responseMessage = "You've declined the match for " + categoryName + "!";
// 		shouldUpdateMatchFoundEmbed = true;

// 		// Log the current matchFoundPlayers size for debugging
// 		console.log(
// 			`matchFoundPlayers size for ${categoryName}: ${matchFoundPlayers.length}`
// 		);
// 	} else {
// 		responseMessage =
// 			"You already declined the match for " + categoryName + ".";
// 	}

// 	// Update the embed if the queue has changed
// 	if (shouldUpdatePugQueEmbed) {
// 		try {
// 			// Fetch the document from the database
// 			let doc = await pugModel.findOne({
// 				serverId: interaction.guild.id,
// 				categoryName: categoryName,
// 			});

// 			if (!doc) {
// 				console.log("No document found!");
// 				return;
// 			}

// 			// Use the data from the database to update the Discord message
// 			const message = await interaction.message.fetch();
// 			const embed = pugQueEmbed();
// 			const components = pugQueComponents();

// 			// Update the pug_count on the embed
// 			embed.setDescription(
// 				`Queue: ${doc.queuedPlayers.length} / ${doc.totalNumOfPlayersPerPUG}`
// 			);

// 			// Edit the original message with the updated embed
// 			await message.edit({ embeds: [embed], components: components });
// 		} catch (err) {
// 			console.log("Something wrong when updating data!", err);
// 		}
// 	}

// 	// Update the embed if the matchFoundQueue has changed
// 	if (shouldUpdateMatchFoundEmbed) {
// 		try {
// 			// Fetch the document from the database
// 			let doc = await pugModel.findOne({
// 				serverId: interaction.guild.id,
// 				categoryName: categoryName,
// 			});

// 			if (!doc) {
// 				console.log("No document found!");
// 				return;
// 			}

// 			// Use the data from the database to update the Discord message
// 			const message = await interaction.message.fetch();
// 			const embed = matchFoundEmbed();
// 			const components = matchFoundComponents();
// 			// Update the pug_count on the embed
// 			embed.setDescription(
// 				`Queue: ${doc.queuedPlayers.length} / ${doc.totalNumOfPlayersPerPUG}`
// 			);

// 			// Edit the original message with the updated embed
// 			await message.edit({ embeds: [embed], components: components });
// 		} catch (err) {
// 			console.log("Something wrong when updating data!", err);
// 		}
// 	}

// 	// Send a reply to the user
// 	await interaction.editReply({ content: responseMessage });
// };

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// src/events/interactionCreate/handle-buttons.js
// src/events/interactionCreate/handle-buttons.js
const {
	pugQueEmbed,
	components: pugQueComponents,
} = require("../../assets/embeds/pug-que-embed");

const {
	matchFoundEmbed,
	components: matchFoundComponents,
} = require("../../assets/embeds/match-found-embed");

const pugModel = require("../../models/pug-model");

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
		if (!queuedPlayers.includes(interaction.user.tag)) {
			queuedPlayers.push(interaction.user.tag);
			// Adding dummy players for testing
			for (const player of dummyPlayers) {
				if (!queuedPlayers.includes(player)) {
					queuedPlayers.push(player);
					console.log(`queuedPlayers: ${queuedPlayers}`.green.inverse);
				}
			}

			await pugModel.updateOne(
				{ _id: doc._id },
				{ queuedPlayers: queuedPlayers }
			);
			responseMessage =
				"You and dummy players have joined the queue for " + categoryName + "!";
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
			responseMessage =
				"You and dummy players have left the queue for " + categoryName + "!";
		} else {
			responseMessage = "You are not in the queue for " + categoryName + ".";
		}
	} else if (interaction.customId === "acceptMatchButton") {
		if (!acceptedMatchFoundPlayers.includes(interaction.user.tag)) {
			acceptedMatchFoundPlayers.push(interaction.user.tag);
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
			// update the database to add the acceptedMatchFoundPlayers including the dummy players
			// await pugModel.updateOne(
			// 	{ _id: doc._id },
			// 	{ $addToSet: { acceptedMatchFoundPlayers: interaction.user.tag } }
			// );
			await pugModel.updateOne(
				{ _id: doc._id },
				{ acceptedMatchFoundPlayers: acceptedMatchFoundPlayers }
			);
			responseMessage = "You've accepted the match for " + categoryName + "!";
		} else {
			responseMessage =
				"You've already accepted the match for " + categoryName + "!";
		}
	} else if (interaction.customId === "declineMatchButton") {
		if (matchFoundPlayers.includes(interaction.user.tag)) {
			matchFoundPlayers = matchFoundPlayers.filter(
				(tag) => tag !== interaction.user.tag
			);
			await pugModel.updateOne(
				{ _id: doc._id },
				{ $pull: { matchFoundPlayers: interaction.user.tag } }
			);
			responseMessage = "You've declined the match for " + categoryName + "!";
		} else {
			responseMessage =
				"You are not in the match found players for " + categoryName + ".";
		}
	}

	// Send a reply to the user
	await interaction.editReply({ content: responseMessage });
};
