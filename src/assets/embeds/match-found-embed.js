const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require("discord.js");

const thumbnailUrl =
	"https://cdn.discordapp.com/attachments/549053891476455436/677649538214920217/black_bar_transparent.png1.png?ex=6584c2d0&is=65724dd0&hm=c832f28a000b02d7417a260a716a95e917e36ed3adae3db6bdeff92d14b6341a&";

// fix this later
// let doc = await pugModel.findOne({
// 	serverId: interaction.guild.id,
// 	categoryName: categoryName,
// });

// let queuedPlayers = doc.queuedPlayers;

// Create the embed
function matchFoundEmbed() {
	return new EmbedBuilder()
		.setThumbnail(thumbnailUrl)
		.setTitle("Match Found Interface!")
		.setDescription("Click the Buttons Below to Accept or Decline the Match.")
		.setColor(0x2a2d31);
}

// Create the button
const acceptMatchButton = new ButtonBuilder()
	.setCustomId("acceptMatchButton")
	.setLabel("Accept Match")
	.setStyle(ButtonStyle.Success);

const declineMatchButton = new ButtonBuilder()
	.setCustomId("declineMatchButton")
	.setLabel("Decline Match")
	.setStyle(ButtonStyle.Danger);

// Create an action row and add the button to it
const row = new ActionRowBuilder().addComponents(
	acceptMatchButton,
	declineMatchButton
);

// Export the embed and components
module.exports = {
	matchFoundEmbed,
	// replace components with matchFoundComponents
	matchFoundComponents: [row],
};
