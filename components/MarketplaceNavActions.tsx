"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  created_at: string;
  read_at: string | null;
};

type Props = {
  accountType: "client" | "freelancer";
};

function formatTime(value: string) {
  const date = new Date(value);
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function MarketplaceNavActions({ accountType }: Props) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    try {
      const response = await fetch("/api/notifications?limit=20", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = await response.json();
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } catch {
      // Notifications are non-blocking; keep the marketplace usable.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 10000);
    return () => window.clearInterval(interval);
  }, []);

  const unread = useMemo(
    () => items.filter((item) => !item.read_at),
    [items]
  );

  const requestUnread = unread.filter((item) =>
    accountType === "freelancer"
      ? item.type === "project_request"
      : item.type === "request_status"
  ).length;

  const messageUnread = unread.filter((item) => item.type === "message").length;

  async function markRead(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read_at: new Date().toISOString() } : item
      )
    );

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => undefined);
  }

  async function markAllRead() {
    setItems((current) =>
      current.map((item) => ({
        ...item,
        read_at: item.read_at || new Date().toISOString(),
      }))
    );

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => undefined);
  }

  return (
    <>
      <Link
        href="/creators"
        className="hidden rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 lg:inline-flex"
      >
        Browse Creators
      </Link>

      <Link
        href={accountType === "freelancer" ? "/requests" : "/my-requests"}
        className="relative hidden rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 md:inline-flex"
      >
        {accountType === "freelancer" ? "Requests" : "My Requests"}
        {requestUnread > 0 && <Badge count={requestUnread} />}
      </Link>

      <Link
        href="/dashboard/messages"
        aria-label={`Messages${messageUnread ? `, ${messageUnread} unread` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
      >
        ✉
        {messageUnread > 0 && <Badge count={messageUnread} />}
      </Link>

      <div className="relative">
        <button
          type="button"
          aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`}
          onClick={() => setOpen((value) => !value)}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
        >
          ♢
          {unread.length > 0 && <Badge count={unread.length} />}
        </button>

        {open && (
          <div className="absolute right-0 top-12 z-[120] w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-24px_rgba(15,23,42,.35)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-black text-slate-950">Notifications</p>
                <p className="text-xs text-slate-500">
                  {unread.length ? `${unread.length} unread` : "You're all caught up"}
                </p>
              </div>
              {unread.length > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">Loading notifications...</div>
              ) : items.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg">♢</div>
                  <p className="mt-3 text-sm font-bold text-slate-800">No notifications yet</p>
                  <p className="mt-1 text-xs text-slate-500">New requests, messages and updates will appear here.</p>
                </div>
              ) : (
                items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.link || "/notifications"}
                    onClick={() => {
                      if (!item.read_at) markRead(item.id);
                      setOpen(false);
                    }}
                    className={`block border-b border-slate-100 px-4 py-3.5 transition hover:bg-slate-50 ${
                      !item.read_at ? "bg-blue-50/55" : "bg-white"
                    }`}
                  >
                    <div className="flex gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${!item.read_at ? "bg-red-500" : "bg-slate-300"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-bold text-slate-900">{item.title}</p>
                          <span className="shrink-0 text-[10px] font-semibold text-slate-400">{formatTime(item.created_at)}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.message}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-slate-100 px-4 py-3 text-center text-xs font-black text-blue-600 hover:bg-slate-50"
            >
              View all notifications →
            </Link>
          </div>
        )}
      </div>

      <Link
        href="/profile"
        className="hidden rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
      >
        My Profile
      </Link>

      <form action="/auth/signout" method="post">
        <button className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
          Log out
        </button>
      </form>
    </>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="absolute -right-0.5 -top-1 flex min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-black leading-[14px] text-white shadow-sm">
      {count > 99 ? "99+" : count}
    </span>
  );
}
