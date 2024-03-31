/** @format */

// src/commands/pug-system/update-player-wins-losses.js
const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const pugModel = require("../../models/pug-model");

module.exports = {
	// deleted: true,
	name: "update-player-wins-losses",
	description: "Update a player's wins and losses based on their mention.",
	options: [
		{
			name: "user",
			description: "The user to update.",
			type: ApplicationCommandOptionType.User,
			required: true,
		},
		{
			name: "new-wins",
			description: "The new wins value for the user.",
			type: ApplicationCommandOptionType.Integer,
			required: true,
		},
		{
			name: "new-losses",
			description: "The new losses value for the user.",
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

		let channel = interaction.channel;
		if (!channel) {
			return interaction.reply({
				content:
					"This command can only be run in the pug category text channels such as pug-chat for the given category.",
				ephemeral: true,
			});
		}
		let category = channel.parent;
		if (!category) {
			return interaction.reply({
				content:
					"This command can only be run in the pug category text channels such as pug-chat for the given category.",
				ephemeral: true,
			});
		}
		let categoryName = category.name;
		let baseCategoryName = categoryName.split(" ")[0]; // This will give you "5v5" if categoryName is "5v5 PUG#1"
		const user = interaction.options.getUser("user");
		const newWins = interaction.options.getInteger("new-wins");
		const newLosses = interaction.options.getInteger("new-losses");

		try {
			const updateResult = await pugModel.updateOne(
				{
					"playerProfiles.userId": user.id,
					serverId: interaction.guild.id,
					categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
				},
				{
					$set: {
						"playerProfiles.$.wins": newWins,
						"playerProfiles.$.losses": newLosses,
					},
				}
			);
			if (updateResult.modifiedCount === 0) {
				// User not found in playerProfiles
				return interaction.reply({
					content: `User ${user.tag} not found in player profiles.`,
					ephemeral: true,
				});
			}
			// Create an embed to display the result
			const embed = new EmbedBuilder()
				.setColor("#00ff00") // Green color for success
				.setTitle("Player Wins and Losses Updated")
				.addFields(
					{
						name: "✅ Success",
						value: `Wins and losses for user ${user.tag} updated to ${newWins} and ${newLosses} respectively.`,
					},
					{
						name: "User",
						value: `:bust_in_silhouette: ${user.tag}`,
						inline: true,
					}, // User tag with emoji
					{ name: "Current Wins", value: `:trophy: ${newWins}`, inline: true }, // Current wins with trophy emoji
					{ name: "Current Losses", value: `💔 ${newLosses}`, inline: true } // Broken heart emoji for losses
				);

			// Reply with the embed
			interaction.reply({ embeds: [embed], ephemeral: false });
		} catch (error) {
			console.error("Error updating player wins and losses:", error);
			interaction.reply({
				content: "An error occurred while updating player wins and losses.",
				ephemeral: true,
			});
		}
	},
};
