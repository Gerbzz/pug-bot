const {
	ApplicationCommandOptionType,
	GuildChannelManager,
	ChannelType,
	Client,
	GatewayIntentBits,
	GuildVoiceState,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");

const pugQueEmbed = require("../../assets/embeds/pug-que-embed");
const { embed, components } = require("../../assets/embeds/pug-que-embed");

module.exports = {
	name: "add-pug-category",
	description:
		"Starts up the bot based on the options you selected and sets up environment!",
	options: [
		{
			name: "category_name",
			description: "The name of the category to create channels in.",
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "how-many-players-on-a-team",
			description:
				"How many players do you want a team for the bot setup? Example would be a team of 5 players",
			type: ApplicationCommandOptionType.Number,
			required: true,
		},
		{
			name: "how-many-teams-are-there",
			description:
				"How many teams do you want for the bot setup? Example... 2 teams total for a pug that is 5v5",
			type: ApplicationCommandOptionType.Number,
			required: true,
		},
	],
	callback: async (client, interaction) => {
		if (!interaction.isChatInputCommand()) return;

		console.log(interaction.commandName);

		if (interaction.commandName === "add-pug-category") {
			const categoryName = interaction.options.getString("category_name");

			const numOfPlayersPerTeam = interaction.options.get(
				"how-many-players-on-a-team"
			).value;

			const numOfTeamsPerPUG = interaction.options.get(
				"how-many-teams-are-there"
			).value;

			// Create the bot folders and channels
			const guild = interaction.member.guild;

			// Check for existing category
			guild.channels
				.fetch()
				.then((channels) => {
					if (
						!channels.find(
							(channel) =>
								channel.name === categoryName &&
								channel.type === ChannelType.GuildCategory
						)
					) {
						// Create the category
						guild.channels
							.create({
								name: categoryName,
								type: ChannelType.GuildCategory,
							})
							.then((createdCategory) => {
								const categoryID = createdCategory.id;

								// Check for existing voice and text channels
								const existingVoiceChannel = channels.find(
									(channel) =>
										channel.name === "pug-waiting-room" &&
										channel.parentID === categoryID
								);
								const existingTextChannel = channels.find(
									(channel) =>
										(channel.name === "pug-chat" &&
											channel.parentID === categoryID) ||
										(channel.name === "pug-que" &&
											channel.parentID === categoryID)
								);

								// Create voice channel if it doesn't exist
								if (!existingVoiceChannel) {
									guild.channels.create({
										name: "pug-waiting-room",
										type: ChannelType.GuildVoice,
										parent: categoryID,
									});
								}

								// Create text channel if it doesn't exist
								if (!existingTextChannel) {
									guild.channels.create({
										name: "pug-chat",
										type: ChannelType.GuildText,
										parent: categoryID,
									});
								}

								// Create pug-que text channel with specific permissions
								guild.channels
									.create({
										name: "pug-que",
										type: ChannelType.GuildText,
										parent: categoryID,
										overwrites: [
											{
												id: guild.id,
												deny: ["SEND_MESSAGES"], // Everyone can't send messages
											},
										],
									})
									.then((pugQueChannel) => {
										// Add reaction emojis for users to react to
										pugQueChannel.send({
											embeds: [embed],
											components: components,
										});
									})
									.catch(console.error);
							})
							.catch(console.error);
					} else {
						console.log(`Category "${categoryName}" already exists.`);
					}
				})
				.catch(console.error);

			interaction.reply(
				`You Selected... \nNumber of players on a team : ${numOfPlayersPerTeam} \nNumber of Teams per PUG: ${numOfTeamsPerPUG}`
			);
		}
	},
};
