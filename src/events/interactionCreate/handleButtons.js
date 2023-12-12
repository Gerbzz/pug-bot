// events/interactionCreate/handleButtons.js

module.exports = async (client, interaction) => {
	if (!interaction.isButton()) return;

	if (interaction.customId === "joinQueue") {
		// Your button handling logic goes here.
		// This is where you would manage the queue and update the embed.
		interaction.reply("that green button tickles! stawp it!");
	}
	if (interaction.customId === "leaveQueue") {
		// Your button handling logic goes here.
		// This is where you would manage the queue and update the embed.
		interaction.reply("that red button tickles! stawp it!");
	}

	// You can add more conditions for other buttons here.
};
