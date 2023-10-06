import * as v from "@badrap/valita";
import dayjs from "dayjs";

export const nullableDayjsSchema = v
  .number()
  .nullable()
  .chain((n) => {
    if (!n) return v.ok(null);

    const date = dayjs.utc(n);

    return v.ok(date);
  });
