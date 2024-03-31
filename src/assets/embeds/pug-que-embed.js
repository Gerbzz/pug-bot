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
	"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2h3amxpMndoNXgwa29kNmg5eHZ1cnppZzBqYXd0YmNtMHQ0aWIxbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/pTEwHiQ057XVK/giphy.gif";
const thumbnailUrl =
	"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzJqeDJxYTQ3aXU5N3E1cHR2bnVrZTR3MXMzc3I4c3NrY2N1cHUydSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xUPGcLvo0MIkriPh2o/giphy.gif";

// add the doc from the database to the function parameters

// Function to create the embed
function pugQueEmbed(doc) {
	const queuedPlayersDisplay =
		doc.queuedPlayers.map((player) => player.userTag).join("\n") || "No one";
	return new EmbedBuilder()
		.setTitle("Pug Queue Interface!")
		.setColor(0x0099ff)
		.setFields([
			{
				name: "Players Queued",
				value: doc.queuedPlayers.length.toString(),
				inline: true,
			},
			{
				name: "Players Needed:",
				value: doc.totalNumOfPlayersPerPUG.toString(),
				inline: true,
			},
			{
				name: "Who's Queued:",
				value: queuedPlayersDisplay,
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
	.setStyle(ButtonStyle.Primary);

const leaveQueueButton = new ButtonBuilder()
	.setCustomId("leaveQueue")
	.setLabel("Leave Queue")
	.setStyle(ButtonStyle.Secondary);

// Create an action row to hold the buttons
const row = new ActionRowBuilder().addComponents(
	joinQueueButton,
	leaveQueueButton
);

module.exports = {
	pugQueEmbed,
	pugQueComponents: [row],
};
