import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@shms/shared';

let io: SocketIOServer | null = null;

export function initSocketServer(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
  });

  io.on(SOCKET_EVENTS.CONNECT, (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    socket.on('join_role_room', (role: string) => {
      socket.join(`role:${role}`);
      console.log(`[WebSocket] ${socket.id} joined room role:${role}`);
    });

    socket.on('join_resident_room', (residentId: string) => {
      socket.join(`resident:${residentId}`);
      console.log(`[WebSocket] ${socket.id} joined room resident:${residentId}`);
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function broadcastEmergency(data: any) {
  if (!io) return;
  console.log('[WebSocket Alert] Broadcasting emergency siren to all admin & security clients');
  io.emit(SOCKET_EVENTS.EMERGENCY_TRIGGERED, data);
}

export function broadcastEmergencyResolved(data: any) {
  if (!io) return;
  io.emit(SOCKET_EVENTS.EMERGENCY_RESOLVED, data);
}

export function broadcastCurfewAlert(data: any) {
  if (!io) return;
  io.emit(SOCKET_EVENTS.CURFEW_ALERT, data);
}

export function broadcastVisitorOverstay(data: any) {
  if (!io) return;
  io.emit(SOCKET_EVENTS.VISITOR_OVERSTAY_ALERT, data);
}

export function broadcastPassUpdate(data: any) {
  if (!io) return;
  io.emit(SOCKET_EVENTS.PASS_STATUS_UPDATE, data);
}

export function broadcastComplaintUpdate(data: any) {
  if (!io) return;
  io.emit(SOCKET_EVENTS.COMPLAINT_UPDATE, data);
}

export function broadcastNotice(data: any) {
  if (!io) return;
  io.emit(SOCKET_EVENTS.NOTICE_PUBLISHED, data);
}
