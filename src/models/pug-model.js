/** @format */

// src/models/pug-model.js
const mongoose = require("mongoose");

const pugSchema = new mongoose.Schema({
	// serverId: interaction.guild.id,
	serverId: {
		type: Number,
		required: true,
	},
	categoryName: {
		type: String,
		required: true,
	},
	pugQueEmbedChannelId: {
		type: String,
		required: true,
	},
	pugQueEmbedMessageId: {
		type: String,
		required: true,
	},
	numOfPlayersPerTeam: {
		type: Number,
		required: true,
	},
	numOfTeamsPerPUG: {
		type: Number,
		required: true,
	},
	totalNumOfPlayersPerPUG: {
		type: Number,
		required: true,
	},
	pugFormat: {
		type: String,
		required: true,
	},
	queuedPlayers: {
		type: Array,
		required: false,
	},
	matchFoundPlayers: {
		type: Array,
		required: false,
	},
	acceptedMatchFoundPlayers: {
		type: Array,
		required: false,
	},
	onGoingPugs: {
		type: Array,
		required: false,
	},
	matchCounter: {
		type: Number,
		required: false,
	},
	readyCheckCounter: {
		type: Number,
		required: false,
	},
});

const pugModel = mongoose.model("pugModel", pugSchema);

module.exports = pugModel;
