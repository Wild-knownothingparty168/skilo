import { useState } from "react";
import { Link } from "react-router-dom";
import type { CatalogEntry } from "../api/skilo";
import { CopyIcon, ExternalLinkIcon } from "./icons";

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded px-3 py-1.5 text-sm font-medium text-[#0a1a1a] whitespace-nowrap bg-emerald-100 shadow-[0_2px_0_0_#6ee7b7] active:translate-y-px active:shadow-[0_1px_0_0_#34d399] transition-[transform,box-shadow] duration-75 cursor-pointer select-none";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-300 hover:text-black";

function sourceLabel(sourceKind: CatalogEntry["sourceKind"]): string {
  switch (sourceKind) {
    case "skilo":
      return "Native";
    case "github":
      return "Repo-backed";
    case "skills_sh":
      return "skills.sh";
    case "snapshot":
      return "Snapshot";
    default:
      return sourceKind;
  }
}

function publisherTone(publisherStatus: NonNullable<CatalogEntry["trust"]>["publisherStatus"]) {
  if (publisherStatus === "verified") {
    return "bg-emerald-50 text-emerald-600 ring-emerald-200";
  }
  if (publisherStatus === "claimed") {
    return "bg-blue-50 text-blue-600 ring-blue-200";
  }
  return "bg-stone-100 text-stone-500 ring-stone-200";
}

function auditTone(auditStatus: NonNullable<CatalogEntry["trust"]>["auditStatus"]) {
  if (auditStatus === "blocked") {
    return "bg-red-50 text-red-600 ring-red-200";
  }
  if (auditStatus === "warning") {
    return "bg-amber-50 text-amber-600 ring-amber-200";
  }
  return "bg-stone-100 text-stone-500 ring-stone-200";
}

export default function CatalogCard({
  entry,
  added,
  onAdd,
}: {
  entry: CatalogEntry;
  added?: boolean;
  onAdd?: (entry: CatalogEntry) => void;
}) {
  const [copied, setCopied] = useState(false);
  const installCommand = `npx skilo-cli add ${entry.installRef}`;
  const trust = entry.trust;

  const secondaryAction =
    entry.sourceKind === "skilo" ? (
      <Link to={`/u/${entry.owner}`} className={SECONDARY_BTN}>
        Profile
      </Link>
    ) : entry.pageUrl ? (
      <a
        href={entry.pageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={SECONDARY_BTN}
      >
        Source
        <ExternalLinkIcon className="h-3.5 w-3.5" />
      </a>
    ) : null;

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-stone-500">
          {sourceLabel(entry.sourceKind)}
        </span>
        {trust && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs ring-1 ring-inset ${publisherTone(
              trust.publisherStatus
            )}`}
          >
            {trust.publisherStatus}
          </span>
        )}
        {trust && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs ring-1 ring-inset ${auditTone(
              trust.auditStatus
            )}`}
          >
            {trust.auditStatus === "clean"
              ? "audit clean"
              : `audit ${trust.auditStatus}`}
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="text-sm text-stone-400">{entry.owner}</p>
        <h2 className="text-lg font-medium tracking-[-0.02em] text-black">
          {entry.name}
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          {entry.description || "Portable agent skill."}
        </p>
      </div>

      {trust?.capabilities && trust.capabilities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {trust.capabilities.slice(0, 4).map((capability) => (
            <span
              key={capability}
              className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-600 ring-1 ring-inset ring-blue-200"
            >
              {capability}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(installCommand);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className={PRIMARY_BTN}
        >
          <CopyIcon className="h-4 w-4" />
          {copied ? "Copied" : "Copy install"}
        </button>

        {onAdd && (
          <button
            type="button"
            onClick={() => onAdd(entry)}
            disabled={added}
            className={`${SECONDARY_BTN} ${added ? "cursor-default opacity-50 hover:border-stone-200 hover:text-stone-700" : ""}`}
          >
            {added ? "In pack" : "Add to pack"}
          </button>
        )}

        {secondaryAction}
      </div>

      <code className="mt-3 block overflow-hidden text-ellipsis whitespace-nowrap rounded-lg bg-stone-100 px-3 py-2 font-mono text-[12px] text-stone-600">
        {installCommand}
      </code>
    </article>
  );
}
