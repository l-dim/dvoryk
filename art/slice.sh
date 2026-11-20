#!/bin/zsh
# Ріже аркуш-наліпку на клітинки сітки, вирізає фон кожного предмета й кладе в items/<назва>.webp
# Використання: art/slice.sh <аркуш> <стовпців> <рядків> <назва1> <назва2> ...   ("-" — пропустити клітинку)
# Потрібен скомпільований вирізальник: swiftc -O art/cutout.swift -o "$CUTOUT"
set -e
CUTOUT=${CUTOUT:?вкажи шлях до скомпільованого cutout у змінній CUTOUT}
TMP=${TMPDIR:-/tmp}/dvoryk-slice; mkdir -p "$TMP" items
src=$1; cols=$2; rows=$3; shift 3
W=$(sips -g pixelWidth "$src" | awk '/pixelWidth/{print $2}')
H=$(sips -g pixelHeight "$src" | awk '/pixelHeight/{print $2}')
cw=$((W / cols)); ch=$((H / rows)); i=0
for name in "$@"; do
  r=$((i / cols)); c=$((i % cols)); i=$((i + 1))
  [[ "$name" == "-" ]] && continue
  if "$CUTOUT" "$src" "$TMP/$name.png" 220 $((c * cw)) $((r * ch)) $cw $ch >/dev/null; then
    cwebp -quiet -q 86 -alpha_q 95 "$TMP/$name.png" -o "items/$name.webp" && echo "ok $name"
  else
    echo "FAIL $name (у клітинці не знайдено предмета)"
  fi
done
