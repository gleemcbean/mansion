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

def fuzzy_match(text, pattern, max_distance=1):
  return levenshtein_distance(text.upper(), pattern.upper()) <= max_distance

def check_pattern_match(phonemes, patterns_info):
  phonemes_upper = phonemes.upper().strip()
  
  for pattern in patterns_info["patterns"]:
    if pattern in phonemes_upper:
      return True, pattern
  
  if patterns_info.get("fuzzy_match", False):
    for pattern in patterns_info["patterns"]:
      if fuzzy_match(phonemes_upper, pattern, max_distance=1):
        return True, pattern
  
  return False, None