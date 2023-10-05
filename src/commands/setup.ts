import {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  ComponentType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { dbAddGuild, dbAddOrUpdateWritingChannel } from "../db/db";

export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup Object Writing Bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild()) {
      interaction.reply("Only works in a server!");

      return;
    }

    dbAddGuild(interaction.guildId);

    const channelInput = new ChannelSelectMenuBuilder()
      .setCustomId("channelInput")
      .setPlaceholder("Forum channel for the bot to use")
      .setChannelTypes(ChannelType.GuildText);

    const firstActionRow =
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        channelInput
      );

    const response = await interaction.reply({
      content: "Select forum channel",
      components: [firstActionRow],
    });

    try {
      const confirmation = await response.awaitMessageComponent({
        filter: (i) => i.user.id === interaction.user.id,
        componentType: ComponentType.ChannelSelect,
        time: 60 * 1000, // one minute
      });

      if (confirmation.customId === "channelInput") {
        const channel = confirmation.values[0];
        dbAddOrUpdateWritingChannel(interaction.guildId, channel);

        await confirmation.update({
          content: "Set object writing channel successfully!",
          components: [],
        });
      } else {
        await confirmation.update({
          content: "Something went wrong",
          components: [],
        });
      }
    } catch (error) {
      await interaction.editReply({
        content: "Object writing setup timed-out, please run /setup again.",
        components: [],
      });
    }
  },
};
