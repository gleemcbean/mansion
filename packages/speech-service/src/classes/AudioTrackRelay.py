import av
import numpy as np
from aiortc import MediaStreamTrack
from constants.config import SAMPLE_RATE

class AudioTrackRelay(MediaStreamTrack):
  kind = "audio"
  
  def __init__(self, track, processor):
    super().__init__()
    
    self.track = track
    self.processor = processor
    self.resampler = None
  
  async def recv(self):
    frame = await self.track.recv()
    
    try:
      if frame.format.name != 's16':
        frame = frame.reformat(format='s16')
      
      if frame.sample_rate != SAMPLE_RATE:
        if self.resampler is None:
          self.resampler = av.AudioResampler(
            format='s16',
            layout='mono',
            rate=SAMPLE_RATE
          )

        resampled_frames = self.resampler.resample(frame)
        if resampled_frames:
          frame = resampled_frames[0]
      
      if frame.layout.name != 'mono':
        frame = frame.reformat(layout='mono')
      
      audio_array = frame.to_ndarray()
      
      if audio_array.dtype == np.int16:
        audio_chunk = audio_array.astype(np.float32) / 32768.0
      else:
        audio_chunk = audio_array.astype(np.float32)
      
      if len(audio_chunk.shape) > 1:
        audio_chunk = audio_chunk.flatten()
      
      self.processor.add_audio_chunk(audio_chunk)
      
    except Exception as e:
      print(f"Error processing audio frame: {e}")
    
    return frame