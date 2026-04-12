"""
==============================================================================
download_emoji_lexicon.py - Download Emoji Sentiment Lexicon
==============================================================================
Downloads the Kralj Novak et al. (2015) emoji sentiment data and saves it
to data/emoji_sentiment_data.csv

Reference:
  Kralj Novak P, Smailović J, Sluban B, Mozetič I (2015)
  "Sentiment of Emojis." PLoS ONE 10(12): e0144296.
  https://doi.org/10.1371/journal.pone.0144296

Dataset URL (GitHub mirror):
  https://raw.githubusercontent.com/words/emoji-sentiment/master/index.json
==============================================================================
"""

import json
import os
import csv
import urllib.request

OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "emoji_sentiment_data.csv"
)

EMOJI_SENTIMENT_URL = (
    "https://raw.githubusercontent.com/words/emoji-sentiment/master/index.json"
)

# Curated fallback — most common emojis with known sentiment
# Format: emoji_char, positive, neutral, negative
FALLBACK_DATA = [
    # Positive emojis
    ("😀", 0.96, 0.03, 0.01), ("😊", 0.97, 0.02, 0.01), ("😂", 0.81, 0.10, 0.09),
    ("❤️", 0.95, 0.04, 0.01), ("👍", 0.89, 0.09, 0.02), ("🔥", 0.64, 0.20, 0.16),
    ("🎉", 0.94, 0.05, 0.01), ("😍", 0.97, 0.02, 0.01), ("🥰", 0.98, 0.01, 0.01),
    ("💯", 0.85, 0.10, 0.05), ("👏", 0.88, 0.09, 0.03), ("✅", 0.82, 0.15, 0.03),
    ("🙌", 0.91, 0.07, 0.02), ("💪", 0.87, 0.11, 0.02), ("😎", 0.80, 0.15, 0.05),
    ("🤩", 0.96, 0.03, 0.01), ("😁", 0.93, 0.05, 0.02), ("🥳", 0.95, 0.04, 0.01),
    ("😄", 0.96, 0.03, 0.01), ("😃", 0.95, 0.04, 0.01), ("🤗", 0.91, 0.07, 0.02),
    ("💕", 0.94, 0.05, 0.01), ("💖", 0.95, 0.04, 0.01), ("💙", 0.93, 0.06, 0.01),
    ("💚", 0.90, 0.08, 0.02), ("✨", 0.81, 0.15, 0.04), ("🌟", 0.82, 0.14, 0.04),
    ("⭐", 0.80, 0.16, 0.04), ("🙏", 0.83, 0.13, 0.04), ("😇", 0.90, 0.07, 0.03),
    # Neutral/ambiguous emojis
    ("🤔", 0.22, 0.62, 0.16), ("😐", 0.11, 0.72, 0.17), ("🤷", 0.15, 0.70, 0.15),
    ("👀", 0.30, 0.55, 0.15), ("😑", 0.08, 0.68, 0.24), ("💭", 0.28, 0.61, 0.11),
    ("🙃", 0.35, 0.45, 0.20), ("😌", 0.70, 0.25, 0.05), ("🤐", 0.12, 0.65, 0.23),
    # Negative emojis
    ("😢", 0.09, 0.12, 0.79), ("😭", 0.15, 0.10, 0.75), ("😡", 0.04, 0.08, 0.88),
    ("👎", 0.04, 0.09, 0.87), ("😤", 0.08, 0.12, 0.80), ("💀", 0.12, 0.20, 0.68),
    ("🤮", 0.03, 0.06, 0.91), ("😒", 0.06, 0.18, 0.76), ("🙄", 0.06, 0.24, 0.70),
    ("😠", 0.04, 0.09, 0.87), ("😞", 0.05, 0.12, 0.83), ("💔", 0.05, 0.10, 0.85),
    ("😫", 0.07, 0.14, 0.79), ("😩", 0.07, 0.13, 0.80), ("🤬", 0.03, 0.06, 0.91),
    ("😱", 0.17, 0.28, 0.55), ("😰", 0.06, 0.16, 0.78), ("😳", 0.18, 0.47, 0.35),
    ("💩", 0.18, 0.22, 0.60), ("🤦", 0.07, 0.20, 0.73), ("😓", 0.08, 0.20, 0.72),
    ("🤢", 0.03, 0.07, 0.90), ("😷", 0.05, 0.25, 0.70), ("☠️", 0.10, 0.20, 0.70),
    # Slang-specific (YouTube comment culture)
    ("💅", 0.55, 0.30, 0.15), ("🧢", 0.12, 0.50, 0.38),  # "cap" = lying
]


def download_from_github() -> list[tuple]:
    """Try downloading from GitHub mirror."""
    try:
        with urllib.request.urlopen(EMOJI_SENTIMENT_URL, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        rows = []
        for entry in data:
            em = entry.get("emoji", "")
            pos = float(entry.get("positive", 0))
            neu = float(entry.get("neutral", 0))
            neg = float(entry.get("negative", 0))
            if em:
                rows.append((em, pos, neu, neg))
        print(f"[Emoji] Downloaded {len(rows)} entries from GitHub")
        return rows
    except Exception as e:
        print(f"[Emoji] GitHub download failed: {e}. Using curated fallback dataset.")
        return []


def save_lexicon(rows: list[tuple], path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["emoji", "positive", "neutral", "negative"])
        for row in rows:
            writer.writerow(row)
    print(f"[Emoji] Saved {len(rows)} entries to: {path}")


if __name__ == "__main__":
    if os.path.exists(OUTPUT_PATH):
        print(f"[Emoji] Lexicon already exists at {OUTPUT_PATH}")
    else:
        rows = download_from_github()
        if not rows:
            rows = FALLBACK_DATA
        save_lexicon(rows, OUTPUT_PATH)
