// // src/commands/moderation/delete-all-except-general.js
// const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

// module.exports = {
// 	name: "delete-all-except-general",
// 	description: "Deletes all channels except those named 'general'",

// 	callback: async (client, interaction) => {
// 		if (!interaction.isChatInputCommand()) return;

// 		const guild = interaction.guild;

// 		if (!guild) {
// 			interaction.reply("Error: Unable to find the guild.");
// 			return;
// 		}

// 		try {
// 			const channels = await guild.channels.fetch();

// 			for (const channel of channels.values()) {
// 				if (channel.name.toLowerCase() !== "general") {
// 					await channel.delete();
// 				} else {
// 					{
// 						console.log("All channels except 'general' have been deleted.");
// 					}
// 				}
// 			}

// 			await interaction.reply(
// 				"All channels except 'general' have been deleted."
// 			);
// 		} catch (error) {
// 			console.error("Error deleting channels:", error);
// 			interaction.reply("An error occurred while deleting channels.");
// 		}
// 	},
// };

const { ApplicationCommandOptionType, ChannelType } = require("discord.js");

module.exports = {
	devOnly: true,
	name: "delete-all-except-general",
	description: "Deletes all channels except those named 'general'",

	callback: async (client, interaction) => {
		if (!interaction.isChatInputCommand()) return;
		console.log(interaction.commandName);
		const guild = interaction.guild;

		if (!guild) {
			await interaction.reply("Error: Unable to find the guild.");
			return;
		}

		try {
			const channels = await guild.channels.fetch();

			for (const channel of channels.values()) {
				if (
					channel &&
					channel.name &&
					channel.name.toLowerCase() !== "general" &&
					channel.deletable
				) {
					await channel.delete();
				}
			}

			console.log("All channels except 'general' have been deleted.");
			await interaction.reply(
				"All channels except 'general' have been deleted."
			);
		} catch (error) {
			console.error("Error deleting channels:", error);
			await interaction.reply("An error occurred while deleting channels.");
		}
	},
};
