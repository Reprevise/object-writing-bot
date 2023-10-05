import { Client, Collection } from "discord.js";
import { BotCommand } from "../types/command";

/// This class is made just to add the [commands] property
export class BotClient extends Client {
  commands?: Collection<string, BotCommand>;
}
