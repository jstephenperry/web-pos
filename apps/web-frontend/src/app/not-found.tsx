import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-yellow-500 flex items-center justify-center mb-6 mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-6xl font-bold text-foreground mb-3">
          404
        </h1>

        <h2 className="text-2xl font-semibold text-foreground mb-3">
          Page Not Found
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-button-primary-background hover:bg-button-primary-background/90 text-button-primary-foreground rounded-md font-medium transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
