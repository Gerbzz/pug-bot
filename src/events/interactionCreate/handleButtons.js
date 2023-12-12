// events/interactionCreate/handleButtons.js
let pug_que_arrays = {};

module.exports = async (client, interaction) => {
	if (!interaction.isButton()) return;

	await interaction.deferReply({ ephemeral: true }); // Acknowledge the interaction immediately

	// Access the channel and category where the interaction took place
	const channel = interaction.channel;
	const category = channel.parent;
	const categoryName = category ? category.name : "Unknown Category";

	// Initialize the queue for the category if it doesn't exist
	if (!pug_que_arrays[categoryName]) {
		pug_que_arrays[categoryName] = [];
	}

	if (interaction.customId === "joinQueue") {
		if (!pug_que_arrays[categoryName].includes(interaction.user.tag)) {
			pug_que_arrays[categoryName].push(interaction.user.tag);
			await interaction.editReply({
				content: "You've joined the queue for " + categoryName + "!",
			});
			console.log(
				`${interaction.user.tag} just joined the ${categoryName} pug-que...`
			);
		} else {
			await interaction.editReply({
				content: "You are already in the queue for " + categoryName + ".",
			});
			console.log(
				`${interaction.user.tag} just tried to join the ${categoryName} pug-que... but they're already in it... l0l`
			);
		}
	}

	if (interaction.customId === "leaveQueue") {
		// Check if the user is in the queue
		if (pug_que_arrays[categoryName].includes(interaction.user.tag)) {
			// Remove the user from the queue
			pug_que_arrays[categoryName] = pug_que_arrays[categoryName].filter(
				(tag) => tag !== interaction.user.tag
			);
			await interaction.editReply({
				content: "You've left the queue for " + categoryName + "!",
			});
			console.log(
				`${interaction.user.tag} just left the ${categoryName} pug-que...`
			);
			// Update the embed/message that shows the queue
			// ... (code to update the embed)
		} else {
			// User is not in the queue
			await interaction.editReply({
				content: "You are not in the queue for " + categoryName + ".",
			});
			console.log(
				`${interaction.user.tag} is not in the queue for ${categoryName} pug-que...`
			);
		}
	}

	// Log the current state of the queue for debugging
	console.log(pug_que_arrays);
};
