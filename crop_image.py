import sys
from PIL import Image, ImageChops

def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

def trim_alpha(im):
    # Trim based on alpha channel
    if im.mode != 'RGBA':
        im = im.convert('RGBA')
    
    alpha = im.split()[-1]
    bbox = alpha.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

try:
    img_path = "/Users/hazwans./Downloads/TCG/Foils/Starter 1.png"
    im = Image.open(img_path)
    # The image might have transparent whitespace or solid color whitespace.
    cropped = trim_alpha(im)
    cropped.save("/Users/hazwans./Downloads/TCG/Foils/Starter 1 Cropped.png")
    print("Cropped successfully to /Users/hazwans./Downloads/TCG/Foils/Starter 1 Cropped.png")
except Exception as e:
    print("Error:", e)
    sys.exit(1)
