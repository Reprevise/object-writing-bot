import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { rollWordForServer } from "../utils/roll";
import { dbGetGuild } from "../db/db";

export default {
  data: new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll the new word now")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.inGuild()) {
      interaction.reply("Only works in a server!");

      return;
    }

    const guildOptions = dbGetGuild(interaction.guildId);
    if (!guildOptions || !guildOptions.channelId) {
      interaction.reply("Please run the /setup command before this!");

      return;
    }

    await interaction.reply("Rolling new word...");

    const word = await rollWordForServer(
      interaction.client,
      interaction.guildId
    );

    await interaction.editReply(`Rolled word: **${word}**`);
  },
};
