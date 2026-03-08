import { useState } from "react";
import { Link } from "react-router-dom";
import { SkiloMark, CopyIcon, ExternalLinkIcon } from "../components/icons";

const NAV_LINK = "text-sm underline decoration-stone-400/50 underline-offset-[2.5px] hover:decoration-stone-500 transition-[text-decoration-color] duration-150";
const PRIMARY_BTN = "inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded text-[#0a1a1a] text-sm font-medium whitespace-nowrap bg-emerald-100 shadow-[0_2px_0_0_#6ee7b7] active:translate-y-px active:shadow-[0_1px_0_0_#34d399] transition-[transform,box-shadow] duration-75 cursor-pointer select-none";
const FOOTER_LINK = "text-sm underline decoration-stone-400/50 underline-offset-[2.5px] hover:decoration-stone-500 transition-[text-decoration-color] duration-150";

function ClaimPage() {
  const [claimCopied, setClaimCopied] = useState(false);

  const claimCmd = "skilo claim @namespace/skill-name --token YOUR_TOKEN";

  function handleCopy() {
    navigator.clipboard.writeText(claimCmd);
    setClaimCopied(true);
    setTimeout(() => setClaimCopied(false), 1500);
  }

  return (
    <>
      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 lg:px-10 lg:py-4">
          <Link to="/" className="flex items-center gap-2 font-medium">
            <SkiloMark className="h-5 w-5" />
            Skilo
          </Link>
          <span className="hidden items-center gap-4 text-sm sm:flex">
            <Link to="/docs" className={NAV_LINK}>Docs</Link>
          </span>
        </nav>
      </header>

      {/* ── Main ── */}
      <main className="flex flex-col gap-4 max-w-[600px] mx-auto p-5 pt-28 pb-20 lg:p-10 lg:pt-32 lg:pb-32 leading-relaxed text-base">

        <div className="flex flex-col gap-2">
          <p className="text-lg font-medium text-black tracking-[-0.01em]">
            Claim a skill
          </p>
          <p className="text-stone-500">
            When you publish a skill anonymously, you get a claim token. Use it to take ownership later &mdash; no account needed at publish time.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-4 flex flex-col gap-4">
          <p className="font-medium">How it works</p>
          <ol className="flex list-decimal flex-col gap-3 pl-5">
            <li>
              <p className="text-stone-500">
                <span className="font-medium text-black">Publish a skill.</span> When you run <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">skilo publish</code> without being logged in, you get an anonymous namespace and a claim token.
              </p>
            </li>
            <li>
              <p className="text-stone-500">
                <span className="font-medium text-black">Save the token.</span> The CLI saves it to <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[13px]">~/.skilo/claims/</code> automatically. You'll also see it in the terminal output.
              </p>
            </li>
            <li>
              <p className="text-stone-500">
                <span className="font-medium text-black">Log in and claim.</span> When you're ready to own the skill under your name, log in and run the claim command.
              </p>
            </li>
          </ol>
        </div>

        {/* Command */}
        <div className="mt-4 flex flex-col gap-2">
          <p className="font-medium">Claim command</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-stone-100 px-3 py-2 font-mono text-[13px] whitespace-nowrap">
              {claimCmd}
            </code>
            <button type="button" onClick={handleCopy} className={PRIMARY_BTN}>
              <CopyIcon className="h-4 w-4" />
              {claimCopied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-stone-400">
            Replace the namespace, skill name, and token with your values.
          </p>
        </div>

        {/* Login */}
        <div className="mt-4 flex flex-col gap-2">
          <p className="font-medium">First time?</p>
          <p className="text-stone-500">
            Log in first to create your namespace:
          </p>
          <code className="rounded bg-stone-100 px-3 py-2 font-mono text-[13px] w-fit">
            skilo login
          </code>
          <p className="text-stone-500">
            After logging in, you can also publish directly under your namespace without the anonymous claim flow.
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 p-5 pt-0 text-sm text-stone-500 lg:p-10 lg:pt-0">
        <Link to="/" className={FOOTER_LINK}>Home</Link>
        <Link to="/docs" className={FOOTER_LINK}>Docs</Link>
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

export default ClaimPage;
