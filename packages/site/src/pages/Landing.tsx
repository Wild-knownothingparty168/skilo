import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CopyIcon } from "../components/icons";
import { api } from "../api/skilo";
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

const PRIMARY_BTN = "inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded text-[#0a1a1a] text-sm font-medium whitespace-nowrap bg-emerald-100 shadow-[0_2px_0_0_#6ee7b7] active:translate-y-px active:shadow-[0_1px_0_0_#34d399] transition-[transform,box-shadow] duration-75 cursor-pointer select-none";

// ─── Input parser ────────────────────────────────────────────────────────────

type ResolvedLine = {
  ref: string;
  label: string;
  nav?: string;
};

function parseLine(raw: string): ResolvedLine | null {
  const trimmed = raw.trim().replace(/^[-*]\s+/, "");
  if (!trimmed) return null;

  const bare = trimmed.replace(/^https?:\/\/(www\.)?/, "");

  const skillMatch = bare.match(/^skilo\.xyz\/s\/([a-zA-Z0-9_-]+)/);
  if (skillMatch) return { ref: `skilo.xyz/s/${skillMatch[1]}`, label: skillMatch[1], nav: `/s/${skillMatch[1]}` };

  const packMatch = bare.match(/^skilo\.xyz\/p\/([a-zA-Z0-9_-]+)/);
  if (packMatch) return { ref: `skilo.xyz/p/${packMatch[1]}`, label: packMatch[1], nav: `/p/${packMatch[1]}` };

  const ghMatch = bare.match(/^github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/tree\/[^/]+(?:\/(.+?))?)?(?:\/?$)/);
  if (ghMatch) {
    const [, org, repo, path] = ghMatch;
    if (path) {
      const clean = path.replace(/\/$/, "");
      return { ref: `${org}/${repo}:${clean}`, label: `${repo}/${clean}` };
    }
    return { ref: `${org}/${repo}`, label: `${org}/${repo}` };
  }

  const shMatch = bare.match(/^skills\.sh\/([^/\s]+)\/([^/\s]+)\/([^/\s]+)/);
  if (shMatch) return { ref: trimmed, label: shMatch[3] };

  const shortMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)@([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) return { ref: trimmed, label: shortMatch[3] };

  return { ref: trimmed, label: trimmed };
}

function parseInput(raw: string): ResolvedLine[] {
  return raw.split(/\n/).map((l) => parseLine(l)).filter((r): r is ResolvedLine => r !== null);
}

function shortLabel(ref: string): string {
  const at = ref.lastIndexOf("@");
  if (at > 0) return ref.slice(at + 1);
  const colon = ref.indexOf(":");
  if (colon > 0) return ref.slice(ref.lastIndexOf("/", colon - 1) + 1).replace(":", "/");
  return ref;
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface PackResult {
  token: string;
  url: string;
  count: number;
  items: Array<{ ref: string; token: string; url: string }>;
}

function Landing() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [installCopied, setInstallCopied] = useState(false);
  const [copied, setCopied] = useState(false);
  const [packing, setPacking] = useState(false);
  const [packResult, setPackResult] = useState<PackResult | null>(null);
  const [stats, setStats] = useState<{ skills: number; installs: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resolved = useMemo(() => parseInput(input), [input]);
  const isMulti = resolved.length > 1;
  const single = resolved.length === 1 ? resolved[0] : null;

  const singleCmd = useMemo(() => {
    if (resolved.length !== 1) return "";
    return `npx skilo-cli add ${resolved[0].ref}`;
  }, [resolved]);

  useEffect(() => {
    api.getStats().then((s) => {
      if (s.skills > 0 || s.installs > 0) setStats(s);
    });
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  useEffect(() => {
    setPackResult(null);
    setCopied(false);
  }, [input]);

  function handleSingleCopy() {
    navigator.clipboard.writeText(singleCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handlePackCopy() {
    if (packing || resolved.length < 2) return;
    setPacking(true);
    try {
      const data = await api.createRefPack(resolved.map((r) => r.ref));
      setPackResult(data);
      navigator.clipboard.writeText(`npx skilo-cli add ${data.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const fallback = `npx skilo-cli add ${resolved.map((r) => r.ref).join(" ")}`;
      navigator.clipboard.writeText(fallback);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } finally {
      setPacking(false);
    }
  }

  function handleInstallCopy() {
    navigator.clipboard.writeText("npx skilo-cli");
    setInstallCopied(true);
    setTimeout(() => setInstallCopied(false), 1500);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (single?.nav) navigate(single.nav);
    else if (single) handleSingleCopy();
    else if (isMulti) handlePackCopy();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !input.includes("\n")) {
      e.preventDefault();
      if (single?.nav) navigate(single.nav);
      else if (single) handleSingleCopy();
    }
  }

  function reset() {
    setInput("");
    setPackResult(null);
    setCopied(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  return (
    <main className="flex flex-col max-w-[600px] mx-auto p-5 pt-28 pb-20 lg:p-10 lg:pt-36 lg:pb-32 text-base">

      <h1 className="text-[22px] font-medium text-black tracking-[-0.02em] leading-snug">
        Share agent skills with a link
      </h1>
      <p className="mt-2 text-[15px] text-stone-500 leading-relaxed">
        Pack skills from any tool, share one link. No repo, no account.
      </p>

      {/* ── Input ── */}
      {!packResult ? (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste skills to pack and share"
            className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-[15px] outline-none focus:border-stone-400 placeholder:text-stone-400 transition-colors resize-none overflow-hidden leading-relaxed"
            autoComplete="off"
            autoFocus
            spellCheck={false}
            rows={1}
          />

          {resolved.length === 0 && (
            <p className="text-xs text-stone-300">One per line to create a pack</p>
          )}

          {single && single.nav && (
            <Link to={single.nav} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
              Open {single.nav.startsWith("/p/") ? "pack" : "skill"} &rarr;
            </Link>
          )}

          {single && !single.nav && (
            <div className="flex items-center gap-2 min-w-0">
              <code className="rounded bg-stone-100 px-2.5 py-1.5 font-mono text-[13px] truncate min-w-0">
                {singleCmd}
              </code>
              <button type="button" onClick={handleSingleCopy} className={PRIMARY_BTN}>
                <CopyIcon className="h-4 w-4" />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}

          {isMulti && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                {resolved.map((r, i) => (
                  <span key={i} className="rounded-full bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-500">
                    {r.label}
                  </span>
                ))}
              </div>
              <button type="button" onClick={handlePackCopy} disabled={packing} className={PRIMARY_BTN}>
                {packing ? (
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
                {packing ? "Packing\u2026" : `Pack ${resolved.length} & Copy`}
              </button>
            </div>
          )}
        </form>
      ) : (
        /* ── Pack result (replaces input) ── */
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-stone-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-stone-800">
              {packResult.count} skill{packResult.count !== 1 ? "s" : ""} packed
            </span>
            <button onClick={reset} className="text-xs text-stone-400 hover:text-stone-600 transition-colors underline underline-offset-2 decoration-stone-300 cursor-pointer">
              Start over
            </button>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <code className="flex-1 min-w-0 truncate rounded bg-stone-100 px-2.5 py-1.5 font-mono text-[13px]">
              npx skilo-cli add {packResult.url}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`npx skilo-cli add ${packResult.url}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className={PRIMARY_BTN}
            >
              <CopyIcon className="h-4 w-4" />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="flex flex-col gap-0.5 pt-2 border-t border-stone-100">
            {packResult.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-0.5">
                <span className="font-mono text-xs text-stone-400 truncate">{shortLabel(item.ref)}</span>
                <Link
                  to={`/s/${item.token}`}
                  className="font-mono text-xs text-stone-400 hover:text-emerald-600 whitespace-nowrap transition-colors"
                >
                  {item.url.replace("https://", "")}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CLI alternative ── */}
      <div className="mt-6 flex items-center gap-3">
        <span className="text-sm text-stone-400">or run</span>
        <code className="rounded bg-stone-100 px-3 py-1.5 font-mono text-[13px] text-stone-600">
          npx skilo-cli
        </code>
        <button type="button" onClick={handleInstallCopy} className={PRIMARY_BTN}>
          <CopyIcon className="h-4 w-4" />
          {installCopied ? "Copied" : "Copy"}
        </button>
      </div>

      {stats && (
        <p className="mt-4 text-xs text-stone-400 tabular-nums">
          {stats.skills.toLocaleString()} skills published
          <span className="text-stone-300 mx-1.5">/</span>
          {stats.installs.toLocaleString()} installs
        </p>
      )}

      {/* ── Terminal ── */}
      <div className="mt-12">
        <div className="overflow-hidden rounded-xl border border-stone-800/80 shadow-lg shadow-stone-900/5">
          <div className="flex items-center gap-1.5 border-b border-stone-800/60 bg-stone-900 px-4 py-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-stone-700" />
            <div className="h-2.5 w-2.5 rounded-full bg-stone-700" />
            <div className="h-2.5 w-2.5 rounded-full bg-stone-700" />
          </div>
          <div className="bg-stone-950 px-5 py-5 font-mono text-[13px] leading-6">
            <div>
              <span className="text-stone-600">$ </span>
              <span className="text-stone-200">npx skilo-cli share claude</span>
            </div>
            <div className="pl-4 text-emerald-400/70">&rarr; skilo.xyz/p/kX7mN2pQ</div>
            <div className="h-4" />
            <div>
              <span className="text-stone-600">$ </span>
              <span className="text-stone-200">skilo add skilo.xyz/p/kX7mN2pQ</span>
            </div>
            <div className="pl-4 text-stone-500">
              &#10003; Installed 3 skills into Codex
              <span className="cursor-blink ml-0.5 inline-block h-[14px] w-[2px] bg-stone-500 align-text-bottom" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Supported tools ── */}
      <div className="mt-14">
        <p className="text-xs font-medium uppercase tracking-widest text-stone-300 mb-4">Works with</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
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
            <span key={name} className="flex items-center gap-1.5 text-stone-400">
              <Icon size={16} />
              <span className="text-xs">{name}</span>
            </span>
          ))}
          <span className="text-xs text-stone-300">+ more</span>
        </div>
      </div>
    </main>
  );
}

export default Landing;
