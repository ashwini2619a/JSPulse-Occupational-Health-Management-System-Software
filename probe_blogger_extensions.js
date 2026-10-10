import https from 'https';

const base_url = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhJTMKlzSnLiG3Aoi5F-iNbdAU0e-Rp78CVNIK9at5edCTrcvnhFdow6vjC7KFCZisxgcDLmwbjA_-9rXGjwfA-bc_Z2jEuPrJadwykCX5TT3M0-KoP4iTRcsEmym6xxQa8DS4giaBCmnarxKxgLhvXiYNXmylaRRIHl00OQsy2VO7aQx_8u_5Xr1063OGaj';

const suffixes = [
  '/w1200-h630-p-k-no-nu/89862.png',
  '/w1200-h630-p-k-no-nu/89862.jpg',
  '/w1200-h630-p-k-no-nu/89862.webp',
  '/s1600/89862.png',
  '/s1600/89862.jpg',
  '/s1600/89862.webp',
  '/s640/89862.png',
  '/s640/89862.jpg',
  '/s640/89862.webp',
  '/89862.png',
  '/89862.jpg',
  '/89862.webp'
];

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, options, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ url, status: 500, error: err.message });
    });
  });
}

async function testAll() {
  console.log('Testing Blogger Suffixes...');
  for (const suf of suffixes) {
    const url = base_url + suf;
    const res = await checkUrl(url);
    console.log(`Blogger: Status ${res.status} for ${suf}`);
    if (res.status === 200) {
      console.log('SUCCESSFUL BLOGGER URL:', url);
    }
  }
}

testAll();
