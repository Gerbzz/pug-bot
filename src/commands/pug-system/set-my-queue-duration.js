/** @format */

// src/commands/pug-system/set-my-queue-duration.js
const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const pugModel = require("../../models/pug-model");

module.exports = {
	name: "set-my-queue-duration",
	description: "Set your queue wait duration.",
	// deleted: true,
	options: [
		{
			name: "new-duration",
			description: "Your new queue wait duration (in minutes).",
			type: ApplicationCommandOptionType.Integer, // Use Integer for whole numbers
			required: true,
		},
	],
	callback: async (client, interaction) => {
		const user = interaction.user; // Use the interaction user directly
		const newDuration = interaction.options.getInteger("new-duration");

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

		// Check for valid duration input
		if (newDuration <= 0) {
			return interaction.reply({
				content: "Please provide a positive duration value.",
				ephemeral: true,
			});
		}

		const updateResult = await pugModel.updateOne(
			{
				"playerProfiles.userId": user.id,
				serverId: interaction.guild.id,
				categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
			},
			{ $set: { "playerProfiles.$.userQueueDuration": newDuration } }
		);

		try {
			const embed = new EmbedBuilder()
				.setColor(updateResult.modifiedCount === 0 ? "#ff0000" : "#00ff00")
				.setTitle("Queue Duration Updated")
				.addFields({
					name: updateResult.modifiedCount === 0 ? "❌ Error" : "✅ Success",
					value:
						updateResult.modifiedCount === 0
							? `Your profile was not found or your queue duration is already set to ${newDuration} minutes.`
							: `Your queue wait duration has been updated to ${newDuration} minutes.`,
				});

			interaction.reply({ embeds: [embed], ephemeral: true });
		} catch (error) {
			console.error("Error updating queue duration:", error);
			interaction.reply({
				content: "An error occurred while updating queue duration.",
				ephemeral: true,
			});
		}
	},
};
