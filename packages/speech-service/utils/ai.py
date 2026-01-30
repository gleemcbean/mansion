import torch
from config import *

def phonemes_from_buffer(model, processor, device, audio_buffer):
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