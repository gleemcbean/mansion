from config import *
import random
from constants.patterns import PATTERNS
from utils.recognize import recognize

def main():
  target_pattern = random.sample(PATTERNS, TARGET_PATTERN_SIZE)
  recognize(target_pattern)


if __name__ == "__main__":
  main()
