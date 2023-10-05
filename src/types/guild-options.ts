import * as v from "@badrap/valita";
import { nullableDayjsSchema } from "../utils/types";

export const guildOptionsSchema = v.object({
  id: v.string(),
  channelId: v.string().nullable(),
  lastManualRoll: nullableDayjsSchema,
});

export type GuildOptions = v.Infer<typeof guildOptionsSchema>;
