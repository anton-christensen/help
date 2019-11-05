# Resize icon to different sizes
convert icon.png -resize 16x16 icon-16x16.png
convert icon.png -resize 32x32 icon-32x32.png
convert icon.png -resize 48x48 icon-48x48.png
convert icon.png -resize 72x72 icon-72x72.png
convert icon.png -resize 96x96 icon-96x96.png
convert icon.png -resize 128x128 icon-128x128.png
convert icon.png -resize 144x144 icon-144x144.png
convert icon.png -resize 152x152 icon-152x152.png
convert icon.png -resize 192x192 icon-192x192.png
convert icon.png -resize 384x384 icon-384x384.png
convert icon.png -resize 512x512 icon-512x512.png

#reduce file size
optipng -q icon-*.png

# Generate favicon
convert icon-16x16.png icon-32x32.png icon-48x48.png favicon.ico