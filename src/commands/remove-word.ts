import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { dbDeleteWord } from "../db/db";

export default {
  data: new SlashCommandBuilder()
    .setName("removeword")
    .setDescription("Removes a word from the word list")
    .addStringOption((option) =>
      option
        .setName("word")
        .setDescription("The word to remove from the list")
        .setRequired(true)
        .setMinLength(2)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  execute(interaction: ChatInputCommandInteraction): void {
    if (!interaction.inGuild()) {
      interaction.reply("Must be done in a server");

      return;
    }

    const word = interaction.options.getString("word", true);
    const didRemove = dbDeleteWord(interaction.guildId, word);
    if (!didRemove) {
      interaction.reply(
        `"${word}" was not in the word list so it wasn't removed`
      );

      return;
    }

    interaction.reply(`Removed "${word}" from the word list`);
  },
};
