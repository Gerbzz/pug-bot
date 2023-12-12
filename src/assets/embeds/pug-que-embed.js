// const {
// 	SlashCommandBuilder,
// 	MessageEmbed,
// 	ActionRowBuilder,
// 	ButtonBuilder,
// 	ButtonStyle,
// 	EmbedBuilder,
// } = require("discord.js");

// thumbnailUrl =
// 	"https://cdn.discordapp.com/attachments/549053891476455436/677649538214920217/black_bar_transparent.png1.png?ex=6584c2d0&is=65724dd0&hm=c832f28a000b02d7417a260a716a95e917e36ed3adae3db6bdeff92d14b6341a&";

// gifUrl = "https://media1.tenor.com/m/1YgYDAoufH0AAAAC/winditup-tiktok.gif";

// // pug-que embed for joining pugs.... First embed of the Program
// module.exports = {
// 	title: "Pug Queue",
// 	description: "React to join the pug queue!",
// 	image: {
// 		url: gifUrl,
// 	},
// 	thumbnail: { url: thumbnailUrl },
// 	fields: [
// 		{
// 			name: "Join Queue",
// 			value: "React with ✅ to join the pug queue.",
// 		},
// 		{
// 			name: "Leave Queue",
// 			value: "React with ❌ to leave the pug queue.",
// 		},
// 	],
// 	footer: {
// 		text: "Good luck, have fun!",
// 	},
// };

///// trying things....

// variables that i need to import...
// const numOfPlayersPerTeam = interaction.options.get(
//     "how-many-players-on-a-team"
// ).value;

// const numOfTeamsPerPUG = interaction.options.get(
//     "how-many-teams-are-there"
// ).value;

const {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");

const gifUrl =
	"https://media1.tenor.com/m/1YgYDAoufH0AAAAC/winditup-tiktok.gif";
const thumbnailUrl =
	"https://cdn.discordapp.com/attachments/549053891476455436/677649538214920217/black_bar_transparent.png1.png?ex=6584c2d0&is=65724dd0&hm=c832f28a000b02d7417a260a716a95e917e36ed3adae3db6bdeff92d14b6341a&";

let pugQueArray = [];

// Create the embed
const pugQueEmbed = new EmbedBuilder()
	.setTitle("Pug Queue")
	.setDescription("React to join the pug queue!")
	.setImage(gifUrl)
	.setThumbnail(thumbnailUrl)
	.addFields([
		{
			name: "Join Queue List",
			value: "help",
		},
	])
	.setFooter({ text: "Good luck, have fun!" });

// Create a button
const joinQueueButton = new ButtonBuilder()
	.setCustomId("joinQueue")
	.setLabel("Join Queue")
	.setStyle(ButtonStyle.Success);

const leaveQueueButton = new ButtonBuilder()
	.setCustomId("leaveQueue")
	.setLabel("Leave Queue")
	.setStyle(ButtonStyle.Danger);

// Create an action row to hold the button
const row = new ActionRowBuilder().addComponents(
	joinQueueButton,
	leaveQueueButton
);

module.exports = {
	embed: pugQueEmbed,
	components: [row],
};
