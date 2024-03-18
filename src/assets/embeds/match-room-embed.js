/** @format */

const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require("discord.js");

const thumbnailUrl =
	"https://cdn.discordapp.com/attachments/549053891476455436/677649538214920217/black_bar_transparent.png1.png?ex=6584c2d0&is=65724dd0&hm=c832f28a000b02d7417a260a716a95e917e36ed3adae3db6bdeff92d14b6341a&";

function matchRoomEmbed(doc) {
	// Debug log
	console.log(`doc: ${JSON.stringify(doc)}`.yellow);

	const embed = new EmbedBuilder()
		.setThumbnail(thumbnailUrl)
		.setTitle("Match Room Interface!")
		.setDescription("Click one of the buttons below once the game has ended.")
		.setColor(0x2a2d31);

	// Correctly reference the players of the current match
	const currentMatch = doc.matchFoundPlayers[doc.readyCheckCounter - 1];
	const players = currentMatch ? currentMatch.players : [];

	// Dynamically add teams based on the players array
	for (let i = 0; i < doc.numOfTeamsPerPUG; i++) {
		const startIndex = i * doc.numOfPlayersPerTeam;
		const endIndex = startIndex + doc.numOfPlayersPerTeam;
		let teamPlayers = players.slice(startIndex, endIndex).join("\n");

		embed.addFields({
			name: `Team ${i + 1}`,
			value: teamPlayers || "Waiting for players...",
			inline: true,
		});
	}

	return embed;
}

const leaveGameButton = new ButtonBuilder()
	.setCustomId("leave_game")
	.setLabel("Leave Game")
	.setStyle(ButtonStyle.Danger);

const playAgainButton = new ButtonBuilder()
	.setCustomId("play_again")
	.setLabel("Play Again")
	.setStyle(ButtonStyle.Success);

const row = new ActionRowBuilder().addComponents(
	leaveGameButton,
	playAgainButton
);

module.exports = {
	matchRoomEmbed,
	matchRoomComponents: [row],
};
