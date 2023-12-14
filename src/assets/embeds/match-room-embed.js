const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require("discord.js");

const thumbnailUrl =
	"https://cdn.discordapp.com/attachments/549053891476455436/677649538214920217/black_bar_transparent.png1.png?ex=6584c2d0&is=65724dd0&hm=c832f28a000b02d7417a260a716a95e917e36ed3adae3db6bdeff92d14b6341a&";

// Create the embed
function createMatchRoomEmbed() {
	return new EmbedBuilder()
		.setThumbnail(thumbnailUrl)
		.setTitle("Match Room Interface!")
		.setDescription("Click the button below if you need a substitute player.")
		.setColor(0x2f3136);
}

// Create the button
const subButton = new ButtonBuilder()
	.setCustomId("substitute")
	.setLabel("Sub Button")
	.setStyle(ButtonStyle.Primary);

// Create an action row and add the button to it
const row = new ActionRowBuilder().addComponents(subButton);

// Export the embed and components
module.exports = {
	createMatchRoomEmbed,
	components: [row],
};
