import { REST, Routes, SlashCommandBuilder } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { APP_ID, BOT_TOKEN } from "../src/utils/env";

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join(import.meta.dir, "../src/commands");
const commandFiles = fs.readdirSync(commandsPath);

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath).default as unknown;

  if (
    typeof command === "object" &&
    command &&
    "data" in command &&
    command.data instanceof SlashCommandBuilder &&
    "execute" in command
  ) {
    commands.push(command.data.toJSON());
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(BOT_TOKEN);

// and deploy your commands!
try {
  console.log(
    `Started refreshing ${commands.length} application (/) commands.`
  );

  // The put method is used to fully refresh all commands in the guild with the current set
  const data = await rest.put(Routes.applicationCommands(APP_ID), {
    body: commands,
  });

  if (
    typeof data === "object" &&
    data &&
    "length" in data &&
    typeof data.length === "number"
  ) {
    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  }
} catch (error) {
  // And of course, make sure you catch and log any errors!
  console.error(error);
}
