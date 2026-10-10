import https from 'https';

const combinations = [
  // Patratu variations
  'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhJTMKlzSnLiG3Aoi5F-iNbdAU0e-Rp78CVNIK9at5edCTrcvnhFdow6vjC7KFCZisxgcDLmwbjA_-9rXGjwfA-bc_Z2jEuPrJadwykCX5TT3M0-KoP4iTRcsEmym6xxQa8DS4giaBCmnarxKxgLhvXiYNXmylaRRIHl00OQsy2VO7aQx_8u_5Xr1063OGaj/w1200-h630-p-k-no-nu/89862.png',
  'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhJTMKlzSnLiG3Aoi5F-iNbdAU0e-Rp78CVNIk9at5edCTrcvnhFdow6vjC7KFCZisxgcDLmwbjA_-9rXGjwfA-bc_Z2jEuPrJadwykCX5TT3M0-KoP4iTRcsEmym6xxQa8DS4giaBCmnarxKxgLhvXiYNXmylaRRIHl00OQsy2VO7aQx_8u_5Xr1063OGaj/w1200-h630-p-k-no-nu/89862.png',
  'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhJTMKlzSnLiG3Aoi5F-iNbdAU0e-Rp78CVNIk9at5edCTrcvnhFdow6vjC7KFCZisxgcDLmwbjA_-9rXGjwfAbc_Z2jEuPrJadwykCX5TT3M0-KoP4iTRcsEmym6xxQa8DS4giaBCmnarxKxgLhvXiYNXmylaRRIHl00OQsy2VO7aQx_8u_5Xr1063OGaj/w1200-h630-p-k-no-nu/89862.png',
  
  // Rebar variations
  'https://ik.imagekit.io/sctpl/Untitled%20design%20-%202026-02-07T121813.187.png',
  'https://ik.imagekit.io/sctpl/Untitled%20design%20-%20202026-02-07T121813.187.png',
  
  // IT Room variations
  'https://framerusercontent.com/images/TfHUCKLw85zPq7NPdT2KvJC5CU.jpg?width=1408&height=768',
  'https://framerusercontent.com/images/TfHUCK-Lw85zPq7NPdT2KvJC5CU.jpg?width=1408&height=768',
  'https://framerusercontent.com/images/TfHUCK_Lw85zPq7NPdT2KvJC5CU.jpg?width=1408&height=768',
  'https://framerusercontent.com/images/TfHUCKLw85zPq7NPdT2KvJC5CU.jpg',
  'https://framerusercontent.com/images/TfHUCK-Lw85zPq7NPdT2KvJC5CU.jpg',
  'https://framerusercontent.com/images/TfHUCK_Lw85zPq7NPdT2KvJC5CU.jpg',
  
  // What if it is TfHUCK plus another letter?
  'https://framerusercontent.com/images/TfHUCKLw85zPq7NPdT2KvJC5CU.jpg?width=1408',
  'https://framerusercontent.com/images/TfHUCK-Lw85zPq7NPdT2KvJC5CU.jpg?width=1408'
];

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, options, (res) => {
      console.log(`URL: ${url} -> Status: ${res.statusCode}`);
      resolve({ url, status: res.statusCode });
    }).on('error', (err) => {
      console.log(`URL: ${url} -> Error: ${err.message}`);
      resolve({ url, status: 500 });
    });
  });
}

async function checkAll() {
  for (const url of combinations) {
    await checkUrl(url);
  }
}

checkAll();
