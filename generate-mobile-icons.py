#!/usr/bin/env python3
"""
Generate app icons for MentalCare mobile deployment
Creates icons for both Android and iOS platforms
"""

from PIL import Image, ImageDraw
import os

def create_app_icon(size, output_path):
    """Create a MentalCare app icon with medical cross and brain symbol"""
    # Create image with blue background
    img = Image.new('RGB', (size, size), '#3b82f6')
    draw = ImageDraw.Draw(img)
    
    # Calculate dimensions
    center = size // 2
    icon_size = int(size * 0.6)
    
    # Draw medical cross in white
    cross_thickness = max(size // 20, 4)
    cross_length = icon_size // 2
    
    # Vertical bar of cross
    draw.rectangle([
        center - cross_thickness//2, 
        center - cross_length//2,
        center + cross_thickness//2, 
        center + cross_length//2
    ], fill='white')
    
    # Horizontal bar of cross
    draw.rectangle([
        center - cross_length//2, 
        center - cross_thickness//2,
        center + cross_length//2, 
        center + cross_thickness//2
    ], fill='white')
    
    # Add brain outline around the cross
    brain_radius = int(icon_size * 0.4)
    brain_thickness = max(size // 40, 2)
    
    # Draw brain circle outline
    draw.ellipse([
        center - brain_radius,
        center - brain_radius,
        center + brain_radius,
        center + brain_radius
    ], outline='white', width=brain_thickness)
    
    # Save the icon
    img.save(output_path, 'PNG')
    print(f"Generated: {output_path} ({size}x{size})")

def generate_android_icons():
    """Generate Android app icons in various sizes"""
    android_path = "android/app/src/main/res"
    
    # Android icon sizes
    android_sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192
    }
    
    for folder, size in android_sizes.items():
        folder_path = os.path.join(android_path, folder)
        os.makedirs(folder_path, exist_ok=True)
        icon_path = os.path.join(folder_path, 'ic_launcher.png')
        create_app_icon(size, icon_path)

def generate_ios_icons():
    """Generate iOS app icons in various sizes"""
    ios_path = "ios/App/App/Assets.xcassets/AppIcon.appiconset"
    
    # iOS icon sizes
    ios_sizes = [20, 29, 40, 58, 60, 80, 87, 120, 180, 1024]
    
    os.makedirs(ios_path, exist_ok=True)
    
    for size in ios_sizes:
        icon_path = os.path.join(ios_path, f'icon-{size}.png')
        create_app_icon(size, icon_path)

if __name__ == "__main__":
    print("Generating MentalCare app icons...")
    
    try:
        generate_android_icons()
        generate_ios_icons()
        print("\nAll app icons generated successfully!")
        
    except ImportError:
        print("PIL (Pillow) not available. Install with: pip install Pillow")