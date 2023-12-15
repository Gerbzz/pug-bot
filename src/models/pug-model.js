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
	pug_que_arrays: {
		type: Object,
		required: true,
	},
	pugStateArray: {
		type: Array,
		required: true,
	},
	matchCounter: {
		type: Number,
		required: false,
	},
});

const pugModel = mongoose.model("pugModel", pugSchema);

module.exports = pugModel;
