import asyncio
import logging
from collections import deque
from pathlib import Path

import websockets

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

connected_clients = set()
HISTORY_FILE = Path(__file__).resolve().parent / "chat_history.txt"
HISTORY_LIMIT = 20


def load_history():
    """Read the latest messages saved during earlier server runs."""
    if not HISTORY_FILE.exists():
        return deque(maxlen=HISTORY_LIMIT)
    with HISTORY_FILE.open("r", encoding="utf-8") as file:
        return deque((line.rstrip("\n") for line in file if line.strip()), maxlen=HISTORY_LIMIT)


history = load_history()


async def broadcast(message):
    if connected_clients:
        await asyncio.gather(
            *(client.send(message) for client in connected_clients),
            return_exceptions=True,
        )


async def handle_connection(websocket):
    # Send stored messages first; register only after replay to avoid duplicates.
    logger.info("Новое подключение: %s", websocket.remote_address)
    try:
        for message in history:
            await websocket.send(message)
        connected_clients.add(websocket)
        async for message in websocket:
            logger.info("Получено сообщение: %s", message)
            # Save every message to disk; the file survives server restarts.
            with HISTORY_FILE.open("a", encoding="utf-8") as file:
                file.write(message.replace("\n", " ").replace("\r", " ") + "\n")
            history.append(message)
            await broadcast(message)
    except websockets.exceptions.ConnectionClosed as exc:
        logger.warning("Соединение закрыто: %s", exc)
    finally:
        connected_clients.discard(websocket)
        logger.info("Клиент отключился: %s", websocket.remote_address)


async def main():
    async with websockets.serve(handle_connection, "localhost", 8765):
        logger.info("WebSocket сервер запущен на ws://localhost:8765")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
