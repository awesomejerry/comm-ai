import { QASession } from '../types/qa';

const SESSION_KEY = 'qa-session';

export function saveSession(session: QASession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): QASession | null {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}
