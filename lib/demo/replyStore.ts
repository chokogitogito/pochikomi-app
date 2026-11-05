"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEMO_REPLY_STORAGE_KEY,
  initialReplyState,
  parseReplyState,
  serializeReplyState,
  type DemoReplyState,
} from "@/lib/demo/reviews";

/**
 * 返信デモの状態を sessionStorage（＝このブラウザタブの閲覧セッション）で保持する外部ストア。
 * sessionStorage が使えない環境ではメモリ上でのみ保持する。DB・サーバーへは何も送らない。
 */
const listeners = new Set<() => void>();
const SERVER_SNAPSHOT = initialReplyState();

let cachedRaw: string | null | undefined;
let cachedState: DemoReplyState = SERVER_SNAPSHOT;
let memoryOnly: DemoReplyState | null = null;

function getSnapshot(): DemoReplyState {
  if (memoryOnly) return memoryOnly;
  let raw: string | null;
  try {
    raw = window.sessionStorage.getItem(DEMO_REPLY_STORAGE_KEY);
  } catch {
    return cachedState;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedState = parseReplyState(raw);
  }
  return cachedState;
}

function getServerSnapshot(): DemoReplyState {
  return SERVER_SNAPSHOT;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

function write(next: DemoReplyState) {
  try {
    window.sessionStorage.setItem(DEMO_REPLY_STORAGE_KEY, serializeReplyState(next));
    memoryOnly = null;
  } catch {
    memoryOnly = next;
  }
  cachedRaw = undefined; // 次の読み取りで保存内容から再構築する
  cachedState = next;
  emit();
}

export function useDemoReplyState() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((updater: (prev: DemoReplyState) => DemoReplyState) => {
    write(updater(getSnapshot()));
  }, []);

  const reset = useCallback(() => {
    try {
      window.sessionStorage.removeItem(DEMO_REPLY_STORAGE_KEY);
    } catch {
      // 保存先が使えなくても、メモリ上の状態は初期化される
    }
    memoryOnly = null;
    cachedRaw = undefined;
    cachedState = initialReplyState();
    emit();
  }, []);

  return { state, update, reset };
}
