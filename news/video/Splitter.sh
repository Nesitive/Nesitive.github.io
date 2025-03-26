#!/bin/zsh
vidlength=$(ffprobe -i $1 -show_entries format=duration -v quiet -of csv="p=0")
segments=$((1+($vidlength/120)))

echo "Creating $segments files."

for i in $(seq 1 $(($segments-1))); do
    echo "$(($i*120)) to $((($i+1)*120))"
    ffmpeg -i $1 -ss $(($i*120)) -to $((($i+1)*120)) -loglevel quiet -stats 1-$i.webm
done
