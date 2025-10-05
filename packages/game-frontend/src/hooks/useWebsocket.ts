import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import {
  wsAtom,
  wsHandlersAtom,
  type PacketCallback,
} from "../stores/jotaiStore";
import type {
  ServerPacketMap,
  ClientPacketMap,
  ServerPacketType,
} from "@mansion/shared/types/packets";

type ServerPacket = {
  type: ServerPacketType;
  data: ServerPacketMap[ServerPacketType];
};

export default function useWebsocket() {
  const [ws, setWs] = useAtom(wsAtom);
  const [handlers, setHandlers] = useAtom(wsHandlersAtom);

  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (ws) return;

    const _ws = new WebSocket("wss://tunnel.gche.me/ws");

    _ws.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data) as ServerPacket;

        for (const cb of handlersRef.current.get(type) ?? []) cb(data);
      } catch (err) {
        console.error("Invalid WS message", err);
      }
    };

    _ws.onclose = () => {
      setWs(null);
      console.warn("WebSocket closed");
    };

    _ws.onopen = () => {
      setWs(_ws);
      console.log("WebSocket connected");
    };

    return () => _ws.close();
  }, []);

  const send = <T extends keyof ClientPacketMap>(
    type: T,
    data?: ClientPacketMap[T]
  ) => {
    ws?.send(JSON.stringify({ type, data }));
  };

  const removeHandler = <T extends keyof ServerPacketMap>(
    type: T,
    callback: (d: ServerPacketMap[T]) => void
  ) => {
    setHandlers((prev) => {
      const next = new Map(prev);
      const setForType = new Set(next.get(type) ?? []);
      setForType.delete(callback as PacketCallback);

      if (setForType.size === 0) {
        next.delete(type);
      } else {
        next.set(type, setForType);
      }

      return next;
    });
  };

  const addHandler = <T extends keyof ServerPacketMap>(
    type: T,
    callback: (d: ServerPacketMap[T]) => void
  ) => {
    setHandlers((prev) => {
      const next = new Map(prev);
      const setForType = new Set(next.get(type) ?? []);
      setForType.add(callback as PacketCallback);
      next.set(type, setForType);
      return next;
    });

    return () => removeHandler(type, callback);
  };

  return { send, addHandler, removeHandler, open: !!ws };
}
