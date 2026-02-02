import asyncio
import aiohttp
import time
import torch
import numpy as np
from constants.config import SAMPLE_RATE, BUFFER_SIZE, PROCESSING_INTERVAL, CONFIDENCE_THRESHOLD
from constants.patterns import PATTERNS
from utils.matching import check_pattern_match
from utils.model import processor, model, device

class AudioProcessor:
  def __init__(self, client_id, websocket_url):
    self.client_id = client_id
    self.websocket_url = websocket_url
    self.audio_buffer = np.zeros(BUFFER_SIZE, dtype=np.float32)
    self.last_detected = ""
    self.last_detection_time = 0
    self.ws_session = None
    self.ws_connection = None
    self.processing_task = None
    self.audio_queue = asyncio.Queue(maxsize=100)
    self.is_running = False
    
  async def connect_websocket(self):
    try:
      self.ws_session = aiohttp.ClientSession()
      self.ws_connection = await self.ws_session.ws_connect(self.websocket_url)
      print(f"Client {self.client_id}: Connected to WebSocket")

    except Exception as e:
      print(f"Client {self.client_id}: Failed to connect to WebSocket: {e}")
  
  async def disconnect_websocket(self):
    if self.ws_connection:
      await self.ws_connection.close()

    if self.ws_session:
      await self.ws_session.close()

    print(f"Client {self.client_id}: Disconnected from WebSocket")
  
  async def send_to_websocket(self, syllable):
    if not self.ws_connection:
      print(f"Client {self.client_id}: WebSocket not connected")
      return
    
    try:
      message = {
        "type": "voice-syllable",
        "data": {
          "uuid": self.client_id,
          "syllable": syllable
        }
      }
    
      await self.ws_connection.send_json(message)
      print(f"Client {self.client_id}: Sent syllable '{syllable}' to WebSocket")

    except Exception as e:
      print(f"Client {self.client_id}: Failed to send to WebSocket: {e}")
  
  def add_audio_chunk(self, audio_chunk):
    try:
      self.audio_queue.put_nowait(audio_chunk)

    except asyncio.QueueFull:
      try:
        self.audio_queue.get_nowait()
        self.audio_queue.put_nowait(audio_chunk)

      except:
        pass
  
  async def process_audio_loop(self):
    print(f"Client {self.client_id}: Audio processing loop started")
    self.is_running = True
    
    last_process_time = time.time()
    
    while self.is_running:
      try:
        try:
          audio_chunk = await asyncio.wait_for(
            self.audio_queue.get(), 
            timeout=0.1
          )
        
          chunk_len = len(audio_chunk)
          if chunk_len > 0:
            self.audio_buffer[:-chunk_len] = self.audio_buffer[chunk_len:]
            self.audio_buffer[-chunk_len:] = audio_chunk
          
        except asyncio.TimeoutError:
          await asyncio.sleep(0.05)
          continue
        
        current_time = time.time()
        if current_time - last_process_time >= PROCESSING_INTERVAL:
          last_process_time = current_time
          await self.recognize_syllable()
        
      except asyncio.CancelledError:
        print(f"Client {self.client_id}: Processing loop cancelled")
        break

      except Exception as e:
        print(f"Client {self.client_id}: Error in processing loop: {e}")
        await asyncio.sleep(0.1)
  
  async def recognize_syllable(self):
    try:
      audio = torch.tensor(self.audio_buffer, dtype=torch.float32)

      if audio.abs().max() > 0:
        audio = audio / audio.abs().max()
      else:
        return
      
      inputs = processor(
        audio,
        sampling_rate=SAMPLE_RATE,
        return_tensors="pt",
        padding=True
      )
      
      with torch.no_grad():
        logits = model(inputs.input_values.to(device)).logits
        probs = torch.nn.functional.softmax(logits, dim=-1)
        predicted_ids = torch.argmax(logits, dim=-1)
        confidence = probs.max(dim=-1).values.mean().item()
      
      transcription = processor.batch_decode(predicted_ids)[0].strip()
      
      if not transcription or confidence < CONFIDENCE_THRESHOLD:
        return
      
      for pattern_info in PATTERNS:
        matched, matched_pattern = check_pattern_match(transcription, pattern_info)
        
        if matched:
          current_time = time.time()
          if matched_pattern != self.last_detected or \
             (current_time - self.last_detection_time) > 1.0:
            
            self.last_detected = matched_pattern
            self.last_detection_time = current_time
            
            print(f"Client {self.client_id}: ✓ Detected '{pattern_info['name']}' ({matched_pattern})")
            await self.send_to_websocket(pattern_info['name'])
          break
    
    except Exception as e:
      print(f"Client {self.client_id}: Recognition error: {e}")
  
  async def start(self):
    await self.connect_websocket()
    self.processing_task = asyncio.create_task(self.process_audio_loop())
  
  async def stop(self):
    self.is_running = False

    if self.processing_task:
      self.processing_task.cancel()

      try:
        await self.processing_task
      except asyncio.CancelledError:
        pass

    await self.disconnect_websocket()