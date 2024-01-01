const pugModel = require("../models/pug-model");

module.exports = {
	name: "joinButton",
	async execute(interaction) {
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
		const user = interaction.user;
		const queuedPlayers = doc.queuedPlayers || [];
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

		// Adding dummy players for testing
		for (const player of dummyPlayers) {
			if (!queuedPlayers.includes(player)) {
				queuedPlayers.push(player);
				// console log each player that is added to the queue
				console.log(`Dummy Player added... ${player} joined the queue`.magenta);
			}
		}

		// Update the queued players in the database
		await pugModel.updateOne(
			{ _id: doc._id },
			{ queuedPlayers: queuedPlayers }
		);

		// Check if the user is already in the queue
		if (!queuedPlayers.includes(user.id)) {
			queuedPlayers.push(user.id);
			await interaction.reply(`You have joined the queue for ${categoryName}!`);
		} else {
			await interaction.reply(
				`You are already in the queue for ${categoryName}.`
			);
		}
	},
};
