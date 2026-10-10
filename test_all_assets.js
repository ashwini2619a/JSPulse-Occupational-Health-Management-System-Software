import https from 'https';

const blogger_vars = [
  // 1. CVNIK (capital K) + hyphen: A-bc_Z2j
  'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhJTMKlzSnLiG3Aoi5F-iNbdAU0e-Rp78CVNIK9at5edCTrcvnhFdow6vjC7KFCZisxgcDLmwbjA_-9rXGjwfA-bc_Z2jEuPrJadwykCX5TT3M0-KoP4iTRcsEmym6xxQa8DS4giaBCmnarxKxgLhvXiYNXmylaRRIHl00OQsy2VO7aQx_8u_5Xr1063OGaj/w1200-h630-p-k-no-nu/89862.png',
  // 2. CVNIK (capital K) + no hyphen: Abc_Z2j
  'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhJTMKlzSnLiG3Aoi5F-iNbdAU0e-Rp78CVNIK9at5edCTrcvnhFdow6vjC7KFCZisxgcDLmwbjA_-9rXGjwfAbc_Z2jEuPrJadwykCX5TT3M0-KoP4iTRcsEmym6xxQa8DS4giaBCmnarxKxgLhvXiYNXmylaRRIHl00OQsy2VO7aQx_8u_5Xr1063OGaj/w1200-h630-p-k-no-nu/89862.png',
  // 3. CVNIk (lowercase k) + hyphen: A-bc_Z2j
  'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhJTMKlzSnLiG3Aoi5F-iNbdAU0e-Rp78CVNIk9at5edCTrcvnhFdow6vjC7KFCZisxgcDLmwbjA_-9rXGjwfA-bc_Z2jEuPrJadwykCX5TT3M0-KoP4iTRcsEmym6xxQa8DS4giaBCmnarxKxgLhvXiYNXmylaRRIHl00OQsy2VO7aQx_8u_5Xr1063OGaj/w1200-h630-p-k-no-nu/89862.png',
  // 4. CVNIk (lowercase k) + no hyphen: Abc_Z2j (already tested, failed 404, but let's re-verify)
  'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhJTMKlzSnLiG3Aoi5F-iNbdAU0e-Rp78CVNIk9at5edCTrcvnhFdow6vjC7KFCZisxgcDLmwbjA_-9rXGjwfAbc_Z2jEuPrJadwykCX5TT3M0-KoP4iTRcsEmym6xxQa8DS4giaBCmnarxKxgLhvXiYNXmylaRRIHl00OQsy2VO7aQx_8u_5Xr1063OGaj/w1200-h630-p-k-no-nu/89862.png'
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
  console.log('Testing Blogger URLs...');
  for (const url of blogger_vars) {
    const res = await checkUrl(url);
    console.log(`Blogger: Status ${res.status} for ${url}`);
    if (res.status === 200) {
      console.log('SUCCESSFUL BLOGGER URL:', url);
    }
  }
}

testAll();
