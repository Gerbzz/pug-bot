// Assuming the embed structure is already defined somewhere
const { MessageEmbed } = require("discord.js");

// Function to update the queue list in the embed
function updateQueueListEmbed(queueArray) {
	// Convert the user tags in the queue array to a string, each separated by a newline
	const queueListString = queueArray.join("\n");

	// Create a new embed with updated queue information
	const updatedEmbed = new MessageEmbed()
		.setTitle("PUG Queue")
		.setDescription("Current players in the queue:")
		.addField(
			"Join Queue List",
			queueListString || "The queue is currently empty."
		);

	// Return the updated embed
	return updatedEmbed;
}

// Export the function
module.exports = { updateQueueListEmbed };

// You will need to call this function with the appropriate queue array whenever a user joins or leaves the queue
// For example:
// let updatedEmbed = updateQueueListEmbed(pug_que_arrays[categoryName]);
// interaction.update({ embeds: [updatedEmbed] }); // This will send the updated embed back to the channel
