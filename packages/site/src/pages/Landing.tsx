import { useState } from "react";
import { Link } from "react-router-dom";
import { SkiloMark, CopyIcon, ExternalLinkIcon, HamburgerIcon } from "../components/icons";

// ─── Tokens ──────────────────────────────────────────────────────────────────

const NAV_LINK = "text-sm underline decoration-stone-400/50 underline-offset-[2.5px] hover:decoration-stone-500 transition-[text-decoration-color] duration-150";
const PRIMARY_BTN = "inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded text-[#0a1a1a] text-sm font-medium whitespace-nowrap bg-emerald-100 shadow-[0_2px_0_0_#6ee7b7] active:translate-y-px active:shadow-[0_1px_0_0_#34d399] transition-[transform,box-shadow] duration-75 cursor-pointer select-none";
const FOOTER_LINK = "text-sm underline decoration-stone-400/50 underline-offset-[2.5px] hover:decoration-stone-500 transition-[text-decoration-color] duration-150";

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [terminalCopied, setTerminalCopied] = useState(false);
  const [installCopied, setInstallCopied] = useState(false);

  function handleTerminalCopy() {
    navigator.clipboard.writeText("skilo share ./code-reviewer\nskilo add skilo.xyz/s/a3xK9mP2");
    setTerminalCopied(true);
    setTimeout(() => setTerminalCopied(false), 1500);
  }

  function handleInstallCopy() {
    navigator.clipboard.writeText("npm i -g skilo-cli");
    setInstallCopied(true);
    setTimeout(() => setInstallCopied(false), 1500);
  }

  return (
    <>
      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 lg:px-10 lg:py-4">
          <a href="/" className="flex items-center gap-2 font-medium">
            <SkiloMark className="h-5 w-5" />
            Skilo
          </a>

          <div className="flex items-center gap-4 sm:gap-6">
            <span className="hidden items-center gap-4 text-sm sm:flex">
              <Link to="/docs" className={NAV_LINK}>Docs</Link>
              <a
                href="https://github.com/yazcaleb/skilo"
                className={NAV_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
                <ExternalLinkIcon className="ml-1 inline-block h-3 w-3 align-baseline" />
              </a>
            </span>

            <Link to="/docs" className={PRIMARY_BTN}>
              Get started
            </Link>

            <button
              className="-mr-2 p-2 sm:hidden"
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <HamburgerIcon />
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="border-t border-stone-100 bg-white px-5 pb-4 sm:hidden">
            <nav className="flex flex-col gap-3 pt-3 text-sm">
              <Link to="/docs" className={NAV_LINK} onClick={() => setMobileMenuOpen(false)}>Docs</Link>
              <a
                href="https://github.com/yazcaleb/skilo"
                className={NAV_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
                <ExternalLinkIcon className="ml-1 inline-block h-3 w-3 align-baseline" />
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main className="flex flex-col gap-4 max-w-[600px] mx-auto p-5 pt-28 pb-20 lg:p-10 lg:pt-32 lg:pb-32 leading-relaxed text-base">

        {/* ── Hero ── */}
        <div className="flex flex-col gap-2">
          <p className="text-lg font-medium text-black tracking-[-0.01em]">
            Skill handoff for humans and agents.
          </p>
          <p className="text-stone-500">
            Share a skill, install it into the right tool, or point an agent at Skilo and let it figure out the next step quickly.
          </p>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <code className="rounded bg-stone-100 px-3 py-2 font-mono text-sm whitespace-nowrap">
                npm i -g skilo-cli
              </code>
              <button type="button" onClick={handleInstallCopy} className={PRIMARY_BTN}>
                <CopyIcon className="h-4 w-4" />
                {installCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <p className="text-xs text-stone-400 mt-1">
            No account required.{" "}
            <Link to="/docs" className="underline decoration-stone-300 underline-offset-[2px] hover:decoration-stone-400 transition-[text-decoration-color]">
              Read the docs&nbsp;&rarr;
            </Link>
          </p>
        </div>

        {/* ── Terminal ── */}
        <div className="mt-6">
          <div className="overflow-hidden rounded-xl border border-stone-800/80 shadow-lg shadow-stone-900/5">
            <div className="flex items-center justify-between border-b border-stone-800/60 bg-stone-900 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-stone-700" />
                <div className="h-2.5 w-2.5 rounded-full bg-stone-700" />
                <div className="h-2.5 w-2.5 rounded-full bg-stone-700" />
              </div>
              <button
                type="button"
                onClick={handleTerminalCopy}
                className="flex cursor-pointer items-center gap-1.5 text-xs text-stone-500 transition-colors duration-150 hover:text-stone-300"
              >
                <CopyIcon className="h-3.5 w-3.5" />
                {terminalCopied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="bg-stone-950 px-5 py-5 font-mono text-[13px] leading-6">
              <div>
                <span className="text-stone-600">$ </span>
                <span className="text-stone-200">skilo share ./code-reviewer</span>
              </div>
              <div className="pl-4 text-emerald-400/70">&rarr; skilo.xyz/s/a3xK9mP2</div>
              <div className="h-4" />
              <div>
                <span className="text-stone-600">$ </span>
                <span className="text-stone-200">skilo add skilo.xyz/s/a3xK9mP2</span>
              </div>
              <div className="pl-4 text-stone-500">
                &#10003; Installed code-reviewer
                <span className="cursor-blink ml-0.5 inline-block h-[14px] w-[2px] bg-stone-500 align-text-bottom" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Features ── */}
        <div className="mt-8 flex flex-col gap-5">
          <p className="font-medium">How it works</p>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm">
                <span className="font-medium">Share</span>
              </p>
              <p className="text-stone-500 text-sm mt-1">
                <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">skilo share &lt;path&gt;</code> publishes any SKILL.md directory and returns a link. Add <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">--password</code>, <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">--expires</code>, or <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">--one-time</code> for access control.
              </p>
            </div>

            <div>
              <p className="text-sm">
                <span className="font-medium">Install</span>
              </p>
              <p className="text-stone-500 text-sm mt-1">
                <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">skilo add &lt;link&gt;</code> downloads, verifies the SHA-256 checksum, and installs. Run <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">skilo inspect</code> to review content before installing.
              </p>
            </div>

            <div>
              <p className="text-sm">
                <span className="font-medium">Route automatically</span>
              </p>
              <p className="text-stone-500 text-sm mt-1">
                <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">skilo add</code> and <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">skilo import</code> accept links, refs, bundles, GitHub sources, and local paths. Use target flags like <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">--cc</code>, <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">--codex</code>, or <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">--oc</code> to land in the right tool.
              </p>
            </div>

            <div>
              <p className="text-sm">
                <span className="font-medium">Scale up</span>
              </p>
              <p className="text-stone-500 text-sm mt-1">
                <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">skilo share claude</code> discovers and shares every skill from a tool at once. It also supports <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">cursor</code>, <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">codex</code>, <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">amp</code>, and the rest of the native directory matrix.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 p-5 pt-0 text-sm text-stone-500 lg:p-10 lg:pt-0">
        <Link to="/docs" className={FOOTER_LINK}>Docs</Link>
        <Link to="/claim" className={FOOTER_LINK}>Claim</Link>
        <a
          href="https://github.com/yazcaleb/skilo"
          className={FOOTER_LINK}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
          <ExternalLinkIcon className="ml-1 inline-block h-3 w-3 align-baseline" />
        </a>
      </footer>
    </>
  );
}

export default Landing;
