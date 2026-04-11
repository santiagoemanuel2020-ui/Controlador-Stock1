// Generate PWA icons
// Run with: node generate-icons.js

const fs = require('fs');
const path = require('path');

// Simple PNG generator - creates a blue square with "SC" text
function createIcon(size) {
  // PNG header for a simple solid color icon
  // This creates a valid minimal PNG
  const width = size;
  const height = size;
  
  // Create raw pixel data (RGBA)
  const pixels = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Blue background (#3b82f6)
      pixels.push(59, 130, 246, 255); // RGBA
    }
  }
  
  return Buffer.from(pixels);
}

// Create icons directory if not exists
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create placeholder files (empty but valid structure)
// For a real app, you'd use real icon images
const sizes = [192, 512];

sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // Create a minimal valid PNG file
  // Using a simple 1x1 blue pixel PNG that browsers can scale
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width = 1
    0x00, 0x00, 0x00, 0x01, // height = 1
    0x08, 0x02, // bit depth = 8, color type = 2 (RGB)
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xD7, 0x63, 0x38, 0xEC, 0xE8, 0x00, 0x00, 0x00, 0x49, 0x00, 0x01, // compressed data
    0x27, 0x34, 0x27, 0x4F, // CRC (placeholder)
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  fs.writeFileSync(filepath, pngData);
  console.log(`Created: ${filename}`);
});

console.log('\n✅ Icons generated!');
console.log('Note: These are placeholder icons. For production, replace with real icon images.');
console.log('You can use https://realfavicongenerator.net to create proper icons.');