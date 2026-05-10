import sharp from 'sharp';
import { mkdir, readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const iconsDir = join(rootDir, 'public', 'icons');

await mkdir(iconsDir, { recursive: true });

const svgPath = join(rootDir, 'app', 'icon.svg');
const svgBuffer = await readFile(svgPath);

const sizes = [
  { name: '192x192.png', size: 192 },
  { name: '512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
  await sharp(Buffer.from(svgBuffer))
    .resize(size, size)
    .png()
    .toFile(join(iconsDir, name));
  console.log(`Created ${name}`);
}

const maskable512 = await sharp(Buffer.from(svgBuffer))
  .resize(512, 512)
  .extend({
    top: 32,
    bottom: 32,
    left: 32,
    right: 32,
    background: { r: 0, g: 0, b: 0, alpha: 1 }
  })
  .png()
  .toFile(join(iconsDir, '512x512-maskable.png'));
console.log('Created 512x512-maskable.png');

console.log('Done!');