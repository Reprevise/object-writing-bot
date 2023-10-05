import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { dbAddWord } from "../db/db";

export default {
  data: new SlashCommandBuilder()
    .setName("addword")
    .setDescription("Adds a word to the word list")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("word")
        .setDescription("The word to add to the list")
        .setRequired(true)
        .setMinLength(2)
    )
    .setDMPermission(false),
  execute(interaction: ChatInputCommandInteraction): void {
    if (!interaction.inGuild()) {
      interaction.reply("Must be done in a server!");

      return;
    }

    const word = interaction.options.getString("word", true);
    const didAdd = dbAddWord(interaction.guildId, word);
    if (!didAdd) {
      interaction.reply(`"${word}" is already in the word list`);
      return;
    }

    interaction.reply(`Added "${word}" to the word list`);
  },
};
