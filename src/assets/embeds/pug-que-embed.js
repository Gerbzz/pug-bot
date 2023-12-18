// src/assets/embeds/pug-que-embed.js
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

// Function to create the embed
function pugQueEmbed() {
	return new EmbedBuilder()
		.setTitle("Pug Queue Interface!")
		.setDescription("Click the button below to join the queue!")
		.setImage(gifUrl)
		.setThumbnail(thumbnailUrl)
		.setFooter({ text: "Good luck, have fun!" });
}

// Create buttons
const joinQueueButton = new ButtonBuilder()
	.setCustomId("joinQueue")
	.setLabel("Join Queue")
	.setStyle(ButtonStyle.Success);

const leaveQueueButton = new ButtonBuilder()
	.setCustomId("leaveQueue")
	.setLabel("Leave Queue")
	.setStyle(ButtonStyle.Danger);

// Create an action row to hold the buttons
const row = new ActionRowBuilder().addComponents(
	joinQueueButton,
	leaveQueueButton
);

module.exports = {
	pugQueEmbed,
	components: [row],
};
