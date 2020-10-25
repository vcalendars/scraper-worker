import Joi from 'joi';

const stdin = process.stdin;

async function timeout(timeoutMillis: number): Promise<undefined> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeoutMillis);
  });
}

async function _readJsonFromStdin<T>(): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      stdin.resume();
      stdin.setEncoding('utf8');

      const inputChunks: Array<Buffer> = [];
      stdin.on('data', function (chunk) {
        inputChunks.push(chunk);
      });

      stdin.on('end', function () {
        const inputJSON = inputChunks.join();
        const parsedData = JSON.parse(inputJSON);
        resolve(parsedData);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export default async function readJsonFromStdin<T>(
  timeoutMillis: number,
  schema: Joi.ObjectSchema<T>,
): Promise<T> {
  const data = await Promise.race([
    timeout(timeoutMillis),
    _readJsonFromStdin<T>(),
  ]);
  if (data !== undefined) {
    const result = schema.validate(data);
    if (result.error) {
      throw new Error(`Configuration file invalid: ${result.error}`);
    } else {
      return result.value;
    }
  }
  throw new Error('Timed out waiting for configuration in stdin');
}
