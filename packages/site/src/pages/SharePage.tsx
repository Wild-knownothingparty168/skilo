import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Package, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function SharePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if share requires password
    const checkShare = async () => {
      try {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 300));
        setRequiresPassword(false); // For demo
        setLoading(false);
      } catch (e) {
        setError('Invalid or expired share link');
        setLoading(false);
      }
    };

    checkShare();
  }, [token]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    // Verify password and redirect to skill page
    navigate(`/s/${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-skilo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Link expired</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-skilo-600 hover:bg-skilo-700 text-white rounded-lg font-medium transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-skilo-100 dark:bg-skilo-900/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-skilo-600 dark:text-skilo-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Password protected</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter the password to access this skill.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-skilo-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              className="w-full px-4 py-3 bg-skilo-600 hover:bg-skilo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // If no password required, redirect to skill page
  useEffect(() => {
    if (!requiresPassword && !loading) {
      navigate(`/s/${token}`, { replace: true });
    }
  }, [requiresPassword, loading, navigate, token]);

  return null;
}

export default SharePage;
