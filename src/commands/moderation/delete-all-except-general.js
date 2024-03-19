/** @format */

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
const pugModel = require("../../models/pug-model");

module.exports = {
	devOnly: true,
	name: "delete-all-except-general",
	description: "Deletes all channels except those named 'general'",

	callback: async (client, interaction) => {
		if (!interaction.isChatInputCommand()) return;
		console.log(`${interaction.commandName} command was ran!`.blue.inverse);
		const guild = interaction.guild;

		if (!guild) {
			await interaction.reply("Error: Unable to find the guild.");
			return;
		}

		try {
			const channels = await guild.channels.fetch();
			let deletedChannels = [];

			await interaction.reply("Deletion in progress...");
			console.log("Deletion in progress...".red.inverse);

			for (const channel of channels.values()) {
				if (
					channel &&
					channel.name &&
					channel.name.toLowerCase() !== "general" &&
					channel.deletable
				) {
					await channel.delete();
					deletedChannels.push(channel.name);
					console.log(`Deleted channel : ${channel.name}`.red);
				}
			}
			pugModel
				.deleteMany({})
				.then(() => {
					console.log(
						"All documents have been deleted from the pugModel collection.".red
							.inverse
					);
				})
				.catch((err) => {
					console.error(
						"Error deleting all documents from the pugModel collection:",
						err
					);
				});

			console.log(
				"All channels except 'general' have been deleted.".red.inverse
			);
			const replyMessage = `Channels ${JSON.stringify(
				deletedChannels
			)} have been deleted.`;
			await interaction.editReply(replyMessage);
		} catch (error) {
			console.error("Error deleting channels:", error);
			await interaction.reply("An error occurred while deleting channels.");
		}
	},
};
