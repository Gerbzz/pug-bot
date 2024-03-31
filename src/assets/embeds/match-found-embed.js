/** @format */
// src/assets/embeds/match-found-embed.js
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require("discord.js");

const thumbnailUrl =
	"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzJqeDJxYTQ3aXU5N3E1cHR2bnVrZTR3MXMzc3I4c3NrY2N1cHUydSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xUPGcLvo0MIkriPh2o/giphy.gif";

function calculateWaitingPlayers(doc) {
	// Directly reference the last match object, assuming it's the current one.
	const currentMatch = doc.matchFoundPlayers[doc.matchFoundPlayers.length - 1];

	// Guard clause for when there's no current match.
	if (!currentMatch || currentMatch.players.length === 0) {
		return "No current match or no players found.";
	}

	// Calculate waiting players by filtering those not yet accepted.
	const waitingPlayers = currentMatch.players
		.filter(
			(player) =>
				!doc.acceptedMatchFoundPlayers.some((accepted) =>
					accepted.players
						.map((acceptedPlayer) => acceptedPlayer.userId)
						.includes(player.userId)
				)
		)
		.map((player) => player.userTag); // Transform to userTag for display.

	// Check if there are any waiting players.
	if (waitingPlayers.length > 0) {
		// If there are, return their userTags.
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
		.setColor(0x0099ff);
}

// Create the button
const acceptMatchButton = new ButtonBuilder()
	.setCustomId("acceptMatchButton")
	.setLabel("Accept Match")

	.setStyle(ButtonStyle.Primary);

const declineMatchButton = new ButtonBuilder()
	.setCustomId("declineMatchButton")
	.setLabel("Decline Match")
	.setStyle(ButtonStyle.Secondary);

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
