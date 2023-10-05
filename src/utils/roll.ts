import { Channel, Client, TextChannel } from "discord.js";
import {
  dbGetGuild,
  dbGetRandomWord,
  dbUpdateWordLastUsed
} from "../db/db";
import { ordinalSuffixOf } from "./number";

export async function rollWordForServer(client: Client, guildId: string): Promise<string | undefined> {
  const options = dbGetGuild(guildId);

  if (!options || !options.channelId) return;

  const channelId = options.channelId;

  var channel: Channel;
  const cachedChannel = client.channels.cache.get(channelId);
  if (cachedChannel) {
    channel = cachedChannel;
  } else {
    const fetchedChannel = await client.channels.fetch(channelId);
    if (!fetchedChannel) return;

    channel = fetchedChannel;
  }

  if (!(channel instanceof TextChannel)) return;

  const { word } = dbGetRandomWord(guildId);
  dbUpdateWordLastUsed(guildId, word);

  const now = new Date();
  const month = now.toLocaleDateString("default", { month: "long" });
  const dayWithOrdinal = ordinalSuffixOf(now.getDate());

  channel.threads.create({
    name: `${word} - ${month} ${dayWithOrdinal} - Object Writing`,
  });

  return word;
}
