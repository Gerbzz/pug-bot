/** @format */

// src/commands/pug-system/add-pug-category.js
const {
	ApplicationCommandOptionType,
	ChannelType,
	EmbedBuilder,
} = require("discord.js");

const pugModel = require("../../models/pug-model");

module.exports = {
	name: "update-player-elo",
	description: "Update a player's ELO based on their mention.",
	options: [
		{
			name: "user",
			description: "The user to update.",
			type: ApplicationCommandOptionType.User,
			required: true,
		},
		{
			name: "new-elo",
			description: "The new ELO value for the user.",
			type: ApplicationCommandOptionType.Number,
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
		const newElo = interaction.options.getNumber("new-elo");
		// Retrieve previous ELO from the database
		const existingProfile = await pugModel.findOne({
			"playerProfiles.userId": user.id,
			serverId: interaction.guild.id,
			categoryName: baseCategoryName,
		});

		const previousElo = existingProfile
			? existingProfile.playerProfiles.find(
					(profile) => profile.userId === user.id
			  ).userELO
			: "N/A";

		const updateResult = await pugModel.updateOne(
			{
				"playerProfiles.userId": user.id,
				serverId: interaction.guild.id,
				categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
			},
			{ $set: { "playerProfiles.$.userELO": newElo } }
		);

		try {
			const embed = new EmbedBuilder()
				.setColor(updateResult.modifiedCount === 0 ? "#ff0000" : "#00ff00")
				.setTitle("Player ELO Updated")
				.addFields({
					name: updateResult.modifiedCount === 0 ? "❌ Error" : "✅ Success",
					value:
						updateResult.modifiedCount === 0
							? `Player not found or ELO already set to this value for ${user.tag}.`
							: `ELO for user ${user.tag} updated from ${previousElo} ➡️ ${newElo}.`,
				});

			interaction.reply({ embeds: [embed], ephemeral: true });
		} catch (error) {
			console.error("Error updating player ELO:", error);
			interaction.reply({
				content: "An error occurred while updating player ELO.",
				ephemeral: true,
			});
		}
	},
};
