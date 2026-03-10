import { nanoid } from "nanoid";

export interface Participant {
  id: string;
  name: string;
  deviceId: string;
  muted: boolean;
  speaking: boolean;
  ws: any | null;
  joinedAt: number;
}

export interface Room {
  id: string;
  name: string;
  password: string | null;
  maxParticipants: number;
  ttlMinutes: number;
  createdAt: number;
  participants: Map<string, Participant>; // keyed by deviceId
  timer: ReturnType<typeof setTimeout> | null;
}

const rooms = new Map<string, Room>();

export function createRoom(opts: {
  name?: string;
  password?: string;
  max?: number;
  ttl?: number;
}): Room {
  const room: Room = {
    id: nanoid(8),
    name: opts.name || "Voice Room",
    password: opts.password || null,
    maxParticipants: opts.max || 8,
    ttlMinutes: opts.ttl ?? 60,
    createdAt: Date.now(),
    participants: new Map(),
    timer: null,
  };

  if (room.ttlMinutes > 0) {
    room.timer = setTimeout(() => {
      closeRoom(room.id);
    }, room.ttlMinutes * 60_000);
  }

  rooms.set(room.id, room);
  return room;
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id);
}

export function joinRoom(
  roomId: string,
  name: string,
  deviceId: string,
  ws: any
): { participant: Participant; isReconnect: boolean } | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const existing = room.participants.get(deviceId);
  if (existing) {
    // Reconnect — kill old WS if any
    if (existing.ws) {
      try { existing.ws.close(); } catch {}
    }
    existing.ws = ws;
    existing.name = name;
    return { participant: existing, isReconnect: true };
  }

  if (room.participants.size >= room.maxParticipants) return null;

  const participant: Participant = {
    id: nanoid(6),
    name,
    deviceId,
    muted: false,
    speaking: false,
    ws,
    joinedAt: Date.now(),
  };

  room.participants.set(deviceId, participant);
  return { participant, isReconnect: false };
}

export function disconnectParticipant(roomId: string, deviceId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  const p = room.participants.get(deviceId);
  if (p) {
    p.ws = null;
    p.speaking = false;
  }
}

export function leaveRoom(roomId: string, deviceId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  const p = room.participants.get(deviceId);
  if (p?.ws) {
    try { p.ws.close(); } catch {}
  }
  room.participants.delete(deviceId);

  // If persist mode and room empty, close
  if (room.ttlMinutes === 0 && room.participants.size === 0) {
    closeRoom(roomId);
  }
}

export function broadcast(roomId: string, msg: any, excludeDeviceId?: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  const data = JSON.stringify(msg);
  for (const [did, p] of room.participants) {
    if (did === excludeDeviceId) continue;
    if (p.ws) {
      try { p.ws.send(data); } catch {}
    }
  }
}

export function sendTo(roomId: string, deviceId: string, msg: any): void {
  const room = rooms.get(roomId);
  if (!room) return;
  const p = room.participants.get(deviceId);
  if (p?.ws) {
    try { p.ws.send(JSON.stringify(msg)); } catch {}
  }
}

export function getParticipantList(room: Room): Array<{ id: string; name: string; deviceId: string; muted: boolean; online: boolean }> {
  return Array.from(room.participants.values()).map(p => ({
    id: p.id,
    name: p.name,
    deviceId: p.deviceId,
    muted: p.muted,
    online: p.ws !== null,
  }));
}

function closeRoom(id: string): void {
  const room = rooms.get(id);
  if (!room) return;
  for (const p of room.participants.values()) {
    if (p.ws) {
      try { p.ws.send(JSON.stringify({ type: "room_closed" })); p.ws.close(); } catch {}
    }
  }
  if (room.timer) clearTimeout(room.timer);
  rooms.delete(id);
}
