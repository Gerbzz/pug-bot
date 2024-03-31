/** @format */

// src/commands/pug-system/update-pug-match-results.js
const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const pugModel = require("../../models/pug-model");

// Constants for ELO calculation
const WINNER_ELO_CHANGE = 25;
const LOSER_ELO_CHANGE = -25;

module.exports = {
	name: "update-pug-match-results",

	description:
		"Update wins, losses, and ELO for players in a specific match of a PUG.",
	options: [
		{
			name: "match-counter",
			description:
				"The counter indicating which match to update in the ongoing PUGs.",
			type: ApplicationCommandOptionType.Integer,
			required: true,
		},
		{
			name: "team-won",
			description: "The team that won the match.",
			type: ApplicationCommandOptionType.Integer,
			required: true,
		},
	],
	callback: async (client, interaction) => {
		// Ensure this command is only usable by moderators
		if (!interaction.member.permissions.has("MANAGE_GUILD")) {
			return interaction.reply({
				content: "You don't have permission to use this command.",
				ephemeral: true,
			});
		}

		console.log("Received command to update PUG match results.");

		const matchCounter = interaction.options.getInteger("match-counter");
		const teamWon = interaction.options.getInteger("team-won");

		console.log("Match Counter:", matchCounter);
		console.log("Team Won:", teamWon);

		try {
			// Find the PUG that contains the specified match
			const pug = await pugModel.findOne({
				serverId: interaction.guild.id,
				categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
				"onGoingPugs.matchCounter": matchCounter,
			});

			console.log("Found PUG:", pug);

			if (!pug) {
				console.log("No matching PUG found with the provided match counter.");
				return interaction.reply({
					content: "No match found with the provided match counter.",
					ephemeral: true,
				});
			}

			console.log("Determined winning and losing team.");

			// Determine which team is the losing team
			const teamLost = teamWon === 1 ? 2 : 1;

			// Determine the players in the winning team
			const playersToFind = pug.onGoingPugs[0].teams[teamWon - 1].players;

			console.log("this is playersToFind : " + playersToFind);

			// Retrieve the player tags for the losing team
			const playersToDecrement = pug.onGoingPugs[0].teams[teamLost - 1].players;

			console.log("this is playersToDecrement : " + playersToDecrement);

			// Update ELO for both winning and losing teams' players
			const updateResult = await pugModel.updateMany(
				{
					serverId: interaction.guild.id,
					"onGoingPugs.matchCounter": matchCounter,
					$or: [
						{
							"onGoingPugs.teams.name": "Team 1",
							"playerProfiles.userTag": { $in: playersToFind },
						},
						{
							"onGoingPugs.teams.name": "Team 2",
							"playerProfiles.userTag": { $in: playersToFind },
						},
					],
				},
				{
					$inc: {
						"playerProfiles.$[player].userELO":
							teamWon === 1 ? WINNER_ELO_CHANGE : LOSER_ELO_CHANGE,
						"playerProfiles.$[player].wins": teamWon === 1 ? 1 : 0,
						"playerProfiles.$[player].losses": teamWon === 1 ? 0 : 1,
					},
				},
				{
					arrayFilters: [
						{
							"player.userTag": { $in: playersToFind },
						},
					],
				}
			);

			const decrementResult = await pugModel.updateMany(
				{
					serverId: interaction.guild.id,
					"onGoingPugs.matchCounter": matchCounter,
					"onGoingPugs.teams.name": `Team ${teamLost}`,
					"playerProfiles.userTag": { $in: playersToDecrement },
				},
				{
					$inc: {
						"playerProfiles.$[player].userELO": LOSER_ELO_CHANGE,
						"playerProfiles.$[player].wins": 0,
						"playerProfiles.$[player].losses": 1,
					},
				},
				{
					arrayFilters: [
						{
							"player.userTag": { $in: playersToDecrement },
						},
					],
				}
			);

			console.log("Update Result:", updateResult);
			console.log("Decrement Result:", decrementResult);
			if (updateResult.modifiedCount === 0) {
				console.log("No players updated for the winning team.");
				interaction.reply({
					content:
						"No match found with the provided match counter or no players in the specified winning team.",
					ephemeral: true,
				});
				return;
			} else {
				console.log("ELO updated for players in the winning team.");
			}

			if (decrementResult.modifiedCount === 0) {
				console.log("No players updated for the losing team.");
				interaction.reply({
					content: "No players found in the specified losing team.",
					ephemeral: true,
				});
				return;
			} else {
				console.log("ELO decremented for players in the losing team.");
			}

			console.log("Successfully updated match results.");

			// Convert matchCounter to string
			const matchCounterString = matchCounter.toString();

			// Create an embed to display match result information
			const embed = new EmbedBuilder()
				.setColor(0x0099ff) //blue color for success
				.setTitle("PUG Match Results Updated")
				.setDescription(
					`ELO updated for players in the specified match of the PUG.\nWinners gained ${WINNER_ELO_CHANGE} ELO, losers lost ${LOSER_ELO_CHANGE} ELO.`
				)
				.addFields(
					{ name: "🏆 Winning Team", value: `Team ${teamWon}`, inline: true },
					{ name: "💔 Losing Team", value: `Team ${teamLost}`, inline: true },
					// Use the converted matchCounterString value
					{ name: "⚔️ Match Counter", value: matchCounterString, inline: true }
				);

			// Add players from the winning team
			const winningTeamPlayers = pug.onGoingPugs[0].teams[teamWon - 1].players;
			const winningTeamPlayersList = winningTeamPlayers
				.map((player) => {
					const playerProfile = pug.playerProfiles.find(
						(profile) => profile.userTag === player
					);
					const currentELO = playerProfile.userELO;
					const updatedELO = currentELO + WINNER_ELO_CHANGE;
					return `:star: ${player} (ELO: ${currentELO} ➡️ ${updatedELO})`;
				})
				.join("\n");
			embed.addFields({
				name: "🥇 Winning Team Players",
				value: winningTeamPlayersList,
			});

			// Add players from the losing team
			const losingTeamPlayers = pug.onGoingPugs[0].teams[teamLost - 1].players;
			const losingTeamPlayersList = losingTeamPlayers
				.map((player) => {
					const playerProfile = pug.playerProfiles.find(
						(profile) => profile.userTag === player
					);
					const currentELO = playerProfile.userELO;
					const updatedELO = currentELO + LOSER_ELO_CHANGE;
					return `👎 ${player} (ELO: ${currentELO} ➡️ ${updatedELO})`;
				})
				.join("\n");
			embed.addFields({
				name: "🥈 Losing Team Players",
				value: losingTeamPlayersList,
			});

			// Set the footer using an object
			embed.setFooter({
				text: "PUG Match Results",
				iconURL: "https://example.com/icon.png",
			});

			// Reply with the embed
			interaction.reply({ embeds: [embed], ephemeral: false });
		} catch (error) {
			console.error("Error updating match results:", error);
			interaction.reply({
				content: "An error occurred while updating match results.",
				ephemeral: true,
			});
		}
	},
};
