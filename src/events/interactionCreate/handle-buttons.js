// const globalState = require("../../state/global-state");
// const {
// 	createPugQueEmbed,
// 	components,
// } = require("../../assets/embeds/pug-que-embed");

// module.exports = async (client, interaction) => {
// 	if (!interaction.isButton()) return;

// 	await interaction.deferReply({ ephemeral: true });

// 	const channel = interaction.channel;
// 	const category = channel.parent;
// 	const categoryName = category ? category.name : "Unknown Category";

// 	// const { pugQueueArrays, totalNumOfPlayersPerPUG } = globalState.getState(); ### BEFORE ####
// 	const { pugQueueArrays, totalNumOfPlayersPerPUG } = globalState.getState();
// 	if (!pugQueueArrays[categoryName]) {
// 		pugQueueArrays[categoryName] = [];
// 	}

// 	let responseMessage = "";
// 	let shouldUpdateEmbed = false;

// 	if (interaction.customId === "joinQueue") {
// 		if (!pugQueueArrays[categoryName].includes(interaction.user.tag)) {
// 			pugQueueArrays[categoryName].push(interaction.user.tag);
// 			responseMessage = "You've joined the queue for " + categoryName + "!";
// 			shouldUpdateEmbed = true;
// 			pugQueueArrays[categoryName].push("player1");
// 			pugQueueArrays[categoryName].push("player2");
// 			pugQueueArrays[categoryName].push("player3");
// 			pugQueueArrays[categoryName].push("player4");
// 			pugQueueArrays[categoryName].push("player5");
// 			pugQueueArrays[categoryName].push("player6");
// 			pugQueueArrays[categoryName].push("player7");
// 			pugQueueArrays[categoryName].push("player8");
// 			pugQueueArrays[categoryName].push("player9");

// 			// Log the current queue size for debugging
// 			const queueSize = pugQueueArrays[categoryName].length;
// 			console.log(
// 				`Queue size for ${categoryName}: ${queueSize} / ${totalNumOfPlayersPerPUG}`
// 			);
// 			globalState.setState({ pugQueueArrays });
// 		} else {
// 			responseMessage =
// 				"You are already in the queue for " + categoryName + ".";
// 		}
// 	}

// 	if (interaction.customId === "leaveQueue") {
// 		if (pugQueueArrays[categoryName].includes(interaction.user.tag)) {
// 			pugQueueArrays[categoryName] = pugQueueArrays[categoryName].filter(
// 				(tag) => tag !== interaction.user.tag
// 			);
// 			responseMessage = "You've left the queue for " + categoryName + "!";
// 			shouldUpdateEmbed = true;

// 			pugQueueArrays[categoryName].pop("player1");
// 			pugQueueArrays[categoryName].pop("player2");
// 			pugQueueArrays[categoryName].pop("player3");
// 			pugQueueArrays[categoryName].pop("player4");
// 			pugQueueArrays[categoryName].pop("player5");
// 			pugQueueArrays[categoryName].pop("player6");
// 			pugQueueArrays[categoryName].pop("player7");
// 			pugQueueArrays[categoryName].pop("player8");
// 			pugQueueArrays[categoryName].pop("player9");

// 			// Log the current queue size for debugging
// 			const queueSize = pugQueueArrays[categoryName].length;
// 			console.log(`Queue size for ${categoryName}: ${queueSize}`);
// 			globalState.setState({ pugQueueArrays });
// 		} else {
// 			responseMessage = "You are not in the queue for " + categoryName + ".";
// 		}
// 	}

// 	// Update the embed if the queue has changed
// 	if (shouldUpdateEmbed) {
// 		globalState.setState({ pugQueueArrays });
// 		const message = await interaction.message.fetch();
// 		const embed = createPugQueEmbed();

// 		// Update the pug_count on the embed
// 		embed.setDescription(
// 			`Queue: ${pugQueueArrays[categoryName].length} / ${totalNumOfPlayersPerPUG}`
// 		);

// 		// Edit the original message with the updated embed
// 		await message.edit({ embeds: [embed], components: components });
// 	}

// 	// Send a reply to the user
// 	await interaction.editReply({ content: responseMessage });

// 	// Log the current state of the queue for debugging
// 	console.log(
// 		`pugQueueArrays for ${categoryName}: ${pugQueueArrays[categoryName]} inside of handle-buttons.js`
// 	);
// };
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const globalState = require("../../state/global-state");
const {
	createPugQueEmbed,
	components,
} = require("../../assets/embeds/pug-que-embed");
const pugModel = require("../../models/pug-model");

module.exports = async (client, interaction) => {
	if (!interaction.isButton()) return;

	await interaction.deferReply({ ephemeral: true });

	const channel = interaction.channel;
	const category = channel.parent;
	const categoryName = category ? category.name : "Unknown Category";

	// Assuming queuedPlayers is part of the globalState
	let { queuedPlayers, totalNumOfPlayersPerPUG } = globalState.getState();

	let responseMessage = "";
	let shouldUpdateEmbed = false;

	if (interaction.customId === "joinQueue") {
		if (!queuedPlayers.includes(interaction.user.tag)) {
			queuedPlayers.push(interaction.user.tag);

			const userTag = interaction.user.tag;

			console.log(`${userTag} has joined the queue for ${categoryName}`.green);
			await pugModel.updateOne(
				{ categoryName: categoryName, queuedPlayers: { $ne: userTag } },
				{ $addToSet: { queuedPlayers: userTag } }
			);

			const players = [
				"player1",
				"player2",
				"player3",
				"player4",
				"player5",
				"player6",
				"player7",
				"player8",
				"player9",
			];

			try {
				for (let player of players) {
					await pugModel.updateOne(
						{ categoryName: categoryName, queuedPlayers: { $ne: player } },
						{ $addToSet: { queuedPlayers: player } }
					);
					console.log(
						`${player} has been added to the queue for ${categoryName}`.green
					);
				}
				console.log(
					"Dummy Players added successfully to the database".green.inverse
				);
			} catch (err) {
				console.log(
					"Something went wrong when adding dummy players to the database",
					err
				);
			}

			responseMessage = "You've joined the queue for " + categoryName + "!";
			shouldUpdateEmbed = true;

			// Log the current queue size for debugging
			console.log(
				`Queue size for ${categoryName} in server ${interaction.guild.id}: ${queuedPlayers.length} / ${totalNumOfPlayersPerPUG}`
					.blue.inverse
			);
			globalState.setState({ queuedPlayers });
		} else {
			responseMessage =
				"You are already in the queue for " + categoryName + ".";
		}
	}

	if (interaction.customId === "leaveQueue") {
		if (queuedPlayers.includes(interaction.user.tag)) {
			queuedPlayers = queuedPlayers.filter(
				(tag) => tag !== interaction.user.tag
			);

			const userTag = interaction.user.tag;
			queuedPlayers = queuedPlayers.filter((tag) => tag !== userTag);
			console.log(`${userTag} has left the pug queue for ${categoryName}`.red);
			console.log(`queuedPlayers: ${queuedPlayers}`.red.inverse);
			await pugModel.updateOne(
				{ categoryName: categoryName },
				{ $pull: { queuedPlayers: userTag } }
			);
			const players = [
				"player1",
				"player2",
				"player3",
				"player4",
				"player5",
				"player6",
				"player7",
				"player8",
				"player9",
			];

			try {
				for (let player of players) {
					await pugModel.updateOne(
						{ categoryName: categoryName, queuedPlayers: { $ne: player } },
						{ $pull: { queuedPlayers: player } }
					);
					console.log(`${player} has been removed from the queue`.red);
				}
				console.log("Players removed successfully".red.inverse);
			} catch (err) {
				console.log("Something went wrong when adding players", err);
			}

			responseMessage = "You've left the queue for " + categoryName + "!";
			shouldUpdateEmbed = true;

			// Log the current queue size for debugging
			console.log(`Queue size for ${categoryName}: ${queuedPlayers.length}`);
			globalState.setState({ queuedPlayers });
		} else {
			responseMessage = "You are not in the queue for " + categoryName + ".";
		}
	}

	// Update the embed if the queue has changed
	if (shouldUpdateEmbed) {
		// globalState.setState({ queuedPlayers, totalNumOfPlayersPerPUG});
		// replace globalState.setState({ queuedPlayers, totalNumOfPlayersPerPUG} }); with the database array queuedPlayers and totalNumOfPlayersPerPUG

		try {
			// Fetch the document from the database
			let doc = await pugModel.findOne({
				serverId: interaction.guild.id,
				categoryName: categoryName,
			});

			if (!doc) {
				console.log("No document found!");
				return;
			}

			// Use the data from the database to update the Discord message
			const message = await interaction.message.fetch();
			const embed = createPugQueEmbed();

			// Update the pug_count on the embed
			embed.setDescription(
				`Queue: ${doc.queuedPlayers.length} / ${doc.totalNumOfPlayersPerPUG}`
			);

			// Edit the original message with the updated embed
			await message.edit({ embeds: [embed], components: components });
		} catch (err) {
			console.log("Something wrong when updating data!", err);
		}
	}

	// Send a reply to the user
	await interaction.editReply({ content: responseMessage });

	// Log the current state of the queue for debugging
	console.log(
		`queuedPlayers in globalState: ${queuedPlayers} inside of handle-buttons.js`
	);
};
