const globalState = require("../../state/global-state");
const {
	createPugQueEmbed,
	components,
} = require("../../assets/embeds/pug-que-embed");

module.exports = async (client, interaction) => {
	if (!interaction.isButton()) return;

	await interaction.deferReply({ ephemeral: true });

	const channel = interaction.channel;
	const category = channel.parent;
	const categoryName = category ? category.name : "Unknown Category";

	const { pug_que_arrays, totalNumOfPlayersPerPUG } = globalState.getState();

	if (!pug_que_arrays[categoryName]) {
		pug_que_arrays[categoryName] = [];
	}

	let responseMessage = "";
	let shouldUpdateEmbed = false;

	if (interaction.customId === "joinQueue") {
		if (!pug_que_arrays[categoryName].includes(interaction.user.tag)) {
			pug_que_arrays[categoryName].push(interaction.user.tag);
			responseMessage = "You've joined the queue for " + categoryName + "!";
			shouldUpdateEmbed = true;
			pug_que_arrays[categoryName].push("player1");
			pug_que_arrays[categoryName].push("player2");
			pug_que_arrays[categoryName].push("player3");
			pug_que_arrays[categoryName].push("player4");
			pug_que_arrays[categoryName].push("player5");
			pug_que_arrays[categoryName].push("player6");
			pug_que_arrays[categoryName].push("player7");
			pug_que_arrays[categoryName].push("player8");
			pug_que_arrays[categoryName].push("player9");

			// Log the current queue size for debugging
			const queueSize = pug_que_arrays[categoryName].length;
			console.log(
				`Queue size for ${categoryName}: ${queueSize} / ${totalNumOfPlayersPerPUG}`
			);
			globalState.setState({ pug_que_arrays });
		} else {
			responseMessage =
				"You are already in the queue for " + categoryName + ".";
		}
	}

	if (interaction.customId === "leaveQueue") {
		if (pug_que_arrays[categoryName].includes(interaction.user.tag)) {
			pug_que_arrays[categoryName] = pug_que_arrays[categoryName].filter(
				(tag) => tag !== interaction.user.tag
			);
			responseMessage = "You've left the queue for " + categoryName + "!";
			shouldUpdateEmbed = true;

			pug_que_arrays[categoryName].pop("player1");
			pug_que_arrays[categoryName].pop("player2");
			pug_que_arrays[categoryName].pop("player3");
			pug_que_arrays[categoryName].pop("player4");
			pug_que_arrays[categoryName].pop("player5");
			pug_que_arrays[categoryName].pop("player6");
			pug_que_arrays[categoryName].pop("player7");
			pug_que_arrays[categoryName].pop("player8");
			pug_que_arrays[categoryName].pop("player9");

			// Log the current queue size for debugging
			const queueSize = pug_que_arrays[categoryName].length;
			console.log(`Queue size for ${categoryName}: ${queueSize}`);
			globalState.setState({ pug_que_arrays });
		} else {
			responseMessage = "You are not in the queue for " + categoryName + ".";
		}
	}

	// Update the embed if the queue has changed
	if (shouldUpdateEmbed) {
		globalState.setState({ pug_que_arrays });
		const message = await interaction.message.fetch();
		const embed = createPugQueEmbed();

		// Update the pug_count on the embed
		embed.setDescription(
			`Queue: ${pug_que_arrays[categoryName].length} / ${totalNumOfPlayersPerPUG}`
		);

		// Edit the original message with the updated embed
		await message.edit({ embeds: [embed], components: components });
	}

	// Send a reply to the user
	await interaction.editReply({ content: responseMessage });

	// Log the current state of the queue for debugging
	console.log(pug_que_arrays);
};
