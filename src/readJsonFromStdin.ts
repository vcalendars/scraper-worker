import IScraperConfiguration from './IScraperConfiguration';

const stdin = process.stdin;

async function timeout(timeoutMillis: number): Promise<undefined> {
  return new Promise(resolve => {
    setTimeout(resolve, timeoutMillis);
  });
}

async function _readJsonFromStdin(): Promise<IScraperConfiguration> {
  return new Promise((resolve, reject) => {
    try {
      stdin.resume();
      stdin.setEncoding('utf8');

      const inputChunks: Array<Buffer> = [];
      stdin.on('data', function(chunk) {
        inputChunks.push(chunk);
      });

      stdin.on('end', function() {
        const inputJSON = inputChunks.join();
        const parsedData = JSON.parse(inputJSON);
        resolve(parsedData);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export default async function readJsonFromStdin(timeoutMillis: number) {
  const data = await Promise.race([
    timeout(timeoutMillis),
    _readJsonFromStdin(),
  ]);
  if (data !== undefined) {
    return data;
  }
  throw new Error('Timed out waiting for configuration in stdin');
}
