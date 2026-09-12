#!/usr/bin/env bash
# ============================================================================
#  make_sfx.sh — regenerate the transition sound effects from scratch.
#
#  Everything here is synthesised with ffmpeg, so the kit carries no
#  third-party sample and the whole sound design is reproducible:
#
#     whoosh.mp3  filtered pink-noise swell   (scene entrances / cuts)
#     click.mp3   very short sine tick        (a UI press)
#     ding.mp3    sine + two bell partials    (a confirmation)
#     riser.mp3   white-noise swell           (into the reveal)
#
#  Run:  ./sfx/make_sfx.sh
# ============================================================================
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

F='-hide_banner -loglevel error'

# --- whoosh: pink-noise swell, band-limited, with a short tail --------------
ffmpeg -y $F -f lavfi -i "anoisesrc=d=0.70:c=pink:a=0.9:r=48000" \
  -af "highpass=f=280,lowpass=f=5200,afade=t=in:st=0:d=0.06,afade=t=out:st=0.42:d=0.28,volume=6dB,aecho=0.8:0.9:18:0.25" \
  -ac 1 -ar 48000 -c:a libmp3lame -b:a 192k whoosh.mp3

# --- click: a 45 ms tick ----------------------------------------------------
ffmpeg -y $F -f lavfi -i "sine=frequency=1750:duration=0.045:r=48000" \
  -af "highpass=f=700,afade=t=in:st=0:d=0.001,afade=t=out:st=0.004:d=0.041,volume=4dB" \
  -ac 1 -ar 48000 -c:a libmp3lame -b:a 192k click.mp3

# --- ding: 988 Hz fundamental + two bell partials, soft attack ---------------
ffmpeg -y $F \
  -f lavfi -i "sine=frequency=988:duration=0.85:r=48000" \
  -f lavfi -i "sine=frequency=1976:duration=0.85:r=48000" \
  -f lavfi -i "sine=frequency=2637:duration=0.85:r=48000" \
  -filter_complex "[0:a]volume=1.0[a];[1:a]volume=0.30,afade=t=out:st=0.05:d=0.80[b];[2:a]volume=0.13,afade=t=out:st=0.02:d=0.55[c];[a][b][c]amix=inputs=3:normalize=0,afade=t=in:st=0:d=0.004,afade=t=out:st=0.20:d=0.65,volume=1dB[o]" \
  -map "[o]" -ac 1 -ar 48000 -c:a libmp3lame -b:a 192k ding.mp3

# --- riser: 1.3 s white-noise swell ----------------------------------------
ffmpeg -y $F -f lavfi -i "anoisesrc=d=1.30:c=white:a=0.6:r=48000" \
  -af "highpass=f=300,lowpass=f=6000,afade=t=in:st=0:d=1.15,afade=t=out:st=1.15:d=0.15,volume=1dB" \
  -ac 1 -ar 48000 -c:a libmp3lame -b:a 192k riser.mp3

for f in whoosh click ding riser; do
  printf '%-8s %ss\n' "$f" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 $f.mp3)"
done
