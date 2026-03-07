import { Package, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import TrustBadge from './TrustBadge';

interface SkillCardProps {
  namespace: string;
  name: string;
  description?: string;
  version?: string;
  status?: 'anonymous' | 'claimed' | 'verified';
}

function SkillCard({ namespace, name, description, version, status = 'anonymous' }: SkillCardProps) {
  return (
    <Link
      to={`/s/${namespace}/${name}`}
      className="block p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-skilo-300 dark:hover:border-skilo-700 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {namespace}/{name}
            </span>
            {version && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                v{version}
              </span>
            )}
          </div>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
              {description}
            </p>
          )}
          <div className="mt-3">
            <TrustBadge status={status} />
          </div>
        </div>
        <ArrowUpRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </Link>
  );
}

export default SkillCard;
