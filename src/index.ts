import { CronJob } from "cron";
import { Collection, SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { BotClient } from "./client/client";
import { dbAddGuild, dbGetGuilds, dbRemoveGuild } from "./db/db";
import { BotCommand } from "./types/command";
import { BOT_TOKEN } from "./utils/env";
import { rollWordForServer } from "./utils/roll";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const botClient = new BotClient({ intents: ["Guilds"] });

new CronJob(
  "0 12 * * *", // noon every day in UTC time
  function () {
    const now = dayjs();

    for (const guild of dbGetGuilds()) {
      if (guild.lastManualRoll && guild.lastManualRoll.isSame(now, "day")) {
        continue;
      }

      rollWordForServer(botClient, guild.id);
    }
  },
  null, // no onComplete
  true, // start on init
  null, // not specifying timezone
  null, // no context needed
  null, // don't want to trigger onTick on init
  0 // 0 utc offset (we want UTC time)
);

// Register bot commands
botClient.commands = new Collection();
{
  const commandsPath = path.join(import.meta.dir, "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath).default as unknown;

    if (
      command &&
      typeof command === "object" &&
      "data" in command &&
      "execute" in command &&
      command.data instanceof SlashCommandBuilder
    ) {
      botClient.commands!.set(command.data.name, command as BotCommand);
    } else {
      console.warn(
        `Invalid schema in ${filePath} file, expected two fields: "data" and an "execute" method`
      );
    }
  }
}

botClient.on("ready", () => {
  console.log("Successfully logged on");
});

// On guild join
botClient.on("guildCreate", (g) => {
  dbAddGuild(g.id);
});

// On guild leave
botClient.on("guildDelete", (g) => {
  dbRemoveGuild(g.id);
});

botClient.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = botClient.commands!.get(interaction.commandName);

  if (!cmd) {
    return console.error(`Unable to find command, ${interaction.commandName}`);
  }

  try {
    await cmd.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}`, error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

botClient.login(BOT_TOKEN);
