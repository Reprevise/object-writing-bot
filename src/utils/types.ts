import * as v from "@badrap/valita";
import dayjs from "dayjs";

export const nullableDayjsSchema = v
  .number()
  .nullable()
  .chain((n) => {
    if (!n) return v.ok(null);

    const date = dayjs(n, { utc: true });

    return v.ok(date);
  });

// export const dateSchema = v.string().chain((str) => {
//   const date = new Date(str);

//   // If the date is invalid JS returns NaN here
//   if (isNaN(date.getTime())) {
//     return v.err(`Invalid date "${str}"`);
//   }

//   return v.ok(date);
// });
