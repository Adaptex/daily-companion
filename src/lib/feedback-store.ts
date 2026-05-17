export type FeedbackVote = "up" | "down";

export type FeedbackStore = Record<string, FeedbackVote>;

export const FEEDBACK_CHANGED_EVENT = "dc:feedback-changed";
export const FEEDBACK_STORAGE_KEY = "dc.feedback.v1";

export function subscribeFeedbackStore(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(FEEDBACK_CHANGED_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(FEEDBACK_CHANGED_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function readFeedbackStore(): FeedbackStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FeedbackStore) : {};
  } catch {
    return {};
  }
}

export function readFeedbackStoreSnapshot(): string {
  return JSON.stringify(readFeedbackStore());
}

export function writeFeedbackStore(store: FeedbackStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota exceeded or blocked storage; ignore
  }

  window.dispatchEvent(new Event(FEEDBACK_CHANGED_EVENT));
}
