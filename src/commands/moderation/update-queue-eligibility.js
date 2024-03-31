/** @format */

// src/commands/pug-system/update-queue-eligibility.js
const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const pugModel = require("../../models/pug-model");

module.exports = {
	name: "update-queue-eligibility",
	description: "Update a player's eligibility to queue based on their mention.",
	options: [
		{
			name: "user",
			description: "The user to update.",
			type: ApplicationCommandOptionType.User,
			required: true,
		},
		{
			name: "eligible",
			description: "Whether the user is eligible to queue (true/false).",
			type: ApplicationCommandOptionType.Boolean,
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
		const isEligible = interaction.options.getBoolean("eligible");

		const updateResult = await pugModel.updateOne(
			{
				"playerProfiles.userId": user.id,
				serverId: interaction.guild.id,
				categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
			},
			{ $set: { "playerProfiles.$.isEligibleToQueue": isEligible } }
		);
		// Create an embed to display the result
		const embed = new EmbedBuilder()
			.setTitle("Queue Eligibility Updated")
			.addFields(
				{
					name: updateResult.modifiedCount === 0 ? "❌ Error" : "✅ Success",
					value:
						updateResult.modifiedCount === 0
							? `Player not found or eligibility already set to this value for ${user.tag}.`
							: `Eligibility for user ${user.tag} updated to ${
									isEligible
										? ":white_check_mark: eligible"
										: ":x: not eligible"
							  }.`,
				},
				{ name: "👤 User", value: user.tag, inline: true },
				{
					name: isEligible ? "🔓 Eligible" : "🔒 Not Eligible",
					value: isEligible
						? "User is now eligible to queue."
						: "User is not eligible to queue.",
					inline: true,
				}
			);

		// Set the color based on success or failure
		embed.setColor(updateResult.modifiedCount === 0 ? "#ff0000" : "#00ff00");

		// Reply with the embed
		interaction.reply({ embeds: [embed], ephemeral: true });
	},
};
