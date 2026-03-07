import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Package, ArrowLeft, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import TrustBadge from '../components/TrustBadge';
import InstallBtn from '../components/InstallBtn';
import type { SkillMetadata } from '../api/skilo';

function SkillPage() {
  const { token } = useParams<{ token: string }>();
  const [skill, setSkill] = useState<SkillMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For now, simulate loading from API
    // In production, this would fetch from api.skilo.dev
    const fetchSkill = async () => {
      try {
        // Mock data for demonstration
        await new Promise(resolve => setTimeout(resolve, 500));
        setSkill({
          name: 'example-skill',
          namespace: 'anonymous',
          description: 'An example skill demonstrating the Skilo platform.',
          version: '1.0.0',
          author: null,
          homepage: null,
          repository: null,
          keywords: ['example', 'demo'],
          tarballUrl: '',
          size: 1024,
          checksum: 'sha256:abc123...',
          listed: false,
          createdAt: Date.now() / 1000,
          updatedAt: Date.now() / 1000,
        });
      } catch (e) {
        setError('Failed to load skill');
      } finally {
        setLoading(false);
      }
    };

    fetchSkill();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-skilo-600" />
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Skill not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The skill you're looking for doesn't exist or has expired.
          </p>
          <Link to="/" className="text-skilo-600 hover:text-skilo-700">
            Go home
          </Link>
        </div>
      </div>
    );
  }

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

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {skill.namespace}/{skill.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {skill.description}
              </p>
              <TrustBadge status="anonymous" publisher={skill.author || undefined} />
            </div>
            <div className="text-right">
              <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                v{skill.version}
              </span>
            </div>
          </div>
        </div>

        {/* Install */}
        <div className="mb-12 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-4">
            Install
          </h2>
          <InstallBtn
            skillId={skill.namespace + '/' + skill.name}
            namespace={skill.namespace}
            name={skill.name}
          />
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-4">
              Details
            </h2>
            <dl className="space-y-3">
              {skill.homepage && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Homepage</dt>
                  <dd>
                    <a
                      href={skill.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-skilo-600 hover:text-skilo-700"
                    >
                      {skill.homepage}
                    </a>
                  </dd>
                </div>
              )}
              {skill.repository && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Repository</dt>
                  <dd>
                    <a
                      href={skill.repository}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-skilo-600 hover:text-skilo-700"
                    >
                      {skill.repository}
                    </a>
                  </dd>
                </div>
              )}
              {skill.keywords.length > 0 && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Keywords</dt>
                  <dd className="flex flex-wrap gap-2">
                    {skill.keywords.map(kw => (
                      <span
                        key={kw}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                      >
                        {kw}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-4">
              Verification
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <Shield className="w-5 h-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Checksum</p>
                  <code className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                    {skill.checksum}
                  </code>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Size</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(skill.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SkillPage;
