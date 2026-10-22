import config from "@payload-config";
import { getPayload } from "payload";

/** Shared Payload Local API instance (cached by Payload). */
export const getPayloadClient = () => getPayload({ config });

/** Returns a populated relationship, or null when only an ID came back. */
export const populated = <T extends object>(value: number | T | null | undefined): T | null =>
  typeof value === "object" && value !== null ? value : null;
