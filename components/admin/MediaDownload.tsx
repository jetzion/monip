"use client";

import { useFormFields } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

type FileProps = { url?: unknown; filename?: unknown };

/**
 * Link that saves the original uploaded file under its own name. Media URLs are on the site's
 * own domain (/api/media/file/...), so the browser honours the download attribute.
 */
function DownloadLink({ url, filename, label }: FileProps & { label: string }) {
  if (typeof url !== "string" || typeof filename !== "string") return null;
  return (
    <a
      href={url}
      download={filename}
      className="media-download"
      title={`Download ${filename}`}
      // In the list, a click on a row cell would also open the item.
      onClick={(event) => event.stopPropagation()}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </a>
  );
}

/** Download button in a media item's sidebar (shown once the file is saved). */
export function MediaDownloadField() {
  const file = useFormFields(([fields]) => ({ url: fields.url?.value, filename: fields.filename?.value }));
  return (
    <div className="media-download-field">
      <DownloadLink {...file} label="Download original" />
    </div>
  );
}

/** Download link in each row of the Media list. */
export function MediaDownloadCell({ rowData }: DefaultCellComponentProps) {
  return <DownloadLink url={rowData?.url} filename={rowData?.filename} label="Download" />;
}
