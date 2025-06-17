import base64
import struct

def create_png_icon(size, color_rgb=(59, 130, 246)):
    # Create a simple PNG with the specified color
    width = height = size
    
    # PNG signature
    png_signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_crc = struct.pack('>I', 0x91E5F2FF)  # Pre-calculated CRC for this IHDR
    ihdr_chunk = b'IHDR' + ihdr_data + ihdr_crc
    ihdr_length = struct.pack('>I', len(ihdr_data))
    
    # Create image data (simple solid color)
    row_data = b'\x00' + (bytes(color_rgb) * width)  # Filter byte + RGB pixels
    image_data = row_data * height
    
    # Compress the image data (simplified)
    import zlib
    compressed_data = zlib.compress(image_data)
    
    # IDAT chunk
    idat_chunk = b'IDAT' + compressed_data
    idat_length = struct.pack('>I', len(compressed_data))
    idat_crc = struct.pack('>I', zlib.crc32(idat_chunk) & 0xffffffff)
    
    # IEND chunk
    iend_chunk = b'IEND'
    iend_length = struct.pack('>I', 0)
    iend_crc = struct.pack('>I', 0xAE426082)
    
    # Combine all chunks
    png_data = (png_signature + 
                ihdr_length + ihdr_chunk + 
                idat_length + idat_chunk + idat_crc +
                iend_length + iend_chunk + iend_crc)
    
    return png_data

# Create both icon sizes
icon_192 = create_png_icon(192)
icon_512 = create_png_icon(512)

with open('icon-192x192.png', 'wb') as f:
    f.write(icon_192)

with open('icon-512x512.png', 'wb') as f:
    f.write(icon_512)

print("Icons created successfully")
