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
		} else {
			responseMessage =
				"You've already accepted the match for " + categoryName + "!";
		}
	} else if (interaction.customId === "declineMatchButton") {
		if (matchFoundPlayers.includes(interaction.user.tag)) {
			matchFoundPlayers = matchFoundPlayers.filter(
				(player) => player !== interaction.user.tag
			);
			acceptedMatchFoundPlayers = acceptedMatchFoundPlayers.filter(
				(player) => player !== interaction.user.tag
			);
			// Revert all non-declining, match-found players back to the queue
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
		} else {
			responseMessage =
				"You are not in the match found players for " + categoryName + ".";
		}
	}

	// Send a reply to the user
	await interaction.editReply({ content: responseMessage });
};
