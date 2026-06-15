import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth";

const DB_NAME = "smartzim-downloads";
const DB_VERSION = 1;
const FILES_STORE = "files";
const ITEMS_STORE = "items";

export type DownloadItemType = "note" | "paper";

export interface DownloadFileSpec {
  label: string;
  url: string | null | undefined;
}

export interface DownloadSpec {
  itemType: DownloadItemType;
  itemId: number;
  title: string;
  subject?: string | null;
  files: DownloadFileSpec[];
}

export interface DownloadedFile {
  label: string;
  url: string;
  size: number;
  mime: string;
}

export interface DownloadedItem {
  key: string;
  userId: string;
  itemType: DownloadItemType;
  itemId: number;
  title: string;
  subject: string | null;
  files: DownloadedFile[];
  totalBytes: number;
  createdAt: number;
}

interface StoredFile {
  blob: Blob;
  mime: string;
  size: number;
}

export type OpenFileResult = "offline" | "network" | "unavailable";

interface DownloadsContextValue {
  items: DownloadedItem[];
  totalBytes: number;
  isReady: boolean;
  isDownloaded: (type: DownloadItemType, id: number) => boolean;
  isBusy: (type: DownloadItemType, id: number) => boolean;
  downloadItem: (spec: DownloadSpec) => Promise<void>;
  removeItem: (type: DownloadItemType, id: number) => Promise<void>;
  clearAll: () => Promise<void>;
  getOfflineUrl: (url: string) => Promise<string | null>;
  openFile: (url: string) => Promise<OpenFileResult>;
}

const DownloadsContext = createContext<DownloadsContextValue | undefined>(
  undefined,
);

// --- IndexedDB helpers -----------------------------------------------------

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          db.createObjectStore(FILES_STORE);
        }
        if (!db.objectStoreNames.contains(ITEMS_STORE)) {
          db.createObjectStore(ITEMS_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function fileKey(userId: string, url: string): string {
  return `${userId}::${url}`;
}

function itemKey(userId: string, type: DownloadItemType, id: number): string {
  return `${userId}::${type}::${id}`;
}

async function putFileBlob(
  userId: string,
  url: string,
  file: StoredFile,
): Promise<void> {
  const db = await getDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(FILES_STORE, "readwrite");
    tx.objectStore(FILES_STORE).put(file, fileKey(userId, url));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getFileBlob(
  userId: string,
  url: string,
): Promise<StoredFile | undefined> {
  const db = await getDB();
  return new Promise<StoredFile | undefined>((resolve, reject) => {
    const tx = db.transaction(FILES_STORE, "readonly");
    const req = tx.objectStore(FILES_STORE).get(fileKey(userId, url));
    req.onsuccess = () => resolve(req.result as StoredFile | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function deleteFileBlob(userId: string, url: string): Promise<void> {
  const db = await getDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(FILES_STORE, "readwrite");
    tx.objectStore(FILES_STORE).delete(fileKey(userId, url));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function putItemRecord(item: DownloadedItem): Promise<void> {
  const db = await getDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, "readwrite");
    tx.objectStore(ITEMS_STORE).put(item, item.key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteItemRecord(key: string): Promise<void> {
  const db = await getDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, "readwrite");
    tx.objectStore(ITEMS_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllItemsForUser(userId: string): Promise<DownloadedItem[]> {
  const db = await getDB();
  return new Promise<DownloadedItem[]>((resolve, reject) => {
    const tx = db.transaction(ITEMS_STORE, "readonly");
    const req = tx.objectStore(ITEMS_STORE).getAll();
    req.onsuccess = () =>
      resolve(
        (req.result as DownloadedItem[]).filter((i) => i.userId === userId),
      );
    req.onerror = () => reject(req.error);
  });
}

// --- Provider --------------------------------------------------------------

export function DownloadsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id != null ? String(user.id) : null;

  const [items, setItems] = useState<DownloadedItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [busyKeys, setBusyKeys] = useState<Record<string, boolean>>({});
  const objectUrls = useRef<Map<string, string>>(new Map());

  const refresh = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setIsReady(true);
      return;
    }
    try {
      const all = await getAllItemsForUser(userId);
      all.sort((a, b) => b.createdAt - a.createdAt);
      setItems(all);
    } catch {
      setItems([]);
    } finally {
      setIsReady(true);
    }
  }, [userId]);

  useEffect(() => {
    setIsReady(false);
    refresh();
  }, [refresh]);

  const isDownloaded = useCallback(
    (type: DownloadItemType, id: number) =>
      items.some((i) => i.itemType === type && i.itemId === id),
    [items],
  );

  const isBusy = useCallback(
    (type: DownloadItemType, id: number) =>
      userId ? !!busyKeys[itemKey(userId, type, id)] : false,
    [busyKeys, userId],
  );

  const downloadItem = useCallback(
    async (spec: DownloadSpec) => {
      if (!userId) throw new Error("You must be signed in to download.");
      const key = itemKey(userId, spec.itemType, spec.itemId);
      setBusyKeys((b) => ({ ...b, [key]: true }));
      try {
        const downloaded: DownloadedFile[] = [];
        for (const f of spec.files) {
          if (!f.url) continue;
          const res = await fetch(f.url, { credentials: "include" });
          if (!res.ok) {
            throw new Error(`Could not download ${f.label} (${res.status}).`);
          }
          const blob = await res.blob();
          const mime =
            blob.type ||
            res.headers.get("content-type") ||
            "application/octet-stream";
          await putFileBlob(userId, f.url, { blob, mime, size: blob.size });
          downloaded.push({ label: f.label, url: f.url, size: blob.size, mime });
        }
        const record: DownloadedItem = {
          key,
          userId,
          itemType: spec.itemType,
          itemId: spec.itemId,
          title: spec.title,
          subject: spec.subject ?? null,
          files: downloaded,
          totalBytes: downloaded.reduce((s, f) => s + f.size, 0),
          createdAt: Date.now(),
        };
        await putItemRecord(record);
        await refresh();
      } finally {
        setBusyKeys((b) => {
          const next = { ...b };
          delete next[key];
          return next;
        });
      }
    },
    [userId, refresh],
  );

  const removeItem = useCallback(
    async (type: DownloadItemType, id: number) => {
      if (!userId) return;
      const key = itemKey(userId, type, id);
      const item = items.find((i) => i.key === key);
      if (item) {
        for (const f of item.files) {
          const fk = fileKey(userId, f.url);
          const ou = objectUrls.current.get(fk);
          if (ou) {
            URL.revokeObjectURL(ou);
            objectUrls.current.delete(fk);
          }
          await deleteFileBlob(userId, f.url);
        }
      }
      await deleteItemRecord(key);
      await refresh();
    },
    [userId, items, refresh],
  );

  const clearAll = useCallback(async () => {
    if (!userId) return;
    for (const ou of objectUrls.current.values()) URL.revokeObjectURL(ou);
    objectUrls.current.clear();
    const all = await getAllItemsForUser(userId);
    for (const item of all) {
      for (const f of item.files) await deleteFileBlob(userId, f.url);
      await deleteItemRecord(item.key);
    }
    await refresh();
  }, [userId, refresh]);

  const getOfflineUrl = useCallback(
    async (url: string): Promise<string | null> => {
      if (!userId) return null;
      const fk = fileKey(userId, url);
      const existing = objectUrls.current.get(fk);
      if (existing) return existing;
      const rec = await getFileBlob(userId, url);
      if (!rec) return null;
      const ou = URL.createObjectURL(rec.blob);
      objectUrls.current.set(fk, ou);
      return ou;
    },
    [userId],
  );

  const openFile = useCallback(
    async (url: string): Promise<OpenFileResult> => {
      const blobUrl = await getOfflineUrl(url);
      if (blobUrl) {
        window.open(blobUrl, "_blank", "noopener,noreferrer");
        return "offline";
      }
      if (typeof navigator !== "undefined" && navigator.onLine) {
        window.open(url, "_blank", "noopener,noreferrer");
        return "network";
      }
      return "unavailable";
    },
    [getOfflineUrl],
  );

  // Revoke any live object URLs when the active user changes / unmounts.
  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const ou of urls.values()) URL.revokeObjectURL(ou);
      urls.clear();
    };
  }, [userId]);

  const totalBytes = items.reduce((s, i) => s + i.totalBytes, 0);

  const value: DownloadsContextValue = {
    items,
    totalBytes,
    isReady,
    isDownloaded,
    isBusy,
    downloadItem,
    removeItem,
    clearAll,
    getOfflineUrl,
    openFile,
  };

  return (
    <DownloadsContext.Provider value={value}>
      {children}
    </DownloadsContext.Provider>
  );
}

export function useDownloads(): DownloadsContextValue {
  const ctx = useContext(DownloadsContext);
  if (!ctx) {
    throw new Error("useDownloads must be used within a DownloadsProvider");
  }
  return ctx;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}
