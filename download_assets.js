import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, 'downloaded_assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

const images = [
  {
    name: 'rvs_logo.png',
    url: 'https://www.rvscollege.ac.in/wp-content/uploads/2025/04/RVSCET-Website-295x80-Logo.png'
  },
  {
    name: 'brm_mill.webp',
    url: 'https://jindaltmt550.com/images/mp/manufacturing-process-stage-5-mob.webp'
  },
  {
    name: 'rebar_machine.png',
    url: 'https://ik.imagekit.io/sctpl/Untitled%20design%20-%202026-02-07T121813.187.png'
  },
  {
    name: 'it_department.jpg',
    url: 'https://framerusercontent.com/images/TfHUCkLw85zPq7NPdT2KvJC5CU.jpg'
  },
  {
    name: 'ohc_collage.jpg',
    url: 'https://www.jindalstainless.com/wp-content/uploads/2026/04/Inaguration-collage.jpg'
  }
];

function downloadImage(img) {
  return new Promise((resolve, reject) => {
    const dest = path.join(assetsDir, img.name);
    const file = fs.createWriteStream(dest);
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    https.get(img.url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, options, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`Downloaded: ${img.name}`);
            resolve();
          });
        }).on('error', (err) => {
          fs.unlink(dest, () => {});
          console.error(`Error redirect: ${img.name}`, err.message);
          reject(err);
        });
        return;
      }

      if (response.statusCode !== 200) {
        fs.unlink(dest, () => {});
        console.error(`Failed: ${img.name} (${response.statusCode})`);
        reject(new Error(`Status ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${img.name}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      console.error(`Error ${img.name}:`, err.message);
      reject(err);
    });
  });
}

async function downloadAll() {
  for (const img of images) {
    try {
      await downloadImage(img);
    } catch (e) {
      console.error(`Error downloading ${img.name}:`, e.message);
    }
  }
}

downloadAll();
