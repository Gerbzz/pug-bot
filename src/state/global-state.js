// src/state/globalState.js
let state = {
	categoryName: "",
	numOfPlayersPerTeam: 0,
	numOfTeamsPerPUG: 0,
	totalNumOfPlayersPerPUG: 0,
	pugFormat: "",
	pug_que_arrays: {},
	matchCounter: 1,

	// Other global states
};

module.exports = {
	getState: () => state,
	setState: (newState) => {
		state = { ...state, ...newState };
	},
};
