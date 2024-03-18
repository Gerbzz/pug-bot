/** @format */
// src/assets/embeds/match-found-embed.js
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require("discord.js");

const thumbnailUrl =
	"https://cdn.discordapp.com/attachments/549053891476455436/677649538214920217/black_bar_transparent.png1.png?ex=6584c2d0&is=65724dd0&hm=c832f28a000b02d7417a260a716a95e917e36ed3adae3db6bdeff92d14b6341a&";

function calculateWaitingPlayers(doc) {
	// Directly reference the last match object, assuming it's the current one.
	const currentMatch = doc.matchFoundPlayers[doc.matchFoundPlayers.length - 1];

	// Guard clause for when there's no current match.
	if (!currentMatch || currentMatch.players.length === 0) {
		return "No current match or no players found.";
	}

	// Calculate waiting players by filtering those not yet accepted.
	const waitingPlayers = currentMatch.players.filter(
		(player) =>
			!doc.acceptedMatchFoundPlayers.some((accepted) =>
				accepted.players.includes(player)
			)
	);

	// Check if there are any waiting players.
	if (waitingPlayers.length > 0) {
		// If there are, return their identifiers.
		return waitingPlayers.join(", ");
	} else {
		// If there aren't, indicate all players have accepted.
		return "All players accepted!";
	}
}

// Create the embed
function matchFoundEmbed(doc) {
	return new EmbedBuilder()
		.setThumbnail(thumbnailUrl)
		.setTitle("Match Found Interface!")
		.setDescription("Click the Buttons Below to Accept or Decline the Match.")
		.setFields([
			{
				name: "Waiting on Response From:",
				value: calculateWaitingPlayers(doc),
				inline: true,
			},
		])
		.setColor(0x2a2d31);
}

// Create the button
const acceptMatchButton = new ButtonBuilder()
	.setCustomId("acceptMatchButton")
	.setLabel("Accept Match")
	.setStyle(ButtonStyle.Success);

const declineMatchButton = new ButtonBuilder()
	.setCustomId("declineMatchButton")
	.setLabel("Decline Match")
	.setStyle(ButtonStyle.Danger);

// Create an action row and add the button to it
const row = new ActionRowBuilder().addComponents(
	acceptMatchButton,
	declineMatchButton
);

// Export the embed and components
module.exports = {
	matchFoundEmbed,
	// replace components with matchFoundComponents
	matchFoundComponents: [row],
};
