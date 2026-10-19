const path = require('node:path');
const sharp = require('sharp');

const project = path.join(__dirname, '..');
const assets = path.join(project, 'assets');
const source = path.join(project, 'orbit-logo.png');

async function main() {
  // The supplied image is 1254px square; the visible tile occupies this region.
  const cropped = await sharp(source)
    .extract({left: 204, top: 216, width: 846, height: 846})
    .resize(1024, 1024)
    .png()
    .toBuffer();
  const roundedMask = Buffer.from('<svg width="1024" height="1024"><rect width="1024" height="1024" rx="250" fill="white"/></svg>');
  const logo = await sharp(cropped)
    .composite([{input: roundedMask, blend: 'dest-in'}])
    .png()
    .toBuffer();

  await sharp(logo).toFile(path.join(assets, 'logo.png'));
  await sharp(logo)
    .flatten({background: '#E4F0E3'})
    .toFile(path.join(assets, 'icon.png'));

  const adaptiveLogo = await sharp(logo).resize(850, 850).toBuffer();
  await sharp({create: {width: 1024, height: 1024, channels: 4, background: '#00000000'}})
    .composite([{input: adaptiveLogo, left: 87, top: 87}])
    .png()
    .toFile(path.join(assets, 'adaptive-icon.png'));

  const splashLogo = await sharp(logo).resize(220, 220).toBuffer();
  const splashText = Buffer.from('<svg width="600" height="600"><text x="300" y="435" text-anchor="middle" font-family="Arial,sans-serif" font-size="64" font-weight="700" fill="#252D27">Orbit</text></svg>');
  await sharp({create: {width: 600, height: 600, channels: 4, background: '#FAFAF8'}})
    .composite([{input: splashLogo, left: 190, top: 130}, {input: splashText, left: 0, top: 0}])
    .png()
    .toFile(path.join(assets, 'splash.png'));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
