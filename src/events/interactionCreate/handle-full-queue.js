// // src/events/interactionCreate/
// const { ChannelType } = require("discord.js");
// const globalState = require("../../state/global-state");
// const {
// 	createMatchRoomEmbed,
// 	components,
// } = require("../../assets/embeds/match-room-embed");

// module.exports = async (client, interaction) => {
// 	// Check if the queue is full and handle it
// 	const {
// 		pugQueueArrays,
// 		totalNumOfPlayersPerPUG,
// 		numOfPlayersPerTeam,
// 		numOfTeamsPerPUG,
// 		pugFormat,
// 		matchCounter,
// 	} = globalState.getState();

// 	const channel = interaction.channel;
// 	if (!channel) {
// 		console.error("The interaction does not have an associated channel.");
// 		// Handle the error appropriately, perhaps by sending a message back or logging
// 		return;
// 	}

// 	const category = channel.parent;
// 	if (!category) {
// 		console.error("The channel does not have an associated category.");
// 		// Handle the error appropriately
// 		return;
// 	}

// 	const categoryName = category.name;

// 	if (
// 		pugQueueArrays[categoryName] &&
// 		pugQueueArrays[categoryName].length >= totalNumOfPlayersPerPUG
// 	) {
// 		// Queue is full, handle it by creating match category and channels

// 		// add 1 to the matchCounter in globalState before we do anything...
// 		let newMatchCounter = matchCounter + 1;
// 		globalState.setState({ matchCounter: newMatchCounter });
// 		globalState.getState(); // getting the new info before we create stuff again.

// 		const guild = interaction.member.guild;
// 		const embed = createMatchRoomEmbed();
// 		// Create the bot folders and channels
// 		// Check for existing category
// 		guild.channels
// 			.fetch()
// 			.then((channels) => {
// 				if (
// 					!channels.find(
// 						(channel) =>
// 							channel.name === `${categoryName} PUG#${matchCounter + 1}` &&
// 							channel.type === ChannelType.GuildCategory
// 					)
// 				) {
// 					// Create the category
// 					guild.channels
// 						.create({
// 							name: `${categoryName} PUG#${matchCounter}`,
// 							type: ChannelType.GuildCategory,
// 						})
// 						.then((createdCategory) => {
// 							const categoryID = createdCategory.id;

// 							// Check for existing voice and text channels
// 							const existingTextChannel = channels.find(
// 								(channel) =>
// 									(channel.name === "match-room" &&
// 										channel.parentID === categoryID) ||
// 									(channel.name === "match-room-interface" &&
// 										channel.parentID === categoryID)
// 							);

// 							const existingVoiceChannel = channels.find(
// 								(channel) =>
// 									(channel.name === "red-team" &&
// 										channel.parentID === categoryID) ||
// 									(channel.name === "blue-team" &&
// 										channel.parentID === categoryID)
// 							);

// 							// Create voice channel if it doesn't exist
// 							if (!existingVoiceChannel) {
// 								guild.channels.create({
// 									name: "red-team",
// 									type: ChannelType.GuildVoice,
// 									parent: categoryID,
// 								});
// 								guild.channels.create({
// 									name: "blue-team",
// 									type: ChannelType.GuildVoice,
// 									parent: categoryID,
// 								});
// 							}

// 							// Create text channel if it doesn't exist
// 							if (!existingTextChannel) {
// 								guild.channels.create({
// 									name: "match-room",
// 									type: ChannelType.GuildText,
// 									parent: categoryID,
// 								});
// 							}

// 							// Create pug-que text channel with specific permissions
// 							guild.channels
// 								.create({
// 									name: "match-room-interface",
// 									type: ChannelType.GuildText,
// 									parent: categoryID,
// 									overwrites: [
// 										{
// 											id: guild.id,
// 											deny: ["SEND_MESSAGES"], // Everyone can't send messages
// 										},
// 									],
// 								})
// 								.then((matchRoomInterfaceChannel) => {
// 									// Add interface not embed
// 									matchRoomInterfaceChannel.send({
// 										embeds: [embed],
// 										components: components,
// 									});
// 								})
// 								.catch(console.error);
// 						})
// 						.catch(console.error);
// 					//console.log(state);
// 				} else {
// 					console.log(`Category "${categoryName}" already exists.`);
// 				}
// 			})
// 			.catch(console.error);
// 	}
// };

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// const { ChannelType } = require("discord.js");
// const globalState = require("../../state/global-state");
// const {
// 	createMatchRoomEmbed,
// 	components,
// } = require("../../assets/embeds/match-room-embed");
// const pugModel = require("../../models/pug-model");

// module.exports = async (client, interaction) => {
// 	// Check if the queue is full and handle it
// 	// const {
// 	// 	pugQueueArrays,
// 	// 	totalNumOfPlayersPerPUG,
// 	// 	numOfTeamsPerPUG,
// 	// 	matchCounter,
// 	// } = globalState.getState();

// 	let doc = await pugModel.findOne({
// 		serverId: interaction.guild.id,
// 		categoryName: categoryName,
// 	});

// 	// rewriting the above code to use the doc instead of the globalState
// 	let queuedPlayers = doc.queuedPlayers;
// 	let totalNumOfPlayersPerPUG = doc.totalNumOfPlayersPerPUG;
// 	let numOfTeamsPerPUG = doc.numOfTeamsPerPUG;
// 	let matchCounter = doc.matchCounter;

// 	if (!doc) {
// 		console.log("No pugModel to be used as reference!");
// 		return;
// 	}

// 	const channel = interaction.channel;
// 	if (!channel) {
// 		console.error("The interaction does not have an associated channel.");
// 		return;
// 	}

// 	const category = channel.parent;
// 	if (!category) {
// 		console.error("The channel does not have an associated category.");
// 		return;
// 	}
// 	const categoryName = category.name;

// 	if (pugQueueArrays[categoryName]?.length >= totalNumOfPlayersPerPUG) {
// 		// Increment match counter
// 		let newMatchCounter = matchCounter + 1;
// 		globalState.setState({ matchCounter: newMatchCounter });

// 		const guild = interaction.guild;
// 		const embed = createMatchRoomEmbed();

// 		try {
// 			// Create the match category
// 			const matchCategory = await guild.channels.create({
// 				name: `${categoryName} PUG#${newMatchCounter}`,
// 				type: ChannelType.GuildCategory,
// 			});

// 			// Create voice channels for each team
// 			for (let i = 1; i <= numOfTeamsPerPUG; i++) {
// 				await guild.channels.create({
// 					name: `Team ${i}`,
// 					type: ChannelType.GuildVoice,
// 					parent: matchCategory.id,
// 				});
// 			}

// 			// Create the match room text channel
// 			await guild.channels.create({
// 				name: "match-room",
// 				type: ChannelType.GuildText,
// 				parent: matchCategory.id,
// 			});

// 			// Send the match room interface message
// 			const matchRoomInterfaceChannel = await guild.channels.create({
// 				name: "match-room-interface",
// 				type: ChannelType.GuildText,
// 				parent: matchCategory.id,
// 			});

// 			await matchRoomInterfaceChannel.send({
// 				embeds: [embed],
// 				components: components,
// 			});

// 			// Reset the queue for the category
// 			pugQueueArrays[categoryName] = [];
// 			globalState.setState({ pugQueueArrays });
// 			console.log(
// 				`Match channels created for ${categoryName} PUG#${newMatchCounter}`
// 			);
// 		} catch (error) {
// 			console.error("Error creating match category and channels:", error);
// 		}
// 	}
// };

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const { ChannelType } = require("discord.js");
const {
	createMatchRoomEmbed,
	components,
} = require("../../assets/embeds/match-room-embed");
const pugModel = require("../../models/pug-model");

module.exports = async (client, interaction) => {
	const channel = interaction.channel;
	if (!channel) {
		console.error("The interaction does not have an associated channel.");
		return;
	}

	const category = channel.parent;
	if (!category) {
		console.error("The channel does not have an associated category.");
		return;
	}
	const categoryName = category.name;

	let doc = await pugModel.findOne({
		serverId: interaction.guild.id,
		categoryName: categoryName,
	});

	if (!doc) {
		console.log("No pugModel found for the given categoryName and serverId!");
		return;
	}

	let queuedPlayers = doc.queuedPlayers;
	let totalNumOfPlayersPerPUG = doc.totalNumOfPlayersPerPUG;
	let numOfTeamsPerPUG = doc.numOfTeamsPerPUG;
	let matchCounter = doc.matchCounter;

	if (queuedPlayers.length >= totalNumOfPlayersPerPUG) {
		// Increment match counter
		let newMatchCounter = matchCounter + 1;

		// Save the incremented match counter to the database
		doc.matchCounter = newMatchCounter;
		await doc.save();

		const guild = interaction.guild;
		const embed = createMatchRoomEmbed();

		try {
			// Create the match category
			const matchCategory = await guild.channels.create({
				name: `${categoryName} PUG#${newMatchCounter}`,
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

			// Reset the queue for the category in the database
			doc.queuedPlayers = [];
			await doc.save();

			console.log(
				`Match channels created for ${categoryName} PUG#${newMatchCounter}`
			);
		} catch (error) {
			console.error("Error creating match category and channels:", error);
		}
	}
};
