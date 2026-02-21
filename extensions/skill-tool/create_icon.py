#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont

# Create base image
img = Image.new("RGB", (512, 512), color=(0, 0, 0))
draw = ImageDraw.Draw(img)

# Use large font
fnt = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 600)

text = "S"

# Get bounding box to measure text
bbox = draw.textbbox((0, 0), text, font=fnt)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]

# Center the text
x = (512 - text_width) // 2
y = (512 - text_height) // 2

# Draw text in bright red
draw.text((x, y), text, font=fnt, fill=(255, 50, 50))

img.save("./assets/extension-icon.png")
print("✅ Icon created: Large red S on black")
