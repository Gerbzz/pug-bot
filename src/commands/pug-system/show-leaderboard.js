/** @format */
// src/commands/show-leaderboard.js
const pugModel = require("../../models/pug-model");
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require("discord.js");

module.exports = {
	name: "show-leaderboard",
	description: "Display the PUG leaderboard sorted by ELO with pagination.",
	callback: async (client, interaction) => {
		const serverId = interaction.guild.id;

		let channel = interaction.channel;
		if (!channel) {
			return interaction.reply({
				content:
					"This command can only be run in the pug category text channels such as pug-chat or pug-que.",
				ephemeral: true,
			});
		}
		let category = channel.parent;
		if (!category) {
			return interaction.reply({
				content:
					"This command can only be run in the pug category text channels such as pug-chat or pug-que.",
				ephemeral: true,
			});
		}
		let categoryName = category.name;
		let baseCategoryName = categoryName.split(" ")[0]; // This will give you "5v5" if categoryName is "5v5 PUG#1"

		// Fetch the server PUG document
		const serverPug = await pugModel.findOne({
			serverId: interaction.guild.id,
			categoryIds: { $in: [interaction.channel.parentId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
		});

		if (
			!serverPug ||
			!serverPug.playerProfiles ||
			serverPug.playerProfiles.length === 0
		) {
			return interaction.reply({
				content: "No player profiles found for this category.",
				ephemeral: true,
			});
		}

		// Sort the playerProfiles by userELO in descending order
		const sortedProfiles = serverPug.playerProfiles.sort(
			(a, b) => b.userELO - a.userELO
		);

		let currentPage = 0;
		const itemsPerPage = 10;
		const totalPages = Math.ceil(sortedProfiles.length / itemsPerPage);

		// Adjusted function to generate embed with conditional emoji for the top player and first page
		const generateEmbed = (page) => {
			const start = page * itemsPerPage;
			const currentItems = sortedProfiles.slice(start, start + itemsPerPage);

			const embed = new EmbedBuilder()
				.setColor(0x0099ff) // A vibrant blue
				.setTitle(`🏆 PUG Leaderboard - ${baseCategoryName} 🏆`)
				.setDescription(`Page ${page + 1} of ${totalPages}`);

			// Add player fields with specific emojis based on their rank
			currentItems.forEach((profile, index) => {
				const rank = start + index + 1;
				let emoji = ""; // Default, no emoji
				if (page === 0) {
					// Only modify ranks on the first page
					if (rank === 1) {
						emoji = " 👑"; // Crown for the top player
					} else {
						emoji = " :star:"; // Stars for other players in the top list
					}
				}
				const name = `${rank}. ${profile.userTag}`;
				const value = `ELO: ${profile.userELO}${emoji}`; // Append the appropriate emoji

				embed.addFields({ name, value, inline: false });
			});

			embed.setFooter({ text: "👑 Who will rise to the top? 👑" });

			return embed;
		};

		// Function to generate buttons
		const generateButtons = (page) => {
			return new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId("previous_page")
					.setLabel("Previous")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(page === 0),
				new ButtonBuilder()
					.setCustomId("next_page")
					.setLabel("Next")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(page === totalPages - 1)
			);
		};

		const embedMessage = await interaction.reply({
			embeds: [generateEmbed(currentPage)],
			components: [generateButtons(currentPage)],
			fetchReply: true,
		});
		let inactivityTimer;

		// Resetting and setting up the inactivity timer
		const resetInactivityTimer = async () => {
			if (inactivityTimer) clearTimeout(inactivityTimer);
			inactivityTimer = setTimeout(async () => {
				await interaction
					.editReply({
						components: [],
					})
					.catch(console.error);
			}, 30000); // 30 seconds of inactivity
		};

		resetInactivityTimer(); // Initialize the timer when the message is first sent

		const filter = (i) => i.user.id === interaction.user.id;
		const collector = interaction.channel.createMessageComponentCollector({
			filter,
			time: 30000, // Set time to 30 seconds
		});

		collector.on("collect", async (i) => {
			if (i.customId === "previous_page") {
				currentPage = currentPage > 0 ? --currentPage : 0;
				resetInactivityTimer(); // Reset the timer on each interaction
			} else if (i.customId === "next_page") {
				currentPage =
					currentPage < totalPages - 1 ? ++currentPage : totalPages - 1;
				resetInactivityTimer(); // Reset the timer on each interaction
			}

			await i.update({
				embeds: [generateEmbed(currentPage)],
				components: [generateButtons(currentPage)],
			});
		});

		collector.on("end", (collected) => {
			if (collected.size === 0) {
				clearTimeout(inactivityTimer); // Clear the timer to clean up
				interaction
					.editReply({
						embeds: [generateEmbed(currentPage)],
						components: [],
					})
					.catch(console.error);
			}
		});
	},
};
