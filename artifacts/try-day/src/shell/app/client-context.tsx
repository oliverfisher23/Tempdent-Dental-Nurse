/**
 * The client definition, made available to every shell component through React
 * context. Components read it with useClient() while rendering; nothing in the
 * shell reads client data at module evaluation time, so the shell can be built
 * and tested without any client loaded.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { assertValidClient, type TryClient } from '@shell/lib/client';

const ClientContext = createContext<TryClient | null>(null);

/**
 * Accepts a client typed to its own task states; inside the shell the client is
 * read in its untyped form (the shell never looks inside a task's state).
 */
export function TryClientProvider<TS extends Record<string, unknown>>({ client, children }: { client: TryClient<TS>; children: ReactNode }) {
  const value = useMemo(() => {
    const untyped = client as unknown as TryClient;
    // Checked once per client object; a missing page or route fails here, with every gap listed, not mid-shift.
    assertValidClient(untyped);
    return untyped;
  }, [client]);
  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useClient(): TryClient {
  const client = useContext(ClientContext);
  if (!client) throw new Error('useClient must be used inside <TryClientProvider>');
  return client;
}
