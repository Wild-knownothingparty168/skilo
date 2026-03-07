import { Link } from 'react-router-dom';
import { Package, ArrowLeft, Terminal, FileText, Shield, Share2, Download } from 'lucide-react';
import CodeBlock from '../components/CodeBlock';

function Docs() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-skilo-600 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Skilo</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4">Documentation</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
          Learn how to share and install skills with Skilo.
        </p>

        {/* Quick start */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Terminal className="w-6 h-6 text-skilo-600" />
            Quick Start
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">1. Share a skill</h3>
              <CodeBlock
                code="npx skilo share ./my-skill"
                output="🔗 skilo.xyz/s/a3xK9mP2"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3">2. Install a skill</h3>
              <CodeBlock
                code="npx skilo add https://skilo.xyz/s/a3xK9mP2"
                output="✓ Installed @anonymous/my-skill"
              />
            </div>
          </div>
        </section>

        {/* Commands */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <FileText className="w-6 h-6 text-skilo-600" />
            CLI Commands
          </h2>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <code className="font-mono text-sm">skilo share {'<path>'}</code>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create a shareable link for a skill. Options: --one-time, --expires (1h, 2d), --uses (n), --password
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <code className="font-mono text-sm">skilo add {'<skill>'}</code>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Install a skill. Accepts: namespace/name, URL, .skl file, or GitHub repo.
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <code className="font-mono text-sm">skilo export {'<path>'}</code>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Export a skill to a .skl file for offline sharing.
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <code className="font-mono text-sm">skilo import {'<source>'}</code>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Import from GitHub, .skl file, or local path.
              </p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <code className="font-mono text-sm">skilo inspect {'<skill>'}</code>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                View skill details without installing.
              </p>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-skilo-600" />
            Trust & Verification
          </h2>
          <div className="prose dark:prose-invert max-w-none">
            <p>
              Skilo uses multiple mechanisms to help you trust what you install:
            </p>
            <ul>
              <li><strong>Anonymous</strong> - Skills published without authentication. Safe to try in isolated environments.</li>
              <li><strong>Claimed</strong> - A user has claimed ownership of an anonymous skill.</li>
              <li><strong>Verified</strong> - Publisher identity has been confirmed via email or GitHub.</li>
            </ul>
            <p>
              All skills have SHA-256 checksums. Verified skills are also cryptographically signed.
            </p>
          </div>
        </section>

        {/* Share options */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Share2 className="w-6 h-6 text-skilo-600" />
            Sharing Options
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <h3 className="font-medium mb-2">One-time links</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Link expires after first access. Perfect for sensitive skills.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <h3 className="font-medium mb-2">Expiring links</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set expiration: 1h, 2d, 7d. Auto-cleanup after expiry.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <h3 className="font-medium mb-2">Limited uses</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Limit to N downloads. Track who accesses your skill.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <h3 className="font-medium mb-2">Password protection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Require a password to access. Extra layer of security.
              </p>
            </div>
          </div>
        </section>

        {/* File format */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Download className="w-6 h-6 text-skilo-600" />
            .skl File Format
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            .skl files are signed, compressed bundles for offline sharing:
          </p>
          <CodeBlock
            code="my-skill.skl (tar.gz)"
            output={`SKILL.md           # Required skill manifest
index.js           # Entry point
src/               # Source files
.skilo-manifest    # Signature + metadata`}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Package className="w-4 h-4" />
            <span className="text-sm">Skilo - Open source skill sharing</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <a
              href="https://github.com/yazcaleb/skilo"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-gray-100"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Docs;
