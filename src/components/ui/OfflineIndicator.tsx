import { useOffline } from '../../hooks/useOffline';

interface OfflineIndicatorProps {
  showSyncButton?: boolean;
  compact?: boolean;
}

export function OfflineIndicator({
  showSyncButton = true,
  compact = false,
}: OfflineIndicatorProps) {
  const { isOnline, pendingSync, isSyncing, syncNow } = useOffline();

  // Don't show anything if online and no pending sync
  if (isOnline && pendingSync === 0) {
    return null;
  }

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          isOnline
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
          }`}
        />
        {!isOnline ? 'Offline' : `${pendingSync} pending`}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl ${
        isOnline
          ? 'bg-amber-50 border border-amber-200'
          : 'bg-red-50 border border-red-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isOnline ? 'bg-amber-100' : 'bg-red-100'
          }`}
        >
          {isOnline ? (
            <svg
              className="w-5 h-5 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          )}
        </div>
        <div>
          <div className={`font-medium ${isOnline ? 'text-amber-900' : 'text-red-900'}`}>
            {isOnline ? 'Sync Pending' : 'You are offline'}
          </div>
          <div className={`text-sm ${isOnline ? 'text-amber-600' : 'text-red-600'}`}>
            {isOnline
              ? `${pendingSync} change${pendingSync !== 1 ? 's' : ''} waiting to sync`
              : 'Changes will sync when connection is restored'}
          </div>
        </div>
      </div>

      {showSyncButton && isOnline && pendingSync > 0 && (
        <button
          onClick={syncNow}
          disabled={isSyncing}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isSyncing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Syncing...
            </>
          ) : (
            'Sync Now'
          )}
        </button>
      )}
    </div>
  );
}
