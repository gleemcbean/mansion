import asyncio
import json
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from classes.AudioTrackRelay import AudioTrackRelay
from classes.AudioProcessor import AudioProcessor
from constants.config import WEBSOCKET_URL

pcs = set()
client_processors = {}

async def offer(request):
  params = await request.json()
  offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])
  pc = RTCPeerConnection()
  pcs.add(pc)
  client_id = params.get("uuid", str(id(pc)))
  
  processor = AudioProcessor(client_id, f"{WEBSOCKET_URL}/ws")
  client_processors[client_id] = processor
  await processor.start()
  
  @pc.on("connectionstatechange")
  async def on_connectionstatechange():
    print(f"Client {client_id}: Connection state is {pc.connectionState}")

    if pc.connectionState == "failed" or pc.connectionState == "closed":
      await pc.close()
      pcs.discard(pc)

      if client_id in client_processors:
        await client_processors[client_id].stop()
        del client_processors[client_id]
  
  @pc.on("track")
  def on_track(track):
    if track.kind == "audio":
      relay = AudioTrackRelay(track, processor)
      pc.addTrack(relay)
  
  await pc.setRemoteDescription(offer)
  answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  
  return web.Response(
    content_type="application/json",
    text=json.dumps({
      "sdp": pc.localDescription.sdp,
      "type": pc.localDescription.type,
      "clientId": client_id
    })
  )

async def close(_):
  coros = [pc.close() for pc in pcs]
  await asyncio.gather(*coros)
  pcs.clear()
  
  for processor in client_processors.values():
    await processor.stop()

  client_processors.clear()