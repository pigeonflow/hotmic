import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import { serve } from "@hono/node-server";
import os from "os";
import {
  createRoom, getRoom, joinRoom, disconnectParticipant, leaveRoom,
  broadcast, sendTo, getParticipantList, type Room,
} from "./room.js";
import { getHTML } from "./html.js";
import QRCode from "qrcode";

type OnReady = (localUrl: string, room: Room) => void;
type StatusCb = (room: Room) => void;

let statusCallback: StatusCb | null = null;
export function onStatusChange(cb: StatusCb) { statusCallback = cb; }

export function startServer(
  opts: { port: number; name?: string; password?: string; max?: number; ttl?: number },
  onReady: OnReady
) {
  const app = new Hono();
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: app as any });

  const room = createRoom({
    name: opts.name,
    password: opts.password,
    max: opts.max,
    ttl: opts.ttl,
  });

  app.get("/room/:id", (c) => {
    const r = getRoom(c.req.param("id") as string);
    if (!r) return c.text("Room not found", 404);
    return c.html(getHTML(r));
  });

  app.get("/room/:id/qr", async (c) => {
    const r = getRoom(c.req.param("id") as string);
    if (!r) return c.text("Room not found", 404);
    const url = c.req.url.replace("/qr", "");
    const svg = await QRCode.toString(url, { type: "svg" });
    return c.body(svg, 200, { "Content-Type": "image/svg+xml" });
  });

  app.get(
    "/room/:id/ws",
    upgradeWebSocket((c) => {
      const roomId = c.req.param("id") as string;
      let deviceId = "" as string;

      return {
        onMessage(evt, ws) {
          try {
            const msg = JSON.parse(typeof evt.data === "string" ? evt.data : evt.data.toString());
            const r = getRoom(roomId);
            if (!r) return;

            switch (msg.type) {
              case "join": {
                deviceId = msg.deviceId;
                const result = joinRoom(roomId, msg.name, msg.deviceId, ws);
                if (!result) {
                  ws.send(JSON.stringify({ type: "error", message: "Room full or not found" }));
                  ws.close();
                  return;
                }
                const { participant, isReconnect } = result;
                const participants = getParticipantList(r);

                ws.send(JSON.stringify({
                  type: "joined",
                  you: participant.deviceId,
                  participants,
                  roomName: r.name,
                }));

                broadcast(roomId, {
                  type: isReconnect ? "peer_reconnected" : "peer_joined",
                  deviceId: participant.deviceId,
                  name: participant.name,
                  participants,
                }, participant.deviceId);

                if (statusCallback) statusCallback(r);
                break;
              }

              case "offer":
              case "answer":
              case "ice-candidate": {
                if (msg.target && deviceId) {
                  sendTo(roomId, msg.target, {
                    type: msg.type,
                    from: deviceId,
                    sdp: msg.sdp,
                    candidate: msg.candidate,
                  });
                }
                break;
              }

              case "mute": {
                if (!deviceId) break;
                const p = r.participants.get(deviceId);
                if (p) {
                  p.muted = msg.muted ?? true;
                  broadcast(roomId, {
                    type: "peer_muted",
                    deviceId,
                    muted: p.muted,
                    participants: getParticipantList(r),
                  });
                  if (statusCallback) statusCallback(r);
                }
                break;
              }

              case "speaking": {
                if (!deviceId) break;
                const p = r.participants.get(deviceId);
                if (p) {
                  p.speaking = msg.speaking ?? false;
                  broadcast(roomId, {
                    type: "peer_speaking",
                    deviceId,
                    speaking: p.speaking,
                  }, deviceId);
                }
                break;
              }

              case "leave": {
                if (!deviceId) break;
                leaveRoom(roomId, deviceId);
                broadcast(roomId, {
                  type: "peer_left",
                  deviceId,
                  participants: getParticipantList(r),
                });
                if (statusCallback) statusCallback(r);
                break;
              }
            }
          } catch {}
        },

        onClose() {
          if (deviceId) {
            const r = getRoom(roomId);
            if (r) {
              disconnectParticipant(roomId, deviceId);
              broadcast(roomId, {
                type: "peer_offline",
                deviceId,
                participants: getParticipantList(r),
              });
              if (statusCallback) statusCallback(r);
            }
          }
        },
      };
    })
  );

  const server = serve({ fetch: app.fetch, port: opts.port }, () => {
    injectWebSocket(server);
    const nets = os.networkInterfaces();
    let ip = "localhost";
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === "IPv4" && !net.internal) { ip = net.address; break; }
      }
      if (ip !== "localhost") break;
    }
    const localUrl = `http://${ip}:${opts.port}/room/${room.id}`;
    onReady(localUrl, room);
  });
}
