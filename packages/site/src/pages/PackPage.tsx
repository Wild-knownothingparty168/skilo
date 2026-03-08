import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Copy, Check, ArrowLeft } from 'lucide-react';
import { api } from '../api/skilo';
import type { PackData } from '../api/skilo';
import SkillCard from '../components/SkillCard';

function PackPage() {
  const { token } = useParams<{ token: string }>();
  const [pack, setPack] = useState<PackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.resolvePack(token)
      .then(setPack)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCopy = async () => {
    if (!pack) return;
    const commands = pack.skills
      .map((s) => `npx skilo-cli add ${s.namespace}/${s.name}`)
      .join('\n');
    await navigator.clipboard.writeText(commands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading pack...</div>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || 'Pack not found'}</p>
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-8">
          <ArrowLeft className="w-4 h-4" /> skilo
        </Link>

        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6 text-gray-400" />
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {pack.name || 'Skill Pack'}
              </h1>
            </div>
            <p className="text-sm text-gray-500">
              {pack.skills.length} skill{pack.skills.length !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-sm text-gray-600 dark:text-gray-400 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Install All'}
          </button>
        </div>

        {/* Skills grid */}
        <div className="space-y-3">
          {pack.skills.map((skill) => (
            <SkillCard
              key={`${skill.namespace}/${skill.name}`}
              namespace={skill.namespace}
              name={skill.name}
              description={skill.description}
              version={skill.version}
              shareToken={skill.shareToken}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PackPage;
