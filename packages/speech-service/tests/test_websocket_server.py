import json
from datetime import datetime
from aiohttp import web
import aiohttp

clients = {}
detections = []

async def websocket_handler(request):
  """Handle WebSocket connections"""
  ws = web.WebSocketResponse()
  await ws.prepare(request)
  
  print("New WebSocket connection established")
  
  try:
    async for msg in ws:
      if msg.type == aiohttp.WSMsgType.TEXT:
        try:
          data = json.loads(msg.data)
          uuid = data.get('uuid')
          syllable = data.get('syllable')
          
          if uuid and syllable:
            timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
            detection = {
              'uuid': uuid,
              'syllable': syllable,
              'timestamp': timestamp
            }
            detections.append(detection)
            
            if uuid not in clients:
              clients[uuid] = {
                'first_seen': timestamp,
                'detections': []
              }
            clients[uuid]['detections'].append({
              'syllable': syllable,
              'timestamp': timestamp
            })
            
            client_short = uuid[:8]
            print(
              f"🎯 [{client_short}] detected '{syllable}' "
              f"(Total: {len(clients[uuid]['detections'])})"
            )
            
            if len(detections) % 10 == 0:
              print_summary()
          
        except json.JSONDecodeError:
          print(f"Invalid JSON received: {msg.data}")
        except Exception as e:
          print(f"Error processing message: {e}")
          
      elif msg.type == aiohttp.WSMsgType.ERROR:
        print(f'WebSocket error: {ws.exception()}')
  
  finally:
    print("WebSocket connection closed")
  
  return ws


def print_summary():
  """Print a summary of all detections"""
  print("\n" + "="*70)
  print("DETECTION SUMMARY")
  print("="*70)
  print(f"Total Clients: {len(clients)}")
  print(f"Total Detections: {len(detections)}")
  print()
  
  syllable_counts = {}

  for detection in detections:
    syl = detection['syllable']
    syllable_counts[syl] = syllable_counts.get(syl, 0) + 1
  
  print("Syllable Distribution:")
  for syllable, count in sorted(syllable_counts.items(), key=lambda x: -x[1]):
    bar = "█" * min(count, 50)
    print(f"  {syllable:10s} {bar} {count}")
  
  print()
  print("Client Activity:")
  for uuid, info in clients.items():
    client_short = uuid[:8]
    count = len(info['detections'])
    print(f"  {client_short}... - {count} detections")
  
  print("="*70 + "\n")


async def index(request):
  """Serve a simple status page"""
  html = """
  <!DOCTYPE html>
  <html>
  <head>
    <title>WebSocket Server Status</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 50px auto;
        padding: 20px;
        background: #f5f5f5;
      }
      .container {
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      h1 { color: #333; }
      .status {
        background: #4CAF50;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        display: inline-block;
        margin: 20px 0;
      }
      .info {
        background: #e3f2fd;
        padding: 15px;
        border-left: 4px solid #2196F3;
        margin: 20px 0;
      }
      code {
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: monospace;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🔌 WebSocket Server</h1>
      <div class="status">✓ Running</div>
      
      <div class="info">
        <strong>WebSocket Endpoint:</strong><br>
        <code>ws://localhost:8080/ws</code>
      </div>
      
      <h2>Expected Message Format</h2>
      <pre><code>{
  "uuid": "client-uuid-here",
  "syllable": "DETECTED_SYLLABLE"
}</code></pre>
      
      <h2>Instructions</h2>
      <ol>
        <li>This server is running and ready to receive messages</li>
        <li>Start the RTC server: <code>python rtc_server.py</code></li>
        <li>Open clients at <code>http://localhost:8000</code></li>
        <li>Speak syllables and watch the console output here</li>
      </ol>
      
      <p><strong>Note:</strong> Check the terminal/console where you started this server to see incoming detections.</p>
    </div>
  </body>
  </html>
  """
  return web.Response(text=html, content_type='text/html')


async def on_startup(app):
  """Print startup message"""
  print("\n" + "="*70)
  print("WEBSOCKET SERVER STARTED")
  print("="*70)
  print(f"WebSocket endpoint: ws://localhost:8080/ws")
  print(f"Status page: http://localhost:8080")
  print("\nWaiting for connections from rtc_server.py...")
  print("="*70 + "\n")


async def on_shutdown(app):
  """Print shutdown message and summary"""
  print("\n" + "="*70)
  print("SHUTTING DOWN")
  print("="*70)
  if detections:
    print_summary()
  else:
    print("No detections received.")
  print("="*70 + "\n")

if __name__ == '__main__':
  app = web.Application()
  app.router.add_get('/', index)
  app.router.add_get('/ws', websocket_handler)
  app.on_startup.append(on_startup)
  app.on_shutdown.append(on_shutdown)
  
  try:
    web.run_app(app, host='localhost', port=8080, print=None)
  except KeyboardInterrupt:
    print("\nShutting down gracefully...")
