import * as v from "@badrap/valita";
import { nullableDayjsSchema } from "../utils/types";

export const wordSchema = v.object({
  word: v.string(),
  lastUsed: nullableDayjsSchema,
});

export type Word = v.Infer<typeof wordSchema>;
