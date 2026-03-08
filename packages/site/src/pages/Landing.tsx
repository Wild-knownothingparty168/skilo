import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { CopyIcon } from "../components/icons";
import { api, type CatalogEntry } from "../api/skilo";
import CatalogCard from "../components/CatalogCard";
import {
  addPackTrayItem,
  readPackTray,
  type PackTrayItem,
  writePackTray,
} from "../lib/pack-tray";
import {
  Claude,
  Codex,
  Cursor,
  Amp,
  Windsurf,
  OpenCode,
  Cline,
  RooCode,
  OpenClaw,
} from "@lobehub/icons";

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded px-3 py-1.5 text-sm font-medium text-[#0a1a1a] whitespace-nowrap bg-emerald-100 shadow-[0_2px_0_0_#6ee7b7] active:translate-y-px active:shadow-[0_1px_0_0_#34d399] transition-[transform,box-shadow] duration-75 cursor-pointer select-none";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-300 hover:text-black";

type SourceLine = {
  ref: string;
  label: string;
  nav?: string;
};

function normalizeSourceLine(raw: string): SourceLine | null {
  const trimmed = raw.trim().replace(/^[-*]\s+/, "");
  if (!trimmed) {
    return null;
  }

  const bare = trimmed.replace(/^https?:\/\/(www\.)?/i, "");
  const shareMatch = bare.match(/^skilo\.xyz\/s\/([a-zA-Z0-9_-]+)/);
  if (shareMatch) {
    return {
      ref: `https://skilo.xyz/s/${shareMatch[1]}`,
      label: shareMatch[1],
      nav: `/s/${shareMatch[1]}`,
    };
  }

  const packMatch = bare.match(/^skilo\.xyz\/p\/([a-zA-Z0-9_-]+)/);
  if (packMatch) {
    return {
      ref: `https://skilo.xyz/p/${packMatch[1]}`,
      label: packMatch[1],
      nav: `/p/${packMatch[1]}`,
    };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return { ref: trimmed, label: trimmed.replace(/^https?:\/\//i, "") };
  }

  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:@[^/\s]+|:.+)?$/.test(trimmed)) {
    return { ref: trimmed, label: trimmed };
  }

  return null;
}

function parseSourceInput(raw: string): SourceLine[] {
  return raw
    .split(/\n/)
    .map((line) => normalizeSourceLine(line))
    .filter((value): value is SourceLine => value !== null);
}

function itemSourceLabel(sourceKind: CatalogEntry["sourceKind"]) {
  if (sourceKind === "skilo") return "Native";
  if (sourceKind === "skills_sh") return "skills.sh";
  if (sourceKind === "github") return "Repo-backed";
  return "Snapshot";
}

function Landing() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [stats, setStats] = useState<{ skills: number; installs: number } | null>(null);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolvedEntry, setResolvedEntry] = useState<CatalogEntry | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [trayItems, setTrayItems] = useState<PackTrayItem[]>(() => readPackTray());
  const [packing, setPacking] = useState(false);
  const [installCopied, setInstallCopied] = useState(false);

  const deferredInput = useDeferredValue(input.trim());
  const sourceLines = useMemo(() => parseSourceInput(input), [input]);
  const nonEmptyLines = useMemo(
    () => input.split(/\n/).map((line) => line.trim()).filter(Boolean),
    [input]
  );
  const sourceMode = nonEmptyLines.length > 0 && sourceLines.length === nonEmptyLines.length;
  const directSource = sourceMode && sourceLines.length === 1 ? sourceLines[0] : null;
  const catalogQuery = sourceMode ? "" : deferredInput;
  const trayRefs = useMemo(
    () => new Set(trayItems.map((item) => item.canonicalRef)),
    [trayItems]
  );

  useEffect(() => {
    writePackTray(trayItems);
  }, [trayItems]);

  useEffect(() => {
    api.getStats().then((nextStats) => {
      if (nextStats.skills > 0 || nextStats.installs > 0) {
        setStats(nextStats);
      }
    });
  }, []);

  useEffect(() => {
    const element = inputRef.current;
    if (!element) {
      return;
    }
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
  }, [input]);

  useEffect(() => {
    let cancelled = false;
    setLoadingCatalog(true);
    setCatalogError(null);

    api
      .getCatalog(catalogQuery, 24)
      .then((result) => {
        if (cancelled) {
          return;
        }
        startTransition(() => {
          setCatalog(result.entries);
          setCatalogError(null);
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setCatalogError(error instanceof Error ? error.message : "Failed to load catalog");
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingCatalog(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [catalogQuery]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setResolveError(null);

    if (!input.trim()) {
      return;
    }

    if (sourceMode && sourceLines.length > 1) {
      setPacking(true);
      try {
        const pack = await api.createRefPack(sourceLines.map((line) => line.ref));
        navigate(`/p/${pack.token}`);
      } catch (error) {
        setResolveError(error instanceof Error ? error.message : "Failed to create pack");
      } finally {
        setPacking(false);
      }
      return;
    }

    if (directSource?.nav) {
      navigate(directSource.nav);
      return;
    }

    if (directSource) {
      setResolving(true);
      try {
        const result = await api.resolveSource(directSource.ref);
        if (!result.entry) {
          setResolvedEntry(null);
          setResolveError("Could not resolve that source.");
          return;
        }
        setResolvedEntry(result.entry);
      } catch (error) {
        setResolvedEntry(null);
        setResolveError(error instanceof Error ? error.message : "Failed to resolve source");
      } finally {
        setResolving(false);
      }
      return;
    }

    setResolvedEntry(null);
  }

  function addToTray(entry: CatalogEntry) {
    setTrayItems((current) => addPackTrayItem(current, entry));
  }

  function removeFromTray(canonicalRef: string) {
    setTrayItems((current) =>
      current.filter((item) => item.canonicalRef !== canonicalRef)
    );
  }

  async function createPackFromTray() {
    if (trayItems.length === 0 || packing) {
      return;
    }
    setPacking(true);
    try {
      const pack = await api.createRefPack(trayItems.map((item) => item.installRef));
      navigate(`/p/${pack.token}`);
    } catch (error) {
      setResolveError(error instanceof Error ? error.message : "Failed to create pack");
    } finally {
      setPacking(false);
    }
  }

  function clearTray() {
    setTrayItems([]);
  }

  const heroActionLabel =
    sourceMode && sourceLines.length > 1
      ? packing
        ? "Packing..."
        : `Pack ${sourceLines.length}`
      : directSource?.nav
        ? "Open"
        : directSource
          ? resolving
            ? "Resolving..."
            : "Resolve"
          : "Search";

  return (
    <main className="mx-auto flex max-w-[920px] flex-col gap-10 p-5 pb-20 pt-28 lg:p-10 lg:pb-32 lg:pt-36">
      <section className="grid gap-8 lg:grid-cols-[1.25fr_0.85fr] lg:items-start">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-stone-400">
              Unified skill layer
            </p>
            <h1 className="mt-3 max-w-[14ch] text-[38px] font-medium tracking-[-0.045em] text-black lg:text-[52px]">
              Find, collect, install, and share agent skills.
            </h1>
            <p className="mt-4 max-w-[56ch] text-[16px] leading-7 text-stone-600">
              Skilo fronts the ecosystem. Search native skills, public repo-backed
              skills, and skills.sh entries, then turn the exact setup you want
              into one installable pack.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setResolveError(null);
                setResolvedEntry(null);
              }}
              rows={1}
              spellCheck={false}
              placeholder="Search skills, or paste a Skilo, GitHub, or skills.sh link"
              className="min-h-[56px] w-full resize-none overflow-hidden rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[15px] leading-7 text-black outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 focus:bg-white"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={packing || resolving}
                className={`${PRIMARY_BTN} disabled:cursor-default disabled:opacity-60`}
              >
                {heroActionLabel}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText("npx skilo-cli");
                  setInstallCopied(true);
                  setTimeout(() => setInstallCopied(false), 1500);
                }}
                className={SECONDARY_BTN}
              >
                <CopyIcon className="h-4 w-4" />
                {installCopied ? "Copied" : "Copy CLI"}
              </button>
              <code className="rounded-lg bg-stone-100 px-3 py-2 font-mono text-[12px] text-stone-600">
                npx skilo-cli
              </code>
            </div>

            <p className="mt-3 text-sm text-stone-500">
              Paste one source to resolve it, multiple sources to turn them into a pack, or plain text to search the public catalog.
            </p>

            {resolveError && (
              <p className="mt-3 text-sm text-red-600">{resolveError}</p>
            )}
          </form>

          {resolvedEntry && (
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-black">Resolved source</p>
                <button
                  type="button"
                  onClick={() => addToTray(resolvedEntry)}
                  className="text-sm text-stone-500 underline decoration-stone-300 underline-offset-[2.5px] hover:text-black"
                >
                  Add to pack
                </button>
              </div>
              <CatalogCard
                entry={resolvedEntry}
                added={trayRefs.has(resolvedEntry.canonicalRef)}
                onAdd={addToTray}
              />
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-stone-950 p-5 text-stone-100 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.65)]">
          <div className="flex items-center justify-between">
            <p className="text-sm uppercase tracking-[0.2em] text-stone-400">
              Pack tray
            </p>
            <span className="rounded-full bg-stone-800 px-2.5 py-1 text-xs text-stone-300">
              {trayItems.length} item{trayItems.length !== 1 ? "s" : ""}
            </span>
          </div>

          {trayItems.length === 0 ? (
            <p className="text-sm leading-6 text-stone-400">
              Browse the public catalog, add anything useful, then create one pack
              link for your team or other agents.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {trayItems.map((item) => (
                  <div
                    key={item.canonicalRef}
                    className="rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-stone-100">
                          {item.owner}/{item.name}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-stone-400">
                          {item.description || "Portable agent skill."}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] uppercase tracking-[0.14em] text-stone-400">
                            {itemSourceLabel(item.sourceKind)}
                          </span>
                          {item.trust?.auditStatus && (
                            <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] text-stone-300">
                              {item.trust.auditStatus}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromTray(item.canonicalRef)}
                        className="text-xs text-stone-500 transition-colors hover:text-stone-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={createPackFromTray}
                  disabled={packing}
                  className={`${PRIMARY_BTN} disabled:cursor-default disabled:opacity-60`}
                >
                  {packing ? "Packing..." : `Create pack`}
                </button>
                <button type="button" onClick={clearTray} className={SECONDARY_BTN}>
                  Clear
                </button>
              </div>
            </>
          )}

          {stats && (
            <p className="text-xs tabular-nums text-stone-500">
              {stats.skills.toLocaleString()} native skills
              <span className="mx-1.5 text-stone-700">/</span>
              {stats.installs.toLocaleString()} installs
            </p>
          )}
        </aside>
      </section>

      <section className="grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-stone-400">
              Public catalog
            </p>
            <h2 className="mt-2 text-[26px] font-medium tracking-[-0.03em] text-black">
              {catalogQuery ? `Results for “${catalogQuery}”` : "Latest native and discovered skills"}
            </h2>
          </div>
          <p className="max-w-[38ch] text-sm leading-6 text-stone-500">
            Native Skilo publishes and external public refs live together here.
            Add any mix of them to your pack tray.
          </p>
        </div>

        {loadingCatalog ? (
          <div className="rounded-2xl border border-dashed border-stone-200 px-5 py-6 text-sm text-stone-500">
            Loading catalog&hellip;
          </div>
        ) : catalogError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700">
            {catalogError}
          </div>
        ) : catalog.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 px-5 py-6 text-sm text-stone-500">
            No skills matched that query yet.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {catalog.map((entry) => (
              <CatalogCard
                key={entry.id}
                entry={entry}
                added={trayRefs.has(entry.canonicalRef)}
                onAdd={addToTray}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="overflow-hidden rounded-2xl border border-stone-800/80 shadow-lg shadow-stone-900/5">
          <div className="flex items-center gap-1.5 border-b border-stone-800/60 bg-stone-900 px-4 py-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-stone-700" />
            <div className="h-2.5 w-2.5 rounded-full bg-stone-700" />
            <div className="h-2.5 w-2.5 rounded-full bg-stone-700" />
          </div>
          <div className="bg-stone-950 px-5 py-5 font-mono text-[13px] leading-6">
            <div>
              <span className="text-stone-600">$ </span>
              <span className="text-stone-200">skilo search code review</span>
            </div>
            <div className="pl-4 text-stone-500">
              native, skills.sh, and repo-backed entries in one list
            </div>
            <div className="h-4" />
            <div>
              <span className="text-stone-600">$ </span>
              <span className="text-stone-200">skilo pack anthropics/skills@frontend-design flrabbit/original-landing-page-builder</span>
            </div>
            <div className="pl-4 text-emerald-400/70">&rarr; skilo.xyz/p/kX7mN2pQ</div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-stone-400">
              Works with
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
              {[
                { Icon: Claude, name: "Claude Code" },
                { Icon: Codex, name: "Codex" },
                { Icon: Cursor, name: "Cursor" },
                { Icon: Amp, name: "Amp" },
                { Icon: Windsurf, name: "Windsurf" },
                { Icon: OpenCode, name: "OpenCode" },
                { Icon: Cline, name: "Cline" },
                { Icon: RooCode, name: "Roo" },
                { Icon: OpenClaw, name: "OpenClaw" },
              ].map(({ Icon, name }) => (
                <span key={name} className="flex items-center gap-1.5 text-stone-500">
                  <Icon size={16} />
                  <span className="text-xs">{name}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <p className="text-sm font-medium text-black">For humans and agents</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Browse here, or fetch the machine-facing surface at{" "}
              <Link
                to="/"
                className="font-mono underline decoration-stone-300 underline-offset-[2.5px]"
              >
                skilo.xyz
              </Link>
              {" "}and{" "}
              <a
                href="https://skilo.xyz/llms.txt"
                className="font-mono underline decoration-stone-300 underline-offset-[2.5px]"
              >
                /llms.txt
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Landing;
