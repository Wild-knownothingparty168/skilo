interface TrustBadgeProps {
  status: 'anonymous' | 'claimed' | 'verified';
  publisher?: string;
}

function TrustBadge({ status, publisher }: TrustBadgeProps) {
  const styles = {
    anonymous: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    claimed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    verified: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  const labels = {
    anonymous: 'Anonymous',
    claimed: 'Claimed',
    verified: 'Verified',
  };

  return (
    <div className="flex items-center gap-3">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status === 'verified' && (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
        {labels[status]}
      </span>
      {publisher && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {publisher}
        </span>
      )}
    </div>
  );
}

export default TrustBadge;
