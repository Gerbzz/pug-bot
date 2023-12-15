// src/commands/pug-system/delete-pug-category.js

// Import necessary classes and types from the discord.js library
const { ApplicationCommandOptionType, ChannelType } = require("discord.js");
const pugModel = require("../../models/pug-model");

// Export the module, defining the structure and behavior of the "delete-pug-category" command
module.exports = {
	devOnly: true,
	name: "delete-pug-category", // Name of the command
	description: "Deletes the specified pug environment category.", // Description of what the command does

	// Define the options (arguments) this command will accept
	options: [
		{
			name: "category_name", // Name of the option
			description: "The name of the category to delete.", // Description of the option
			type: ApplicationCommandOptionType.String, // Type of the option (String)
			required: true, // This option is mandatory
		},
	],

	// The callback function that gets executed when the command is called
	callback: async (client, interaction) => {
		// Check if the interaction is a command (and not another type like button click)
		if (!interaction.isChatInputCommand()) return;

		// Log the name of the command being executed for debugging purposes
		console.log(`${interaction.commandName} command was ran!`.blue.inverse);

		// Check if the executed command is "delete-pug-category"
		if (interaction.commandName === "delete-pug-category") {
			// Retrieve the category name provided by the user from the command options
			const categoryName = interaction.options.getString("category_name");

			// Obtain the guild (server) object from the interaction
			const guild = interaction.guild;

			// Check if the guild object is available
			if (!guild) {
				// If not, reply to the interaction indicating the error
				interaction.reply("Error: Unable to find the guild.");
				return;
			}

			// Fetch all channels of the guild
			guild.channels
				.fetch()
				.then((channels) => {
					// Find the category to delete based on the provided name
					const categoryToDelete = channels.find(
						(channel) =>
							channel.name === categoryName &&
							channel.type === ChannelType.GuildCategory
					);

					// Check if the specified category exists
					if (categoryToDelete) {
						// Filter out all channels that are children of the specified category
						console.log(`Deletion in progress...`.red.inverse);
						channels
							.filter((channel) => channel.parentId === categoryToDelete.id)
							.forEach((channel) => {
								// Delete each channel found in the category
								channel.delete().catch(console.error);
								console.log(`Channel "${channel.name}" has been deleted.`.red);
							});

						let docNeeded = pugModel.findOne({
							serverId: interaction.guild.id,
							categoryName: categoryName,
						});

						docNeeded
							.then((doc) => {
								console.log(
									`.\n.\n.\nnewPug data from DB is set up for deletion on db : ${JSON.stringify(
										doc,
										null,
										2
									)}\n.\n.\n.`.red
								);
							})
							.catch((err) => {
								console.error("Error retrieving newPug data:", err);
							});

						// Delete the corresponding pug model from the database
						pugModel
							.deleteOne({
								serverId: interaction.guild.id,
								categoryName: categoryName,
							})
							.then(() => {
								// Log the successful deletion of the pug model
								console.log(
									`Pug model for category "${categoryName}" has been deleted in the database.`
										.red.inverse
								);
							})
							.catch((err) => {
								console.error(
									`Error deleting pug category "${categoryName}":`,
									err
								);
							});

						// After deleting all channels, delete the category itself
						categoryToDelete
							.delete()
							.then(() => {
								// Log the successful deletion of the category
								console.log(
									`Category "${categoryName}" and its channels have been deleted in the discord.`
										.red.inverse
								);
							})
							.catch(console.error);

						// Reply to the interaction indicating that the deletion process is complete
						interaction.reply(
							`Category "${categoryName}" and its channels have been deleted.`
						);
					} else {
						// If the category does not exist, reply to the interaction accordingly
						interaction.reply(`Category "${categoryName}" does not exist.`);
						console.log(`Category "${categoryName}" does not exist.`);
					}
				})
				.catch(console.error); // Handle any errors during the fetching process
		}
	},
};
