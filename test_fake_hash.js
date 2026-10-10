import https from 'https';

const urls = [
  'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhJTMKlzSnLiG3Aoi5F-fakehash/89862.png',
  'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhJTMKlzSnLiG3Aoi5F-fakehash/w1200-h630-p-k-no-nu/89862.png'
];

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log(`URL: ${url} -> Status: ${res.statusCode}`);
      resolve();
    });
  });
}

async function test() {
  for (const url of urls) {
    await checkUrl(url);
  }
}
test();
