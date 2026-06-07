import { z } from "zod";

/** String opcional: "" vira undefined; faz trim. */
export const optStr = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().optional(),
);

/** Número opcional: "" / null viram undefined. */
export const optNum = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().optional(),
);

/** UUID opcional: "" vira undefined. */
export const optUuid = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.uuid().optional(),
);

/** Número inteiro obrigatório e positivo. */
export const reqIntPos = z.coerce.number().int().positive();
