import torch
import sounddevice as sd
import numpy as np
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
from collections import deque
import time
import random
from config import *
from constants.patterns import PATTERNS

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

print("Loading Wav2Vec2 model...")
processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h").to(device)
model.eval()

print("Model loaded!")

audio_buffer = np.zeros(BUFFER_SIZE, dtype=np.float32)

recognition_history = deque(maxlen=5)
last_stage_time = time.time()

def audio_callback(indata, frames, time_info, status):
  global audio_buffer

  if status:
    print(f"Audio status: {status}")
    
  audio_buffer[:-frames] = audio_buffer[frames:]
  audio_buffer[-frames:] = indata[:, 0]

def phonemes_from_buffer():
  audio = torch.tensor(audio_buffer, dtype=torch.float32)
  
  if audio.abs().max() > 0:
    audio = audio / audio.abs().max()
  
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
  
  return transcription, confidence

def levenshtein_distance(s1, s2):
  if len(s1) < len(s2):
    return levenshtein_distance(s2, s1)

  if len(s2) == 0:
    return len(s1)
  
  previous_row = range(len(s2) + 1)
  for i, c1 in enumerate(s1):
    current_row = [i + 1]
    for j, c2 in enumerate(s2):
      insertions = previous_row[j + 1] + 1
      deletions = current_row[j] + 1
      substitutions = previous_row[j] + (c1 != c2)
      current_row.append(min(insertions, deletions, substitutions))
    previous_row = current_row
  
  return previous_row[-1]


def fuzzy_match(text, pattern, max_distance=2):
  return levenshtein_distance(text.upper(), pattern.upper()) <= max_distance


def check_stage_match(phonemes, stage_info):
  phonemes_upper = phonemes.upper().strip()
  
  for pattern in stage_info["patterns"]:
    if pattern in phonemes_upper:
      return True, pattern
  
  if stage_info.get("fuzzy_match", False):
    for pattern in stage_info["patterns"]:
      if fuzzy_match(phonemes_upper, pattern, max_distance=1):
        return True, pattern
  
  return False, None

def print_progress(stage, total_stages):
  filled = "X" * stage
  empty = " " * (total_stages - stage)
  percentage = (stage / total_stages) * 100

  print(f"\nProgress: [{filled}{empty}] {percentage:.0f}% ({stage}/{total_stages})")

def main():
  global last_stage_time

  target_pattern = random.sample(PATTERNS, TARGET_PATTERN_SIZE)
  
  for i, stage in enumerate(target_pattern, 1):
    print(f"  {i}. {stage['name']}")

  print("Listening...")
  
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
        phonemes, confidence = phonemes_from_buffer()
        
        if not phonemes or confidence < CONFIDENCE_THRESHOLD:
          consecutive_empty += 1
          if consecutive_empty > 20:
            print(".", end="", flush=True)
            consecutive_empty = 0

          sd.sleep(150)
          continue
        
        consecutive_empty = 0
        
        print(f"\nHeard: '{phonemes}' (confidence: {confidence:.2f})")
        
        recognition_history.append(phonemes)
        
        if time.time() - last_stage_time > RESET_TIMEOUT and stage > 0:
          print(f"\nTimeout! Progress reset. Starting over...")
          stage = 0
          print_progress(stage, TARGET_PATTERN_SIZE)
        
        if phonemes == last_match:
          sd.sleep(150)
          continue
        
        last_match = phonemes
        
        if stage < TARGET_PATTERN_SIZE:
          matched, matched_pattern = check_stage_match(phonemes, target_pattern[stage])
          
          if matched:
            stage += 1
            last_stage_time = time.time()
            
            print(f"Matched '{target_pattern[stage-1]['name']}'!")
            print_progress(stage, TARGET_PATTERN_SIZE)
            
            if stage == len(target_pattern):
              print("YAY!")
              break;
            
            sd.sleep(500)
          else:
            expected = target_pattern[stage]['name']
            print(f"Not recognized. Still waiting for: '{expected}'")
        
        sd.sleep(150)
        
      except KeyboardInterrupt:
        print("\n\nExiting...")
        break
      
      except Exception as e:
        print(f"\nError: {e}")
        sd.sleep(500)


if __name__ == "__main__":
  main()
