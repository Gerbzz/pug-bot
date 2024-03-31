/** @format */

const { EmbedBuilder } = require("discord.js"); // Ensure to import EmbedBuilder
const pugModel = require("../../models/pug-model");

module.exports = {
	name: "show-my-stats",
	description: "Display your PUG stats.",
	callback: async (client, interaction) => {
		try {
			const user = interaction.user;
			const userProfile = await pugModel.findOne({
				serverId: interaction.guild.id,
				categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
				"playerProfiles.userId": user.id,
			});

			if (!userProfile) {
				return interaction.reply({
					content: "You don't have a profile yet. 😢",
					ephemeral: true,
				});
			}

			const userStats = userProfile.playerProfiles.find(
				(profile) => profile.userId === user.id
			);

			// Create an embed message
			const embed = new EmbedBuilder()
				.setColor(0x0099ff) // A nice blue color
				.setTitle("📊 Your PUG Stats")
				.addFields(
					{ name: "User Tag", value: `${userStats.userTag}`, inline: true },
					{ name: "Wins 🏆", value: `${userStats.wins}`, inline: true },
					{ name: "Losses 💔", value: `${userStats.losses}`, inline: true },
					{ name: "ELO ", value: `${userStats.userELO}`, inline: false }
				)
				.setFooter({ text: "Keep playing to improve your stats!" });

			// Reply with the embed
			interaction.reply({
				embeds: [embed],
				ephemeral: false,
			});
		} catch (error) {
			console.error("Error fetching user stats:", error);
			interaction.reply({
				content: "An error occurred while fetching your stats. 😵",
				ephemeral: true,
			});
		}
	},
};
