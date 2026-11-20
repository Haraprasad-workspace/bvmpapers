import { getSessionId } from './user.js';
import { isSupabaseConfigured, supabase } from './supabase.js';

const TOPIC = 'semester-5';
let channel = null;
let active = false;
let status = isSupabaseConfigured ? 'connecting' : 'unavailable';
let sessionId = '';
const subscribers = new Set();

function readPresence() {
  if (!channel) return { count: 0 };
  const state = channel.presenceState();
  const sessions = Object.values(state).flat();
  return { count: sessions.length };
}

function emit() {
  const current = status === 'connected' ? readPresence() : { count: null };
  for (const callback of subscribers) callback({ status, ...current });
}

function trackProfile() {
  if (!channel || !active) return;
  channel.track({
    sessionId,
    section: 'semester-5'
  }).then(({ error }) => {
    if (error) console.warn('Could not update BVM Papers presence.', error.message);
  }).catch(error => console.warn('Could not update BVM Papers presence.', error));
}

export function onPresenceChange(callback) {
  subscribers.add(callback);
  const current = status === 'connected' ? readPresence() : { count: null };
  callback({ status, ...current });
  return () => subscribers.delete(callback);
}

export function startPresence() {
  if (!isSupabaseConfigured) {
    status = 'unavailable';
    emit();
    return;
  }
  if (channel) return;

  sessionId = getSessionId();
  status = 'connecting';
  channel = supabase.channel(TOPIC, {
    config: {
      private: true,
      presence: { key: sessionId }
    }
  });

  channel.on('presence', { event: 'sync' }, () => {
    status = 'connected';
    emit();
  });
  channel.on('presence', { event: 'join' }, () => emit());
  channel.on('presence', { event: 'leave' }, () => emit());
  const subscribedChannel = channel;
  channel.subscribe((nextStatus, error) => {
    if (channel !== subscribedChannel) return;
    if (nextStatus === 'SUBSCRIBED') {
      active = true;
      status = 'connected';
      trackProfile();
      emit();
    } else if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT' || nextStatus === 'CLOSED') {
      active = false;
      status = 'disconnected';
      if (error) console.warn('BVM Papers presence is unavailable.', error.message);
      emit();
    } else {
      status = 'connecting';
      emit();
    }
  });
}

export function stopPresence() {
  if (!channel) return;
  const leaving = channel;
  channel = null;
  active = false;
  status = isSupabaseConfigured ? 'connecting' : 'unavailable';
  void supabase.removeChannel(leaving).catch(error => console.warn('Could not leave BVM Papers presence channel.', error));
  emit();
}

export function refreshPresenceProfile() {
  trackProfile();
}

export function isInSemesterRoom(path) {
  return path === '/' || /^\/subject\/[^/]+$/.test(path);
}
