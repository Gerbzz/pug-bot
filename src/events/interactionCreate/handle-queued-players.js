/** @format */

// src/events/interactionCreate/handle-queued-players.js
const {
	ChannelType,
	PermissionsBitField,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const mongoose = require("mongoose");
const pugModel = require("../../models/pug-model");

const { initiateReadyCheck } = require("../../utils/async-functions");

const {
	matchFoundEmbed,
	matchFoundComponents,
} = require("../../assets/embeds/match-found-embed");

const {
	pugQueEmbed,
	pugQueComponents,
} = require("../../assets/embeds/pug-que-embed");

module.exports = async (client, interaction) => {
	// *****************************************
	// Section : Initilize Variables
	// initilize the variables to be used throughout the code
	// *****************************************

	let channel = interaction.channel;
	if (!channel) {
		console.error(
			"The interaction does not have an associated channel.".yellow
		);
		return;
	}
	let category = channel.parent;
	if (!category) {
		console.error("The channel does not have an associated category.".yellow);
		return;
	}

	let categoryName = category.name;
	let baseCategoryName = categoryName.split(" ")[0]; // This will give you "5v5" if categoryName is "5v5 PUG#1"

	// Before accessing parentId, ensure that the channel and its parent exist
	if (!interaction.channel || !interaction.channel.parentId) {
		console.log("Channel or parent category does not exist.");
		return; // Exit the function if there's no channel or parent
	}

	// Proceed with your existing logic now that you've ensured the parentId exists
	const currentCategoryId = interaction.channel.parentId;

	// Your existing code continues from here...

	const doc = await pugModel.findOne({
		serverId: interaction.guild.id,
		categoryIds: { $in: [currentCategoryId] }, // Use $in operator to find if currentCategoryId exists in categoryIds array
	});

	console.log("Server ID:", interaction.guild.id);
	console.log("Current Category ID:", interaction.channel.parentId);
	if (!doc) {
		console.log(
			`No Doc Just yet waiting for the doc to be created for ${categoryName} PUG!`
				.yellow
		);
		return;
	}
	let queuedPlayers = doc.queuedPlayers;
	let matchFoundPlayers = doc.matchFoundPlayers;
	let acceptedMatchFoundPlayers = doc.acceptedMatchFoundPlayers;
	let totalNumOfPlayersPerPUG = doc.totalNumOfPlayersPerPUG;

	// **********************************************************************************
	// Section : Enough Players To Start Pug Logic (Full Queue)
	// **********************************************************************************
	// totalNumOfPlayersPerPUG = user input
	// if (queuedPlayers.length >= totalNumOfPlayersPerPUG) {
	if (
		queuedPlayers.length >= totalNumOfPlayersPerPUG &&
		!doc.matchFoundEmbedChannelId
	) {
		let guild = interaction.guild;

		await initiateReadyCheck(
			client,
			guild,
			interaction,
			doc,
			pugQueEmbed,
			matchFoundEmbed,
			matchFoundComponents,
			matchFoundPlayers,
			acceptedMatchFoundPlayers,
			categoryName,
			baseCategoryName
		);
	}
};
