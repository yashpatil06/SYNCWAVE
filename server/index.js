const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const UPLOAD_DIR = path.join(__dirname, 'uploads')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(UPLOAD_DIR))
app.use(express.static(path.join(__dirname, '../client/build')))

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR)

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, uuidv4() + path.extname(file.originalname)),
})
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } })

// rooms: { [roomId]: { hostId, state, queue, members, permissions } }
const rooms = {}

function createRoom(hostId, hostName) {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
  rooms[roomId] = {
    hostId,
    state: {
      playing: false,
      position: 0,
      timestamp: Date.now(),
      currentTrack: null,
    },
    queue: [],
    members: [{ id: hostId, name: hostName, canControl: true, isHost: true }],
    permissions: {},
  }
  return roomId
}

function getRoom(roomId) {
  return rooms[roomId] || null
}

function getRoomMember(room, socketId) {
  return room.members.find((m) => m.id === socketId)
}

function canControl(room, socketId) {
  if (room.hostId === socketId) return true
  const member = getRoomMember(room, socketId)
  return member && member.canControl
}

// ── REST: Upload audio file ──────────────────────────────────────────────────
app.post('/upload', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({
    url: `/uploads/${req.file.filename}`,
    name: req.originalname || req.file.originalname,
    type: 'upload',
  })
})

// ── REST: Room info ──────────────────────────────────────────────────────────
app.get('/room/:roomId', (req, res) => {
  const room = getRoom(req.params.roomId.toUpperCase())
  if (!room) return res.status(404).json({ error: 'Room not found' })
  res.json({ members: room.members, queue: room.queue, state: room.state })
})

// ── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Create room
  socket.on('create_room', ({ name }) => {
    const roomId = createRoom(socket.id, name || 'Host')
    socket.join(roomId)
    socket.data.roomId = roomId
    socket.data.name = name
    socket.emit('room_created', { roomId, room: rooms[roomId] })
    console.log(`Room ${roomId} created by ${name}`)
  })

  // Join room
  socket.on('join_room', ({ roomId, name }) => {
    const id = roomId.toUpperCase()
    const room = getRoom(id)
    if (!room) {
      socket.emit('error', { message: 'Room not found' })
      return
    }
    if (room.members.find((m) => m.id === socket.id)) {
      socket.emit('room_joined', {
        roomId: id,
        room,
        isHost: room.hostId === socket.id,
      })
      return
    }
    const member = {
      id: socket.id,
      name: name || 'Listener',
      canControl: false,
      isHost: false,
    }
    room.members.push(member)
    socket.join(id)
    socket.data.roomId = id
    socket.data.name = name

    // Send current state to new joiner
    const currentState = { ...room.state, serverTime: Date.now() }
    socket.emit('room_joined', {
      roomId: id,
      room,
      isHost: false,
      currentState,
    })

    // Notify others
    io.to(id).emit('members_updated', { members: room.members })
    socket.to(id).emit('user_joined', { name, id: socket.id })
    console.log(`${name} joined room ${id}`)
  })

  // Play / Pause
  socket.on('play_pause', ({ roomId, playing, position }) => {
    const room = getRoom(roomId)
    if (!room || !canControl(room, socket.id)) return
    room.state.playing = playing
    room.state.position = position
    room.state.timestamp = Date.now()
    io.to(roomId).emit('sync_state', { ...room.state, serverTime: Date.now() })
  })

  // Seek
  socket.on('seek', ({ roomId, position }) => {
    const room = getRoom(roomId)
    if (!room || !canControl(room, socket.id)) return
    room.state.position = position
    room.state.timestamp = Date.now()
    io.to(roomId).emit('sync_state', { ...room.state, serverTime: Date.now() })
  })

  // Add to queue
  socket.on('add_to_queue', ({ roomId, track }) => {
    const room = getRoom(roomId)
    if (!room || !canControl(room, socket.id)) return
    const entry = { ...track, id: uuidv4(), addedBy: socket.data.name }
    room.queue.push(entry)
    if (!room.state.currentTrack) {
      room.state.currentTrack = entry
      room.state.position = 0
      room.state.timestamp = Date.now()
    }
    io.to(roomId).emit('queue_updated', {
      queue: room.queue,
      state: room.state,
    })
  })

  // Next track
  socket.on('next_track', ({ roomId }) => {
    const room = getRoom(roomId)
    if (!room || !canControl(room, socket.id)) return
    const idx = room.queue.findIndex(
      (t) => t.id === room.state.currentTrack?.id,
    )
    const next = room.queue[idx + 1] || null
    room.state.currentTrack = next
    room.state.position = 0
    room.state.playing = !!next
    room.state.timestamp = Date.now()
    io.to(roomId).emit('queue_updated', {
      queue: room.queue,
      state: room.state,
    })
    io.to(roomId).emit('sync_state', { ...room.state, serverTime: Date.now() })
  })

  // Prev track
  socket.on('prev_track', ({ roomId }) => {
    const room = getRoom(roomId)
    if (!room || !canControl(room, socket.id)) return
    const idx = room.queue.findIndex(
      (t) => t.id === room.state.currentTrack?.id,
    )
    const prev = idx > 0 ? room.queue[idx - 1] : room.queue[0]
    room.state.currentTrack = prev || null
    room.state.position = 0
    room.state.playing = !!prev
    room.state.timestamp = Date.now()
    io.to(roomId).emit('queue_updated', {
      queue: room.queue,
      state: room.state,
    })
    io.to(roomId).emit('sync_state', { ...room.state, serverTime: Date.now() })
  })

  // Remove from queue
  socket.on('remove_from_queue', ({ roomId, trackId }) => {
    const room = getRoom(roomId)
    if (!room || !canControl(room, socket.id)) return
    room.queue = room.queue.filter((t) => t.id !== trackId)
    io.to(roomId).emit('queue_updated', {
      queue: room.queue,
      state: room.state,
    })
  })

  // Host: toggle permission for a listener
  socket.on('toggle_permission', ({ roomId, memberId }) => {
    const room = getRoom(roomId)
    if (!room || room.hostId !== socket.id) return
    const member = getRoomMember(room, memberId)
    if (!member || member.isHost) return
    member.canControl = !member.canControl
    io.to(roomId).emit('members_updated', { members: room.members })
    io.to(memberId).emit('permission_changed', {
      canControl: member.canControl,
    })
  })

  // Chat message
  socket.on('chat_message', ({ roomId, text }) => {
    const room = getRoom(roomId)
    if (!room) return
    const member = getRoomMember(room, socket.id)
    io.to(roomId).emit('chat_message', {
      id: uuidv4(),
      from: member?.name || 'Unknown',
      text,
      time: Date.now(),
    })
  })

  // YouTube stream track
  socket.on('stream_track', ({ roomId, youtubeId, title, thumbnail }) => {
    const room = getRoom(roomId)
    if (!room || !canControl(room, socket.id)) return
    const entry = {
      id: uuidv4(),
      name: title,
      type: 'youtube',
      youtubeId,
      thumbnail,
      addedBy: socket.data.name,
    }
    room.queue.push(entry)
    if (!room.state.currentTrack) {
      room.state.currentTrack = entry
      room.state.position = 0
      room.state.timestamp = Date.now()
    }
    io.to(roomId).emit('queue_updated', {
      queue: room.queue,
      state: room.state,
    })
  })

  // Request sync (new joiner asking for current position)
  socket.on('request_sync', ({ roomId }) => {
    const room = getRoom(roomId)
    if (!room) return
    socket.emit('sync_state', { ...room.state, serverTime: Date.now() })
  })

  // Disconnect
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId
    if (!roomId) return
    const room = getRoom(roomId)
    if (!room) return
    room.members = room.members.filter((m) => m.id !== socket.id)
    if (room.hostId === socket.id) {
      // Host left — dissolve room
      io.to(roomId).emit('room_dissolved', { message: 'Host left the room' })
      delete rooms[roomId]
    } else {
      io.to(roomId).emit('members_updated', { members: room.members })
      socket.to(roomId).emit('user_left', { name: socket.data.name })
    }
    console.log(`${socket.data.name} disconnected from ${roomId}`)
  })
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'))
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () =>
  console.log(`SyncWave server running on port ${PORT}`),
)
