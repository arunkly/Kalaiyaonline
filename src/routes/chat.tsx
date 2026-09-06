import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CheckCheck, MoreVertical, Search, Send, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  acceptFriend,
  listFriends,
  listMembers,
  listMessages,
  requestFriend,
  sendMessage,
  type ChatMessage,
  type FriendRow,
  type SocialUser,
} from "@/lib/social";

export const Route = createFileRoute("/chat")({ component: ChatPage });

function timeLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ne-NP", { hour: "2-digit", minute: "2-digit" });
}

function Avatar({ name, photo }: { name: string; photo?: string | null }) {
  if (photo) {
    return <img src={photo} alt="" className="size-11 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#dfe5e7] text-sm font-bold text-[#54656f]">
      {name.charAt(0)}
    </span>
  );
}

function ChatPage() {
  const { user, isPending } = useCurrentUserState();
  const [people, setPeople] = useState<SocialUser[]>([]);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [peer, setPeer] = useState<FriendRow | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"chats" | "people">("chats");
  const scroller = useRef<HTMLDivElement>(null);

  async function refresh() {
    const [m, f] = await Promise.all([listMembers(), listFriends()]);
    setPeople(m);
    setFriends(f);
  }

  useEffect(() => {
    if (user) void refresh().catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!peer) return;
    void listMessages({ data: { peerId: peer.id } }).then(setMessages);
    const id = window.setInterval(() => {
      void listMessages({ data: { peerId: peer.id } }).then(setMessages);
    }, 4000);
    return () => window.clearInterval(id);
  }, [peer]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages.length, peer?.id]);

  if (isPending) return <div className="h-96 animate-pulse rounded-2xl bg-chip" />;
  if (!user) return <RedirectToSignIn />;

  const accepted = friends.filter((f) => f.status === "accepted");
  const incoming = friends.filter((f) => f.incoming);
  const friendIds = new Set(friends.map((f) => f.id));
  const shownFriends = accepted.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));
  const shownPeople = people
    .filter((p) => !friendIds.has(p.id))
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="-mx-4 -mt-2 overflow-hidden border border-line bg-[#fff] sm:mx-0 sm:mt-0 sm:rounded-2xl lg:-mt-2">
      <div className="grid min-h-[72dvh] lg:grid-cols-12">
        <aside className={`flex flex-col border-r border-[#e9edef] bg-white lg:col-span-4 ${peer ? "hidden lg:flex" : "flex"}`}>
          <div className="flex items-center justify-between bg-[#148a4c] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-white/20 font-bold">
                {(user.displayName || "स").charAt(0)}
              </span>
              <p className="font-semibold">च्याट</p>
            </div>
            <MoreVertical className="size-5 opacity-80" />
          </div>
          <div className="bg-[#f0f2f5] px-3 py-2">
            <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
              <Search className="size-4 text-[#54656f]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="खोज्नुहोस्"
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
          </div>
          <div className="flex border-b border-[#e9edef] text-sm font-semibold">
            <button
              type="button"
              onClick={() => setTab("chats")}
              className={`flex-1 py-3 ${tab === "chats" ? "border-b-2 border-[#148a4c] text-[#148a4c]" : "text-[#667781]"}`}
            >
              च्याट
            </button>
            <button
              type="button"
              onClick={() => setTab("people")}
              className={`flex-1 py-3 ${tab === "people" ? "border-b-2 border-[#148a4c] text-[#148a4c]" : "text-[#667781]"}`}
            >
              सदस्य
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {incoming.map((f) => (
              <div key={f.id} className="flex items-center gap-3 border-b border-[#f0f2f5] px-4 py-3">
                <Avatar name={f.name} photo={f.photo} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{f.name}</p>
                  <p className="text-xs text-[#667781]">साथी अनुरोध</p>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#148a4c] px-3 py-1 text-xs font-semibold text-white"
                  onClick={() => void acceptFriend({ data: { peerId: f.id } }).then(refresh)}
                >
                  स्वीकार
                </button>
              </div>
            ))}
            {tab === "chats"
              ? shownFriends.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPeer(f)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f5f6f6] ${
                      peer?.id === f.id ? "bg-[#f0f2f5]" : ""
                    }`}
                  >
                    <Avatar name={f.name} photo={f.photo} />
                    <div className="min-w-0 flex-1 border-b border-[#f0f2f5] pb-3">
                      <p className="truncate font-semibold">{f.name}</p>
                      <p className="truncate text-xs text-[#667781]">च्याट खोल्नुहोस्</p>
                    </div>
                  </button>
                ))
              : shownPeople.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={p.name} photo={p.photo} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.name}</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-[#148a4c] px-3 py-1 text-xs font-semibold text-[#148a4c]"
                      onClick={() => void requestFriend({ data: { peerId: p.id } }).then(refresh)}
                    >
                      साथी
                    </button>
                  </div>
                ))}
            {tab === "chats" && shownFriends.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[#667781]">अहिले च्याट छैन</p>
            ) : null}
          </div>
        </aside>

        <section className={`flex min-h-[72dvh] flex-col lg:col-span-8 ${peer ? "flex" : "hidden lg:flex"}`}>
          {peer ? (
            <>
              <header className="flex items-center gap-3 bg-[#148a4c] px-3 py-2 text-white">
                <button type="button" className="lg:hidden" onClick={() => setPeer(null)} aria-label="पछाडि">
                  <ArrowLeft className="size-5" />
                </button>
                <Avatar name={peer.name} photo={peer.photo} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{peer.name}</p>
                  <p className="text-xs text-white/80">अनलाइन</p>
                </div>
              </header>
              <div ref={scroller} className="wa-shell min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {messages.map((m) => {
                  const mine = m.fromId === user.id;
                  return (
                    <div key={m.id} className={mine ? "wa-bubble-out" : "wa-bubble-in"}>
                      <p className="text-[15px] leading-snug text-[#111b21]">{m.body}</p>
                      <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-[#667781]">
                        {timeLabel(m.createdAt)}
                        {mine ? <CheckCheck className="size-3.5 text-[#53bdeb]" /> : null}
                      </p>
                    </div>
                  );
                })}
              </div>
              <form
                className="flex items-center gap-2 bg-[#f0f2f5] px-2 py-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const body = text.trim();
                  if (!body) return;
                  void sendMessage({ data: { peerId: peer.id, body } }).then((row) => {
                    if (row) setMessages((list) => [...list, row]);
                    setText("");
                  });
                }}
              >
                <span className="grid size-10 place-items-center text-[#54656f]">
                  <Smile className="size-6" />
                </span>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="सन्देश"
                  className="min-h-11 flex-1 rounded-lg bg-white px-3 text-[15px] outline-none"
                />
                <button
                  type="submit"
                  className="grid size-11 place-items-center rounded-full bg-[#148a4c] text-white"
                  aria-label="पठाउनुहोस्"
                >
                  <Send className="size-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="hidden flex-1 items-center justify-center bg-[#f0f2f5] text-center lg:flex">
              <div>
                <p className="font-display text-3xl text-[#41525d]">KalaiyaOnline च्याट</p>
                <p className="mt-2 text-sm text-[#667781]">बायाँबाट साथी छानेर कुराकानी सुरु गर्नुहोस्।</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
