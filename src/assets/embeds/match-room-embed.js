/** @format */

const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require("discord.js");
const pugModel = require("../../models/pug-model");

// Make sure matchRoomEmbed is an async function since you're now performing an async operation within it

// Function to generate the match room embed
function matchRoomEmbed(doc) {
	const thumbnailUrl =
		"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzJqeDJxYTQ3aXU5N3E1cHR2bnVrZTR3MXMzc3I4c3NrY2N1cHUydSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xUPGcLvo0MIkriPh2o/giphy.gif";

	const embed = new EmbedBuilder()
		.setThumbnail(thumbnailUrl)
		.setTitle("Match Room Interface!")
		.setDescription(
			"Please report the match results accurately using the buttons below. Your cooperation ensures fair play and helps maintain the integrity of our gaming community."
		)

		.setColor(0x0099ff);

	const currentMatch = doc.matchFoundPlayers.find(
		(m) => m.readyCheckCounter === doc.readyCheckCounter
	);
	const players = currentMatch
		? currentMatch.players.map((player) => player.userTag)
		: [];

	if (players.length === 0) {
		console.log("No players found in the current match.");
		embed.addFields({
			name: "Waiting for Players",
			value: "No players found.",
		});
		return embed;
	}

	const playersPerTeam = Math.ceil(players.length / doc.numOfTeamsPerPUG);
	const teams = []; // Initialize teams array
	console.log(teams);

	for (let i = 0; i < doc.numOfTeamsPerPUG; i++) {
		const teamStartIndex = i * playersPerTeam;
		const teamEndIndex = teamStartIndex + playersPerTeam;
		const teamPlayers = players.slice(teamStartIndex, teamEndIndex);
		teams.push({ name: `Team ${i + 1}`, players: teamPlayers });
		console.log(`Team ${i + 1}:`, teams[i]);
		embed.addFields({
			name: `Team ${i + 1}`,
			value: teamPlayers.join("\n") || "Waiting for players...",
			inline: true,
		});
	}

	console.log(
		"this is what teams looks like now using JSON.stringify(teams, null, 2): " +
			JSON.stringify(teams, null, 2)
	);

	return { embed, teams };
}

const reportResultsButton = new ButtonBuilder()
	.setCustomId("report_results")
	.setLabel("Report Results")
	.setStyle(ButtonStyle.Primary);

const row = new ActionRowBuilder().addComponents(reportResultsButton);
module.exports = {
	matchRoomEmbed,
	matchRoomComponents: [row],
};
