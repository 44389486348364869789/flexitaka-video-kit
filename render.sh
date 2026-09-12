#!/usr/bin/env bash
# ============================================================================
#  render.sh — build the video, end to end, in one command
# ----------------------------------------------------------------------------
#  HTML/CSS/JS timeline  ->  headless Chromium frame capture  ->  ffmpeg MP4
#                        ->  voice-over + music mix  ->  mux (picture copied)
#
#  Usage:
#     ./render.sh                full build  (frames + encode + audio + mux)
#     ./render.sh probe          a handful of stills only, for fast visual QA
#     ./render.sh check          environment + font check, renders nothing
#     ./render.sh plan           print the resolved timeline and audio plan
#     ./render.sh silent         build the picture only, no audio, no mux
#     ./render.sh audio          re-mix and re-mux only (reuses the last render)
#     PORT=9000 ./render.sh      serve on another port
#
#  Every number that defines the output (length, frame count, fps, size) comes
#  from video.config.js. Change that file and re-run — no script edits needed.
# ============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

MODE="${1:-all}"
PORT="${PORT:-8777}"
CHROME="${CHROME_PATH:-/usr/bin/chromium}"
FRAMES="$HERE/frames"
OUTDIR="$HERE/output"

cyan(){ printf '\033[36m%s\033[0m\n' "$*"; }
ok(){   printf '\033[32m  [ok] %s\033[0m\n' "$*"; }
warn(){ printf '\033[33m  [!!] %s\033[0m\n' "$*"; }
die(){  printf '\033[31m[FAIL] %s\033[0m\n' "$*" >&2; exit 1; }

# Read the plan straight out of the config, so this script never hard-codes a
# length. Prints: "<seconds> <frames> <fps> <width> <height> <outputName>"
plan_line(){
  node -e '
    const {cfg}=require("./lib/config");
    const {resolveTimeline}=require("./lib/timeline");
    const planner=require("./lib/plan-audio");
    const c=cfg(); let tl=resolveTimeline(c);
    if(c.audio&&c.audio.enabled){
      const p=planner.plan(c,tl);
      if(Object.keys(p.extensions).length) tl=resolveTimeline(c,p.extensions);
    }
    const v=c.video;
    console.log([tl.total.toFixed(3),tl.frames,v.fps,v.width,v.height,v.outputName].join(" "));
  '
}

# ---------------------------------------------------------------- preflight --
cyan "-- [0/7] Preflight ----------------------------------------------"
command -v node   >/dev/null || die "node not found (need Node.js 18+)"
command -v ffmpeg >/dev/null || die "ffmpeg not found (apt-get install -y ffmpeg)"
[ -x "$CHROME" ] || die "Chromium not found at $CHROME (set CHROME_PATH)"
ok "node $(node -v)"
ok "chromium $CHROME"
ok "ffmpeg $(ffmpeg -version | head -1 | awk '{print $3}')"

[ -f video.config.js ] || die "video.config.js is missing"
node -e 'require("./video.config.js")' || die "video.config.js does not load"
ok "video.config.js loads"

read -r TOTAL_SEC TOTAL_FRAMES FPS VW VH OUTNAME <<< "$(plan_line)"
ok "plan: ${TOTAL_SEC}s  ${TOTAL_FRAMES} frames @ ${FPS}fps  ${VW}x${VH}"

# ------------------------------------------------------------- dependencies --
cyan "-- [1/7] Dependencies -------------------------------------------"
if [ ! -d node_modules/puppeteer-core ]; then
  echo "  npm install ..."
  npm install --no-audit --no-fund
fi
node -e "require('puppeteer-core')" && ok "puppeteer-core loads"

# ------------------------------------------------------ generate the page ---
cyan "-- [2/7] Generating index.html ----------------------------------"
node lib/template.js || die "could not generate index.html"
ok "index.html regenerated from video.config.js"

if [ "$MODE" = "plan" ]; then
  node lib/dump-plan.js
  cyan "plan printed."; exit 0
fi

# ------------------------------------------------------- static server ------
# A real http:// origin is used rather than file:// because some Chromium
# builds block webfonts over file:// — which would silently break the Bangla
# glyphs. capture.js can drive either, so this is the safe default.
cyan "-- [3/7] Static server on port $PORT ---------------------------"
if command -v fuser >/dev/null; then fuser -k "${PORT}/tcp" 2>/dev/null || true; fi

node -e "
  const http=require('http'),fs=require('fs'),p=require('path');
  const ROOT='$HERE', PORT=$PORT;
  const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css',
    '.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml',
    '.ttf':'font/ttf','.woff2':'font/woff2','.mp3':'audio/mpeg'};
  http.createServer((q,s)=>{
    let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/index.html';
    const f=p.join(ROOT,u);
    if(!f.startsWith(ROOT)){s.writeHead(403).end();return;}
    fs.readFile(f,(e,d)=>{
      if(e){s.writeHead(404).end('404');return;}
      s.writeHead(200,{'Content-Type':MIME[p.extname(f)]||'application/octet-stream',
        'Cache-Control':'no-store'}).end(d);
    });
  }).listen(PORT,()=>console.log('  server http://127.0.0.1:'+PORT));
" >/tmp/videokit_server.log 2>&1 &
SERVER_PID=$!
cleanup(){ kill "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT

for i in $(seq 1 40); do
  curl -sf "http://127.0.0.1:$PORT/index.html" -o /dev/null && break
  sleep 0.25
  [ "$i" = 40 ] && die "static server did not come up on port $PORT"
done
ok "server up (pid $SERVER_PID)"
export PAGE_URL="http://127.0.0.1:$PORT/index.html"

# ------------------------------------------------------ check + probe -------
cyan "-- [4/7] Environment, font and overflow check -------------------"
node lib/check.js || die "check failed — fix the above before rendering"

if [ "$MODE" = "check" ]; then cyan "check-only run finished."; exit 0; fi

if [ "$MODE" = "probe" ]; then
  cyan "-- PROBE: sampling stills ---------------------------------------"
  rm -rf "$FRAMES/probe"; mkdir -p "$FRAMES/probe"
  OUT_DIR="$FRAMES/probe" node lib/capture.js probe
  ok "stills in frames/probe/ — inspect them, then run ./render.sh"
  exit 0
fi

# ------------------------------------------------------------- capture ------
cyan "-- [5/7] Capturing $TOTAL_FRAMES frames ----------------------------"
rm -rf "$FRAMES"; mkdir -p "$FRAMES"
START=$(date +%s)
OUT_DIR="$FRAMES" node lib/capture.js all
ok "capture finished in $(( $(date +%s) - START ))s"

mapfile -t INPUTS < <(ls "$FRAMES"/f_*.png | sort)
[ "${#INPUTS[@]}" -eq "$TOTAL_FRAMES" ] \
  || die "frame count mismatch: got ${#INPUTS[@]}, expected $TOTAL_FRAMES"
ok "${#INPUTS[@]} frames captured"

BAD=0
for f in "${INPUTS[@]}"; do
  file "$f" | grep -q "${VW} x ${VH}" || { echo "  wrong dimensions: $f"; BAD=1; }
done
[ "$BAD" -eq 0 ] || die "some frames are not ${VW}x${VH}"
ok "all frames are ${VW}x${VH}"

# --------------------------------------------------------------- encode -----
cyan "-- [6/7] Encoding MP4 -------------------------------------------"
mkdir -p "$OUTDIR"
OUT="$OUTDIR/${OUTNAME}.mp4"
CONCAT="$HERE/.frames.txt"
: > "$CONCAT"
for f in "${INPUTS[@]}"; do printf "file '%s'\n" "$f" >> "$CONCAT"; done

CRF=$(node -e 'console.log(require("./video.config.js").video.crf)')
PRESET=$(node -e 'console.log(require("./video.config.js").video.preset)')

ffmpeg -y -hide_banner -loglevel error \
  -f concat -safe 0 -r "$FPS" -i "$CONCAT" \
  -c:v libx264 -profile:v high -level 4.1 -pix_fmt yuv420p \
  -crf "$CRF" -preset "$PRESET" -r "$FPS" -vsync cfr \
  -movflags +faststart \
  "$OUT"
rm -f "$CONCAT"
ok "encoded -> output/${OUTNAME}.mp4"

# ---------------------------------------------------------------- audio -----
if [ "$MODE" = "silent" ]; then
  cyan "-- [7/7] Audio skipped (silent mode) ----------------------------"
else
  cyan "-- [7/7] Voice-over + music mix, then mux -----------------------"
  node lib/build-audio.js
fi

# --------------------------------------------------------------- verify -----
cyan "-- Verify -------------------------------------------------------"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
NB=$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$OUT")
RES=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$OUT")
ASTREAMS=$(ffprobe -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 "$OUT" | tr '\n' ' ')
echo "  file      : output/${OUTNAME}.mp4"
echo "  size      : $(du -h "$OUT" | cut -f1)"
echo "  duration  : ${DUR}s   (config says ${TOTAL_SEC}s)"
echo "  frames    : ${NB}"
echo "  resolution: ${RES}"
echo "  audio     : ${ASTREAMS:-none}"
[ "$NB" = "$TOTAL_FRAMES" ] || die "encoded frame count is $NB, expected $TOTAL_FRAMES"
case "$RES" in "${VW},${VH}") : ;; *) die "resolution is $RES, expected ${VW},${VH}" ;; esac

node -e "
  const d=parseFloat('$DUR'), want=parseFloat('$TOTAL_SEC');
  if (Math.abs(d-want) > 0.02) { console.error('duration '+d+' does not match config '+want); process.exit(1); }
" || die "duration mismatch"
ok "render complete"
echo
echo "  Video  ->  output/${OUTNAME}.mp4"
[ -f "$OUTDIR/audio/${OUTNAME}_audio.mp3" ] && echo "  Audio  ->  output/audio/${OUTNAME}_audio.mp3"
echo
