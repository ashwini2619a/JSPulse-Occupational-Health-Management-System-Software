import https from 'https';

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, options, (res) => {
      resolve(res.statusCode);
    }).on('error', (err) => {
      resolve(500);
    });
  });
}

async function testAll() {
  const kOptions = ['CVNIK', 'CVNIk'];
  const rOptions = ['r', 'l', '1', 'i'];
  const xOptions = ['X', 'x'];
  const jOptions = ['j', 'J'];
  const connectorOptions = ['-bc_', 'bc_', '_bc_'];

  console.log('Generating combinations...');
  const urls = [];
  
  for (const k of kOptions) {
    for (const r of rOptions) {
      for (const x of xOptions) {
        for (const j of jOptions) {
          for (const conn of connectorOptions) {
            const hash = `AVvXsEhJTMKlzSnLiG3Aoi5F-iNbdAU0e-Rp78${k}9at5edCTrcvnhFdow6vjC7KFCZisxgcDLmwbjA_-9${r}${x}G${j}wfA${conn}Z2jEuPrJadwykCX5TT3M0-KoP4iTRcsEmym6xxQa8DS4giaBCmnarxKxgLhvXiYNXmylaRRIHl00OQsy2VO7aQx_8u_5Xr1063OGaj`;
            const url = `https://blogger.googleusercontent.com/img/b/R29vZ2xl/${hash}/w1200-h630-p-k-no-nu/89862.png`;
            urls.push(url);
          }
        }
      }
    }
  }

  console.log(`Testing ${urls.length} URLs in batches...`);
  
  // Test in batches of 10 to avoid overwhelming
  const batchSize = 10;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(async (url) => {
      const status = await checkUrl(url);
      return { url, status };
    }));

    for (const res of results) {
      if (res.status === 200) {
        console.log('\n=======================================');
        console.log('SUCCESS! WORKING URL FOUND:');
        console.log(res.url);
        console.log('=======================================\n');
        process.exit(0);
      }
    }
    process.stdout.write('.');
  }
  console.log('\nAll combinations finished. None worked.');
}

testAll();
