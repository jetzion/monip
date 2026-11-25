import type {
  CollectionAfterChangeHook,
  CollectionAfterOperationHook,
  CollectionBeforeOperationHook,
  PayloadRequest,
} from "payload";

/**
 * Temporary: logs each step of a media upload, to find where some uploads hang until the
 * 300 s function timeout. The last step logged for a hung request shows where it stopped.
 */
export function logUploadStep(req: PayloadRequest, step: string) {
  const file = req.file?.name ?? "";
  req.payload.logger.info(`[upload] ${step}${file ? ` (${file})` : ""}`);
}

/** Runs after Payload has read the uploaded file back from Blob. */
export const logUploadStart: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if ((operation === "create" || operation === "update") && req.file) logUploadStep(req, `${operation}: file read`);
  return args;
};

export const logUploadSaved: CollectionAfterChangeHook = ({ doc, req }) => {
  if (req.file) logUploadStep(req, `saved #${doc.id}`);
  return doc;
};

export const logUploadDone: CollectionAfterOperationHook = ({ operation, req, result }) => {
  if (operation === "create" || operation === "updateByID") logUploadStep(req, `${operation}: done`);
  return result;
};
