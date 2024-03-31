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
	categoryIds: [
		{
			type: String,
			required: true,
		},
	],
	modChannelId: {
		type: String,
		required: false,
	},
	modChannelMessageId: {
		type: String,
		required: false,
	},
	howToPugChannelId: {
		type: String,
		required: false,
	},
	howToPugEmbedMessageId: {
		type: String,
		required: false,
	},
	pugQueEmbedChannelId: {
		type: String,
		required: false,
	},
	pugQueEmbedMessageId: {
		type: String,
		required: false,
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
	onGoingPugs: [
		{
			matchCounter: Number,
			players: Array,
			matchRoomEmbedChannelId: String,
			matchRoomEmbedMessageId: String,
			teamVoiceChannelIds: Array,
			matchCategoryId: String,
			matchRoomChannelId: String,
			pugStatus: {
				type: String,
				default: "active",
			},
			teams: [
				{
					name: String,
					players: Array, // of userTags // interaction.user.tag
				},
			],
			results: {
				winningTeamIndex: { type: Number, default: -1 }, // Use -1 to indicate no winner has been decided yet
				reports: [
					// Redefine 'reports' to store each vote as an object
					{
						userId: String,
						userTag: String,
						votedForTeam: Number, // Stores the index of the team for which the vote was cast
						// Additional fields can be added here if necessary, e.g., timestamp
					},
				],
			},
		},
	],

	matchCounter: {
		type: Number,
		required: false,
	},
	readyCheckCounter: {
		type: Number,
		required: false,
	},
	playerProfiles: [
		{
			userId: String,
			userTag: String,
			userQueueDuration: Number, // in minutes
			userELO: Number,
			wins: Number,
			losses: Number,
			isEligibleToQueue: { type: Boolean, default: true },
			// Any other fields you need...
		},
	],
});

const pugModel = mongoose.model("pugModel", pugSchema);

module.exports = pugModel;
