/** @format */

// src/assets/embeds/pug-que-embed.js
const {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");

const pugModel = require("../../models/pug-model");

const gifUrl =
	"https://media1.tenor.com/m/1YgYDAoufH0AAAAC/winditup-tiktok.gif";
const thumbnailUrl =
	"https://cdn.discordapp.com/attachments/549053891476455436/677649538214920217/black_bar_transparent.png1.png?ex=6584c2d0&is=65724dd0&hm=c832f28a000b02d7417a260a716a95e917e36ed3adae3db6bdeff92d14b6341a&";

// add the doc from the database to the function parameters

// Function to create the embed
function pugQueEmbed(doc) {
	return new EmbedBuilder()
		.setTitle("Pug Queue Interface!")
		.setFields([
			{
				name: "Players Queued",
				value: doc.queuedPlayers.length.toString() || "No one",
				inline: true,
			},
			{
				name: "Players Needed:",
				value: doc.totalNumOfPlayersPerPUG.toString(),
				inline: true,
			},
			{
				name: "Who's Queued:",
				value: doc.queuedPlayers.join("\n") || "No one",
			},
		])
		.setDescription(`Join the queue by clicking the button below!`)
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
