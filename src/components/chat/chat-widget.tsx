"use client"

import * as React from "react"
import { io, Socket } from "socket.io-client"
import { Send, MessageSquare, Circle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"

interface ChatRoom {
  id: string
  name: string
  campaignId: string | null
  campaign: {
    id: string
    title: string
    vendorId: string
    vendor: { name: string | null; email: string; isOnline: boolean }
  } | null
  members: { user: { id: string; name: string | null; email: string; role: string; isOnline: boolean } }[]
  _count?: { messages: number }
}

interface ChatMessage {
  id: string
  roomId: string
  userId: string
  content: string
  createdAt: string
  user: { id: string; name: string | null; email: string; role: string }
}

export function ChatWidget() {
  const { user } = useAuth()
  const [rooms, setRooms] = React.useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = React.useState<ChatRoom | null>(null)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [loadingRooms, setLoadingRooms] = React.useState(true)
  const [loadingMsgs, setLoadingMsgs] = React.useState(false)
  const [connected, setConnected] = React.useState(false)
  const [presence, setPresence] = React.useState<Record<string, boolean>>({})
  const [typingUsers, setTypingUsers] = React.useState<Record<string, string>>({})
  const socketRef = React.useRef<Socket | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Load rooms
  const loadRooms = React.useCallback(async () => {
    setLoadingRooms(true)
    try {
      const res = await fetch("/api/chat/rooms")
      const data = await res.json()
      setRooms(data.rooms || [])
      // initial presence from members
      const p: Record<string, boolean> = {}
      for (const r of data.rooms || []) {
        for (const m of r.members || []) {
          p[m.user.id] = m.user.isOnline
        }
      }
      setPresence(p)
    } catch {
    } finally {
      setLoadingRooms(false)
    }
  }, [])

  React.useEffect(() => {
    loadRooms()
  }, [loadRooms])

  // Socket connection
  React.useEffect(() => {
    if (!user) return
    const socket = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      reconnection: true,
    })
    socketRef.current = socket

    socket.on("connect", () => {
      setConnected(true)
      socket.emit("auth", { userId: user.id })
    })
    socket.on("disconnect", () => setConnected(false))
    socket.on("message", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })
    socket.on("presence", ({ userId, online }: { userId: string; online: boolean }) => {
      setPresence((prev) => ({ ...prev, [userId]: online }))
    })
    socket.on("typing", ({ userId, name, isTyping }: { userId: string; name: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = { ...prev }
        if (isTyping && userId !== user.id) next[userId] = name
        else delete next[userId]
        return next
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [user])

  // Load messages when active room changes
  React.useEffect(() => {
    if (!activeRoom) return
    setLoadingMsgs(true)
    setMessages([])
    fetch(`/api/chat/messages?roomId=${activeRoom.id}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .finally(() => setLoadingMsgs(false))
    socketRef.current?.emit("join", { roomId: activeRoom.id })
  }, [activeRoom])

  // Auto scroll
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const send = () => {
    if (!input.trim() || !activeRoom || !socketRef.current) return
    const content = input.trim()
    setInput("")
    socketRef.current.emit("message", { roomId: activeRoom.id, content })
    socketRef.current.emit("typing", { roomId: activeRoom.id, isTyping: false })
  }

  const onInputChange = (v: string) => {
    setInput(v)
    if (activeRoom && socketRef.current) {
      socketRef.current.emit("typing", { roomId: activeRoom.id, isTyping: v.length > 0 })
    }
  }

  if (loadingRooms) {
    return (
      <div className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading conversations…
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="font-headline text-lg mb-1">No conversations yet</p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {user?.role === "affiliate"
            ? "Take a deal to start chatting with the vendor about an offer."
            : "When an affiliate takes one of your campaigns, a group chat is created here."}
        </p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-0 rounded-xl border border-border overflow-hidden h-[560px]">
      {/* Room list */}
      <div className="border-r border-border bg-secondary/30 flex flex-col">
        <div className="p-3 border-b border-border">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {rooms.map((room) => {
            const vendorOnline = room.campaign?.vendor?.isOnline ?? presence[room.campaign?.vendorId || ""]
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room)}
                className={cn(
                  "w-full text-left px-3 py-3 border-b border-border/60 hover:bg-accent/50 transition-colors",
                  activeRoom?.id === room.id && "bg-accent"
                )}
              >
                <p className="text-sm truncate font-medium">{room.campaign?.title || room.name}</p>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <Circle
                    className={cn("h-2 w-2 fill-current", vendorOnline ? "text-emerald-500" : "text-muted-foreground/40")}
                  />
                  {room.campaign?.vendor?.name || room.campaign?.vendor?.email || "Vendor"}
                  {vendorOnline ? " · online" : " · offline"}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-col min-w-0">
        {activeRoom ? (
          <>
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm truncate">{activeRoom.campaign?.title || activeRoom.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Circle className={cn("h-2 w-2 fill-current", (activeRoom.campaign?.vendor?.isOnline ?? presence[activeRoom.campaign?.vendorId || ""]) ? "text-emerald-500" : "text-muted-foreground/40")} />
                  {activeRoom.campaign?.vendor?.name || "Vendor"} · group chat
                </p>
              </div>
              <span className={cn("text-[10px] flex items-center gap-1", connected ? "text-emerald-500" : "text-muted-foreground")}>
                <Circle className="h-1.5 w-1.5 fill-current" /> {connected ? "live" : "connecting"}
              </span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
              {loadingMsgs ? (
                <p className="text-center text-sm text-muted-foreground">Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Start the conversation 👋</p>
              ) : (
                messages.map((m) => {
                  const mine = m.userId === user?.id
                  return (
                    <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {mine ? "You" : m.user.name || m.user.email}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {m.user.role === "affiliate" ? "Affiliate" : m.user.role === "vendor_digital" ? "Builder" : "Vendor"}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                          mine
                            ? "bg-foreground text-background rounded-br-sm"
                            : "bg-secondary text-foreground rounded-bl-sm"
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  )
                })
              )}
              {Object.keys(typingUsers).length > 0 && (
                <p className="text-xs text-muted-foreground italic">
                  {Object.values(typingUsers).join(", ")} typing…
                </p>
              )}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a message…"
                className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
              />
              <Button size="icon" className="h-10 w-10" onClick={send} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  )
}
