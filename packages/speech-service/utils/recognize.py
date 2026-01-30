import numpy as np
import sounddevice as sd
import time
from config import *
from model import *
from utils.ai import phonemes_from_buffer
from utils.fuzzy_match import check_stage_match

def audio_callback(indata, frames, _, status):
  global audio_buffer

  if status:
    print(f"Audio status: {status}")
    
  audio_buffer[:-frames] = audio_buffer[frames:]
  audio_buffer[-frames:] = indata[:, 0]

def recognize(target_pattern):
  last_stage_time = time.time()

  
  for i, stage in enumerate(target_pattern, 1):
    print(f"  {i}. {stage['name']}")

  stage = 0
  last_match = ""
  consecutive_empty = 0
  
  with sd.InputStream(
    samplerate=SAMPLE_RATE,
    channels=1,
    blocksize=CHUNK_SIZE,
    callback=audio_callback
  ):
    while True:
      try:
        phonemes, confidence = phonemes_from_buffer(model, processor, device, audio_buffer)
        
        if not phonemes or confidence < CONFIDENCE_THRESHOLD:
          consecutive_empty += 1
          if consecutive_empty > 20:
            print(".", end="", flush=True)
            consecutive_empty = 0

          sd.sleep(100)
          continue
        
        consecutive_empty = 0
        
        if time.time() - last_stage_time > RESET_TIMEOUT and stage > 0:
          print(f"Timeout! Progress reset. Starting over...")
          stage = 0
        
        if phonemes == last_match:
          sd.sleep(100)
          continue
        
        last_match = phonemes
        matched, _ = check_stage_match(phonemes, target_pattern[stage])

        if matched:
          print(f"Matched stage {stage + 1}: {target_pattern[stage]['name']}")

          stage += 1
          last_stage_time = time.time()
          
          if stage == len(target_pattern):
            print("YAY!")
            break
        
      except KeyboardInterrupt:
        print("\n\nExiting...")
        break
      
      except Exception as e:
        print(f"\nError: {e}")
        sd.sleep(500)