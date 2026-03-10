#!/usr/bin/env node
import { program } from "commander";
import qrTerminal from "qrcode-terminal";
import { startServer, onStatusChange } from "./server.js";
import { startTunnel } from "./tunnel.js";
import type { Room } from "./room.js";

program
  .name("hotmic")
  .description("Disposable voice rooms from your terminal. One command, one QR code, zero signup.")
  .version("1.0.0")
  .option("-p, --port <number>", "port to serve on", (v) => parseInt(v), 0)
  .option("-t, --ttl <minutes>", "room TTL in minutes", (v) => parseInt(v), 60)
  .option("-n, --name <name>", "room name")
  .option("-m, --max <number>", "max participants", (v) => parseInt(v), 8)
  .option("--password <secret>", "room password")
  .option("--public", "expose via Cloudflare tunnel")
  .option("--https", "self-signed HTTPS for LAN (mic access without --public)")
  .option("--persist", "room stays open until everyone leaves")
  .parse();

const opts = program.opts();
const port = opts.port || (3000 + Math.floor(Math.random() * 6000));
const ttl = opts.persist ? 0 : opts.ttl;

let statusLine = 0;

function printStatus(room: Room) {
  const parts = Array.from(room.participants.values());
  if (parts.length === 0) return;
  const lines = parts.map(p => {
    const icon = !p.ws ? "⚫" : p.muted ? "🔇" : p.speaking ? "🔊" : "🎤";
    const status = !p.ws ? "(offline)" : p.muted ? "(muted)" : p.speaking ? "(speaking)" : "";
    return `  ${icon} ${p.name} ${status}`;
  });
  process.stdout.write(`\x1b[s\x1b[${statusLine}H\x1b[0J`);
  console.log("  \x1b[2mParticipants:\x1b[0m");
  for (const l of lines) console.log(l);
  console.log("");
  process.stdout.write("\x1b[u");
}

onStatusChange((room) => { if (statusLine > 0) printStatus(room); });

startServer(
  { port, name: opts.name, password: opts.password, max: opts.max, ttl, https: opts.https },
  async (localUrl, room) => {
    let shareUrl = localUrl;

    const mode = opts.public ? "public" : opts.https ? "https" : "local";
    const modeLabel = mode === "public" ? "\x1b[33m(public mode)\x1b[0m"
      : mode === "https" ? "\x1b[32m(HTTPS)\x1b[0m" : "";

    console.log("");
    console.log(`  \x1b[36m\x1b[1m🎙️ hotmic\x1b[0m  ${modeLabel}`);

    if (opts.public) {
      console.log("");
      try {
        const tunnelBase = await startTunnel(port);
        shareUrl = `${tunnelBase}/room/${room.id}`;
        console.log("  \x1b[32m✓ Tunnel active\x1b[0m");
      } catch (err: any) {
        console.log(`  \x1b[31m✗ Tunnel failed: ${err.message}\x1b[0m`);
      }
    }

    if (opts.https && !opts.public) {
      console.log("");
      console.log("  \x1b[2m⚠ Your browser will show a security warning.\x1b[0m");
      console.log("  \x1b[2m  Click \"Advanced\" → \"Proceed\" to accept the self-signed cert.\x1b[0m");
      console.log("  \x1b[2m  You only need to do this once per device.\x1b[0m");
    }

    console.log("");
    console.log(`  Room:  \x1b[1m${room.name}\x1b[0m`);
    console.log(`  TTL:   ${room.ttlMinutes === 0 ? "Until empty (persist mode)" : room.ttlMinutes + " minutes"}`);
    console.log(`  Max:   ${room.maxParticipants} participants`);
    if (room.password) console.log("  🔒    Password-protected");
    console.log("");
    console.log(`  \x1b[4m${shareUrl}\x1b[0m`);
    if (opts.public && shareUrl !== localUrl) {
      console.log(`  \x1b[2mLocal: ${localUrl}\x1b[0m`);
    }
    console.log("");
    qrTerminal.generate(shareUrl, { small: true }, (qr: string) => {
      console.log(qr);
      console.log("");
      console.log("  \x1b[2mScan the QR code or share the URL. Ctrl+C to close.\x1b[0m");
      console.log("");
      statusLine = (qr.split("\n").length) + 22;
    });
  }
);
