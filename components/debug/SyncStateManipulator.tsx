'use client';

import { useState } from 'react';
import { useStravaSync, useSyncStatusInfo } from '@/hooks/use-strava-sync';

interface DebugAction {
  id: string;
  name: string;
  description: string;
  action: () => Promise<void>;
  category: 'sync-count' | 'timing' | 'errors' | 'state';
}

export function SyncStateManipulator() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const { refreshStatus } = useStravaSync();

  const {
    canSync,
    syncDisabledReason,
    todaySyncs,
    maxSyncs,
    consecutiveErrors,
  } = useSyncStatusInfo();

  const executeAction = async (action: DebugAction) => {
    setIsLoading(true);
    setLastAction('');

    try {
      console.log(`🔧 Executing action: ${action.name}`);
      console.log(`📤 Request payload:`, {
        action: action.id.replace('-', '_'),
      });

      await action.action();

      console.log(`✅ Action completed: ${action.name}`);
      setLastAction(`✅ ${action.name} completed successfully`);

      // Refresh status to see updated values
      setTimeout(() => {
        console.log(`🔄 Refreshing status...`);
        refreshStatus();
      }, 500);
    } catch (error) {
      console.error(`❌ Action failed: ${action.name}`, error);
      setLastAction(
        `❌ ${action.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const debugActions: DebugAction[] = [
    // Sync Count Manipulation
    {
      id: 'add-sync',
      name: 'Add 1 Sync',
      description: "Increment today's sync count by 1",
      category: 'sync-count',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_sync' }),
        });
        if (!response.ok) throw new Error('Failed to add sync');
      },
    },
    {
      id: 'remove-sync',
      name: 'Remove 1 Sync',
      description: "Decrement today's sync count by 1",
      category: 'sync-count',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'remove_sync' }),
        });
        if (!response.ok) throw new Error('Failed to remove sync');
      },
    },
    {
      id: 'set-syncs-0',
      name: 'Reset Sync Count (0)',
      description: "Set today's sync count to 0",
      category: 'sync-count',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_syncs', count: 0 }),
        });
        if (!response.ok) throw new Error('Failed to reset sync count');
      },
    },
    {
      id: 'set-syncs-4',
      name: 'Set Sync Count (4)',
      description: "Set today's sync count to 4 (1 remaining)",
      category: 'sync-count',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_syncs', count: 4 }),
        });
        if (!response.ok) throw new Error('Failed to set sync count');
      },
    },
    {
      id: 'set-syncs-5',
      name: 'Set Sync Count (5)',
      description: "Set today's sync count to 5 (limit reached)",
      category: 'sync-count',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_syncs', count: 5 }),
        });
        if (!response.ok) throw new Error('Failed to set sync count');
      },
    },
    {
      id: 'set-syncs-10',
      name: 'Set Sync Count (10)',
      description: "Set today's sync count to 10 (way over limit)",
      category: 'sync-count',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_syncs', count: 10 }),
        });
        if (!response.ok) throw new Error('Failed to set sync count');
      },
    },

    // Timing Manipulation
    {
      id: 'reset-timer',
      name: 'Reset 1-Hour Timer',
      description: 'Set last sync to 2 hours ago (bypass 1-hour cooldown)',
      category: 'timing',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset_timer' }),
        });
        if (!response.ok) throw new Error('Failed to reset timer');
      },
    },
    {
      id: 'set-recent-sync',
      name: 'Set Recent Sync (30 min ago)',
      description: 'Set last sync to 30 minutes ago (trigger 1-hour cooldown)',
      category: 'timing',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_recent_sync' }),
        });
        if (!response.ok) throw new Error('Failed to set recent sync');
      },
    },
    {
      id: 'set-just-now',
      name: 'Set Just Now Sync',
      description: 'Set last sync to just now (trigger 1-hour cooldown)',
      category: 'timing',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_just_now' }),
        });
        if (!response.ok) throw new Error('Failed to set just now sync');
      },
    },

    // Error Manipulation
    {
      id: 'add-error',
      name: 'Add Consecutive Error',
      description: 'Increment consecutive error count by 1',
      category: 'errors',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_error' }),
        });
        if (!response.ok) throw new Error('Failed to add error');
      },
    },
    {
      id: 'clear-errors',
      name: 'Clear All Errors',
      description: 'Reset consecutive error count to 0',
      category: 'errors',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear_errors' }),
        });
        if (!response.ok) throw new Error('Failed to clear errors');
      },
    },

    // State Manipulation
    {
      id: 'disable-sync',
      name: 'Disable Sync',
      description: 'Set sync_enabled to false',
      category: 'state',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'disable_sync' }),
        });
        if (!response.ok) throw new Error('Failed to disable sync');
      },
    },
    {
      id: 'enable-sync',
      name: 'Enable Sync',
      description: 'Set sync_enabled to true',
      category: 'state',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'enable_sync' }),
        });
        if (!response.ok) throw new Error('Failed to enable sync');
      },
    },
    {
      id: 'reset-all',
      name: 'Reset All (Fresh State)',
      description:
        'Reset to fresh state: 0 syncs, no errors, enabled, 2 hours ago',
      category: 'state',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset_all' }),
        });
        if (!response.ok) throw new Error('Failed to reset all');
      },
    },
    {
      id: 'reset-clean',
      name: 'Reset to Clean State',
      description: 'Fix date issues and clear errors while keeping activities',
      category: 'state',
      action: async () => {
        const response = await fetch('/api/debug/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset_clean' }),
        });
        if (!response.ok) throw new Error('Failed to reset to clean state');
      },
    },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sync-count':
        return '🔢';
      case 'timing':
        return '⏰';
      case 'errors':
        return '❌';
      case 'state':
        return '⚙️';
      default:
        return '🔧';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sync-count':
        return 'bg-blue-50 border-blue-200';
      case 'timing':
        return 'bg-yellow-50 border-yellow-200';
      case 'errors':
        return 'bg-red-50 border-red-200';
      case 'state':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const groupedActions = debugActions.reduce(
    (acc, action) => {
      if (!acc[action.category]) acc[action.category] = [];
      acc[action.category].push(action);
      return acc;
    },
    {} as Record<string, DebugAction[]>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Sync State Manipulator
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/debug/sync-state', {
                  method: 'PUT',
                });
                const data = await response.json();
                console.log('🔧 API connectivity test:', data);
                setLastAction(
                  `🔧 API Test: ${data.message} at ${data.timestamp}`
                );
              } catch (error) {
                console.error('❌ API connectivity test failed:', error);
                setLastAction(
                  `❌ API Test Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
              }
            }}
            disabled={isLoading}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Test API
          </button>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/auth/strava/token');
                const data = await response.json();
                console.log('🔐 Auth check:', data);

                if (data.authenticated) {
                  const details = data.has_strava_tokens
                    ? `with Strava tokens (${data.athlete?.name || 'Unknown'})`
                    : 'but no Strava tokens';
                  setLastAction(`🔐 Auth: Authenticated ${details}`);
                } else {
                  setLastAction(
                    `🔐 Auth: Not authenticated - ${data.message || 'Unknown error'}`
                  );
                }
              } catch (error) {
                console.error('❌ Auth check failed:', error);
                setLastAction(
                  `❌ Auth Check Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
              }
            }}
            disabled={isLoading}
            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Check Auth
          </button>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/debug/sync-state');
                const data = await response.json();
                console.log('🔍 Current sync state from API:', data);

                // Format the JSON nicely for display
                const formattedState = data.syncState
                  ? JSON.stringify(data.syncState, null, 2)
                  : 'No sync state found';

                setLastAction(`🔍 Current state:\n${formattedState}`);
              } catch (error) {
                console.error('❌ Failed to check state:', error);
                setLastAction(
                  `❌ Failed to check state: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
              }
            }}
            disabled={isLoading}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Check State
          </button>
          <button
            onClick={refreshStatus}
            disabled={isLoading}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Current State Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Current State
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">canSync:</span>
            <span
              className={`ml-1 font-medium ${canSync ? 'text-green-600' : 'text-red-600'}`}
            >
              {canSync ? 'true' : 'false'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">todaySyncs:</span>
            <span className="ml-1 font-medium">
              {todaySyncs}/{maxSyncs}
            </span>
          </div>
          <div>
            <span className="text-gray-500">consecutiveErrors:</span>
            <span className="ml-1 font-medium">{consecutiveErrors}</span>
          </div>
          <div>
            <span className="text-gray-500">disabled:</span>
            <span className="ml-1 font-medium text-red-600">
              {syncDisabledReason || 'none'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Results */}
      {lastAction && (
        <div className="mb-6 p-3 rounded-lg border bg-blue-50 border-blue-200">
          {lastAction.includes('\n') ? (
            <pre className="text-sm text-blue-800 whitespace-pre-wrap font-mono">
              {lastAction}
            </pre>
          ) : (
            <p className="text-sm text-blue-800">{lastAction}</p>
          )}
        </div>
      )}

      {/* Debug Actions */}
      <div className="space-y-6">
        {Object.entries(groupedActions).map(([category, actions]) => (
          <div
            key={category}
            className={`p-4 rounded-lg border ${getCategoryColor(category)}`}
          >
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <span className="mr-2">{getCategoryIcon(category)}</span>
              {category === 'sync-count' && 'Sync Count Manipulation'}
              {category === 'timing' && 'Timing Manipulation'}
              {category === 'errors' && 'Error Manipulation'}
              {category === 'state' && 'State Manipulation'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {actions.map(action => (
                <button
                  key={action.id}
                  onClick={() => executeAction(action)}
                  disabled={isLoading}
                  className="p-3 text-left bg-white rounded border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900">
                    {action.name}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {action.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Test Scenarios */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="text-sm font-medium text-purple-800 mb-3">
          🔧 Debugging Guide
        </h3>
        <div className="text-xs text-purple-700 space-y-2">
          <p>
            <strong>Step 1:</strong> Click &quot;Test API&quot; to verify basic
            connectivity
          </p>
          <p>
            <strong>Step 2:</strong> Click &quot;Check Auth&quot; to verify
            authentication
          </p>
          <p>
            <strong>Step 3:</strong> Click &quot;Check State&quot; to see
            current sync state
          </p>
          <p>
            <strong>Step 4:</strong> Try &quot;Add 1 Sync&quot; to test the
            incrementor
          </p>
          <p>
            <strong>Console:</strong> Open browser dev tools to see detailed
            logs
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="text-sm font-medium text-purple-800 mb-3">
          🎯 Quick Test Scenarios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={async () => {
              await executeAction(
                debugActions.find(a => a.id === 'reset-all')!
              );
              await executeAction(
                debugActions.find(a => a.id === 'set-syncs-4')!
              );
            }}
            disabled={isLoading}
            className="p-3 text-left bg-white rounded border border-purple-200 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <div className="font-medium text-sm text-purple-900">
              Test: 1 Sync Remaining
            </div>
            <div className="text-xs text-purple-600 mt-1">
              Reset + set to 4/5 syncs
            </div>
          </button>

          <button
            onClick={async () => {
              await executeAction(
                debugActions.find(a => a.id === 'reset-all')!
              );
              await executeAction(
                debugActions.find(a => a.id === 'set-syncs-5')!
              );
            }}
            disabled={isLoading}
            className="p-3 text-left bg-white rounded border border-purple-200 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <div className="font-medium text-sm text-purple-900">
              Test: Daily Limit Reached
            </div>
            <div className="text-xs text-purple-600 mt-1">
              Reset + set to 5/5 syncs
            </div>
          </button>

          <button
            onClick={async () => {
              await executeAction(
                debugActions.find(a => a.id === 'reset-all')!
              );
              await executeAction(
                debugActions.find(a => a.id === 'set-just-now')!
              );
            }}
            disabled={isLoading}
            className="p-3 text-left bg-white rounded border border-purple-200 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <div className="font-medium text-sm text-purple-900">
              Test: 1-Hour Cooldown
            </div>
            <div className="text-xs text-purple-600 mt-1">
              Reset + set recent sync
            </div>
          </button>

          <button
            onClick={async () => {
              await executeAction(
                debugActions.find(a => a.id === 'reset-all')!
              );
              await executeAction(
                debugActions.find(a => a.id === 'add-error')!
              );
              await executeAction(
                debugActions.find(a => a.id === 'add-error')!
              );
            }}
            disabled={isLoading}
            className="p-3 text-left bg-white rounded border border-purple-200 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <div className="font-medium text-sm text-purple-900">
              Test: Consecutive Errors
            </div>
            <div className="text-xs text-purple-600 mt-1">
              Reset + add 2 errors
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
