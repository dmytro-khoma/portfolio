# ==========================================================================
# make-demo-video.ps1
# --------------------------------------------------------------------------
# Generates the 30-second demo video used by the mini player, entirely from
# FFmpeg's built-in test sources, so the site ships no third-party media.
#
# Output (public/assets/media/):
#   demo.mp4         H.264 + AAC, widest browser support
#   demo.webm        VP9 + Opus, usually smaller
#   demo-poster.jpg  poster frame for the facade
#
# Requires FFmpeg on PATH. Run from the project root:
#   powershell -ExecutionPolicy Bypass -File tools/make-demo-video.ps1
# ==========================================================================

$ErrorActionPreference = 'Stop'

$out  = Join-Path $PSScriptRoot '..\public\assets\media'
$font = 'C\:/Windows/Fonts/segoeui.ttf'   # escaped for FFmpeg's filter syntax
New-Item -ItemType Directory -Force $out | Out-Null

# Video: a slow colour gradient, a title, and a running timecode, so seeking
# and playback speed are easy to see. Audio: a quiet, soft chord, so the
# volume and mute controls can be tested.
$video = "gradients=s=1280x720:c0=0x1d2433:c1=0x2142b0:c2=0x0f1115:x0=0:y0=0:x1=1280:y1=720:speed=0.01:d=30:r=30"
$audio = "aevalsrc='0.04*sin(2*PI*220*t)+0.03*sin(2*PI*277.2*t)+0.03*sin(2*PI*329.6*t)':s=48000:d=30"
$text  = "drawtext=fontfile='$font':text='Mini player demo':fontsize=64:fontcolor=white:x=(w-tw)/2:y=(h-th)/2-40," +
         "drawtext=fontfile='$font':text='%{pts\:hms}':fontsize=36:fontcolor=white@0.8:x=(w-tw)/2:y=(h/2)+40"

ffmpeg -y -hide_banner -loglevel error -f lavfi -i $video -f lavfi -i $audio `
  -vf $text -af "afade=t=in:d=1,afade=t=out:st=29:d=1" `
  -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -movflags +faststart `
  -c:a aac -b:a 64k (Join-Path $out 'demo.mp4')

ffmpeg -y -hide_banner -loglevel error -i (Join-Path $out 'demo.mp4') `
  -c:v libvpx-vp9 -b:v 0 -crf 42 -row-mt 1 -c:a libopus -b:a 48k (Join-Path $out 'demo.webm')

ffmpeg -y -hide_banner -loglevel error -ss 2 -i (Join-Path $out 'demo.mp4') `
  -frames:v 1 -q:v 5 (Join-Path $out 'demo-poster.jpg')

Get-ChildItem $out | Select-Object Name, @{ n = 'KB'; e = { [math]::Round($_.Length / 1KB) } }
