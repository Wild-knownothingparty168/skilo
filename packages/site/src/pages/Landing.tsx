import { Link, Copy, Zap, Globe, Shield, ArrowRight, Github, Terminal, Package } from 'lucide-react';
import CodeBlock from '../components/CodeBlock';

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-skilo-600 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">Skilo</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link to="/docs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              Docs
            </Link>
            <a
              href="https://github.com/yazcaleb/skilo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            Instant skill handoff.
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            Share a skill between agents or people with a link, code, or file.
            No ceremony, no friction.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#get-started"
              className="inline-flex items-center gap-2 px-6 py-3 bg-skilo-600 hover:bg-skilo-700 text-white rounded-lg font-medium transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/yazcaleb/skilo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 rounded-lg font-medium transition-colors"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="get-started" className="py-16 px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            <CodeBlock
              code="npx skilo share ./my-skill"
              output="🔗 skilo.xyz/s/a3xK9mP2"
            />
            <CodeBlock
              code="npx skilo add https://skilo.xyz/s/a3xK9mP2"
              output="✓ Installed @namespace/skill-name"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-skilo-100 dark:bg-skilo-900/30 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-skilo-600 dark:text-skilo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Share instantly</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create a shareable link in seconds. No registration required for basic sharing.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-skilo-100 dark:bg-skilo-900/30 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-skilo-600 dark:text-skilo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Install anywhere</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Works between agents and humans. Compatible with existing skill workflows.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-skilo-100 dark:bg-skilo-900/30 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-skilo-600 dark:text-skilo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Trust what you install</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Inspect, verify checksums, then add with confidence. Know your publisher.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-16 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4" />
              <span>No signup required</span>
            </div>
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <span>Compatible with existing workflows</span>
            </div>
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              <span>Claim and manage shared skills later</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Package className="w-4 h-4" />
            <span className="text-sm">Skilo - Open source skill sharing</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <Link to="/docs" className="hover:text-gray-900 dark:hover:text-gray-100">
              Documentation
            </Link>
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

export default Landing;
