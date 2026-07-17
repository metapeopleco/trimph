import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import { PrismaClient } from '/home/z/my-project/node_modules/@prisma/client'

const db = new PrismaClient()

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

interface RoomMember {
  userId: string
  name: string
  email: string
  role: string
}

// socket.id -> { userId, roomIds: Set<string> }
const sockets = new Map<string, { userId: string; roomIds: Set<string> }>()

async function getMember(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  })
  return user
}

async function broadcastOnlineStatus(userId: string, online: boolean) {
  // find all rooms this user is a member of and emit status update
  const memberships = await db.chatRoomMember.findMany({
    where: { userId },
    select: { roomId: true },
  })
  for (const m of memberships) {
    io.to(`room:${m.roomId}`).emit('presence', { userId, online })
  }
}

io.on('connection', (socket: Socket) => {
  console.log(`[chat] connected: ${socket.id}`)

  socket.on('auth', async (data: { userId: string }) => {
    const { userId } = data || {}
    if (!userId) return
    const user = await getMember(userId)
    if (!user) return

    sockets.set(socket.id, { userId, roomIds: new Set() })
    socket.data.userId = userId
    socket.data.name = user.name || user.email

    // mark online
    await db.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeen: new Date() },
    })
    await broadcastOnlineStatus(userId, true)
  })

  socket.on('join', async (data: { roomId: string }) => {
    const { roomId } = data || {}
    if (!roomId) return
    const info = sockets.get(socket.id)
    if (!info) return

    // verify membership
    const member = await db.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId: info.userId } },
    })
    if (!member) return

    socket.join(`room:${roomId}`)
    info.roomIds.add(roomId)
  })

  socket.on('leave', (data: { roomId: string }) => {
    const { roomId } = data || {}
    socket.leave(`room:${roomId}`)
    const info = sockets.get(socket.id)
    if (info) info.roomIds.delete(roomId)
  })

  socket.on('message', async (data: { roomId: string; content: string }) => {
    const { roomId, content } = data || {}
    const info = sockets.get(socket.id)
    if (!info || !roomId || !content?.trim()) return

    // verify membership
    const member = await db.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId: info.userId } },
    })
    if (!member) return

    const message = await db.chatMessage.create({
      data: { roomId, userId: info.userId, content: content.trim().slice(0, 2000) },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    io.to(`room:${roomId}`).emit('message', message)
  })

  socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
    const info = sockets.get(socket.id)
    if (!info) return
    socket.to(`room:${data.roomId}`).emit('typing', {
      userId: info.userId,
      name: socket.data.name,
      isTyping: data.isTyping,
    })
  })

  socket.on('disconnect', async () => {
    const info = sockets.get(socket.id)
    sockets.delete(socket.id)
    if (info) {
      // check if user has any other active sockets
      let stillOnline = false
      for (const s of sockets.values()) {
        if (s.userId === info.userId) {
          stillOnline = true
          break
        }
      }
      if (!stillOnline) {
        await db.user.update({
          where: { id: info.userId },
          data: { isOnline: false, lastSeen: new Date() },
        })
        await broadcastOnlineStatus(info.userId, false)
      }
    }
    console.log(`[chat] disconnected: ${socket.id}`)
  })

  socket.on('error', (err) => {
    console.error(`[chat] socket error (${socket.id}):`, err)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[Trim.ph chat] WebSocket server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0))
})
process.on('SIGINT', () => {
  httpServer.close(() => process.exit(0))
})
