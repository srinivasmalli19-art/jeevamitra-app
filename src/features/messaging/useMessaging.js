import { useCallback, useEffect, useRef, useState } from "react";
import {
  watchUserInteractions, watchInteraction, watchLatestMessages,
  fetchOlderMessages, sendTextMessage, watchTotalUnread, PAGE_SIZE,
} from "./messagingApi";

// Realtime list of the current user's conversations.
export function useUserInteractions(uid) {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!uid) return undefined;
    setLoading(true);
    setError(null);
    const unsub = watchUserInteractions(
      uid,
      (data) => { setInteractions(data); setLoading(false); },
      (err) => { setError(err); setLoading(false); },
    );
    return unsub;
  }, [uid, reloadKey]);

  return { interactions, loading, error, empty: !loading && !error && interactions.length === 0, refresh };
}

// Realtime single interaction document.
export function useInteraction(interactionId) {
  const [interaction, setInteraction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!interactionId) return undefined;
    setLoading(true);
    setError(null);
    const unsub = watchInteraction(
      interactionId,
      (data) => { setInteraction(data); setLoading(false); },
      (err) => { setError(err); setLoading(false); },
    );
    return unsub;
  }, [interactionId]);

  return { interaction, loading, error };
}

/**
 * Paginated + realtime messages. Listens to the latest page and lets the
 * caller prepend older pages. New messages arrive via the live listener.
 */
export function useMessages(interactionId, pageSize = PAGE_SIZE) {
  const [live, setLive] = useState([]);          // latest page (realtime)
  const [older, setOlder] = useState([]);        // older pages (fetched)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [reachedStart, setReachedStart] = useState(false);
  const oldestDocRef = useRef(null);

  useEffect(() => {
    if (!interactionId) return undefined;
    setLive([]); setOlder([]); setReachedStart(false); oldestDocRef.current = null;
    setLoading(true); setError(null);
    const unsub = watchLatestMessages(
      interactionId,
      (msgs, meta) => {
        setLive(msgs);
        // Only the live window controls the "oldest known doc" boundary until
        // the user explicitly loads older pages.
        if (!older.length) {
          oldestDocRef.current = meta.oldestDoc;
          setReachedStart(meta.reachedStart);
        }
        setLoading(false);
      },
      (err) => { setError(err); setLoading(false); },
      pageSize,
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactionId, pageSize]);

  const loadOlder = useCallback(async () => {
    if (loadingOlder || reachedStart || !oldestDocRef.current) return;
    setLoadingOlder(true);
    try {
      const res = await fetchOlderMessages(interactionId, oldestDocRef.current, pageSize);
      setOlder((prev) => [...res.messages, ...prev]);
      oldestDocRef.current = res.oldestDoc || oldestDocRef.current;
      setReachedStart(res.reachedStart);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingOlder(false);
    }
  }, [interactionId, loadingOlder, reachedStart, pageSize]);

  const messages = [...older, ...live];
  return {
    messages, loading, error, loadingOlder, reachedStart, loadOlder,
    empty: !loading && !error && messages.length === 0,
  };
}

// Total unread across conversations (for the nav badge).
export function useTotalUnread(uid) {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    if (!uid) return undefined;
    const unsub = watchTotalUnread(uid, setTotal, () => setTotal(0));
    return unsub;
  }, [uid]);
  return total;
}

/**
 * Idempotent send with sending/error state and retry. Guards against
 * double-submits while a send is in flight.
 */
export function useSendMessage(interactionId, senderId) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  const send = useCallback(async (text) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setSending(true);
    setError(null);
    try {
      await sendTextMessage({ interactionId, senderId, text });
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }, [interactionId, senderId]);

  return { send, sending, error, clearError: () => setError(null) };
}
