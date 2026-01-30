import torch
import numpy as np
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
from config import *

device = "cuda" if torch.cuda.is_available() else "cpu"
processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h").to(device)
model.eval()

audio_buffer = np.zeros(BUFFER_SIZE, dtype=np.float32)