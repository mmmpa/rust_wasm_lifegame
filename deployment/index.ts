import fs from 'fs';
import path from 'path';
import exec from './exec';

function start () {
  const {
    BUCKET_NAME: bucketName = 'rust-wasm-lifegame',
    FILE_DIR: fileDir = '../dist',
  } = process.env;

  deployment({ bucketName, fileDir }).catch(console.error);
}

async function deployment ({ bucketName, fileDir }) {
  const root = path.join(__dirname);
  const src = path.join(root, fileDir);
  const tmp = path.join(root, 'tmp');

  fs.existsSync(tmp) || fs.mkdirSync(tmp);

  await clearBucket(bucketName);

  const puts = fs
    .readdirSync(src)
    .filter(f => f.match(/.gz$/) || f.match(/.html$/))
    .map(f => {
      const nextName = f.replace(/.gz$/, '');
      const nextPath = path.join(tmp, nextName);

      fs.copyFileSync(
        path.join(src, f),
        nextPath,
      );

      return f.match(/.gz$/)
        ? put(bucketName, nextPath, nextName, detectType(nextName), 'gzip')
        : put(bucketName, nextPath, nextName, detectType(nextName), '');
    });
  await Promise.all(puts);
}

function detectType (name) {
  switch (true) {
  case !!name.match(/.wasm$/):
    return 'application/wasm';
  case !!name.match(/.js$/):
    return 'text/javascript';
  case !!name.match(/.css$/):
    return 'text/css';
  case !!name.match(/.html$/):
    return 'text/html';
  default:
    return '';
  }
}

function build () {
  return exec({}, `yarn build`);
}

function clearBucket (bucketName) {
  return exec({}, `aws s3 rm s3://${bucketName} --recursive`);
}

function clearCache (cloudFrontId) {
  return exec({}, `aws cloudfront create-invalidation --distribution-id ${cloudFrontId} --paths "/*"`);
}

function deleteBucket (bucketName) {
  return exec({}, `aws s3 rb s3://${bucketName} --force`);
}

function put (bucketName, body, src, type, encoding) {
  let command = `aws s3api put-object --bucket ${bucketName} --body ${body} --key ${src}`;

  encoding && (command += ` --content-encoding ${encoding}`);
  type && (command += ` --content-type ${type}`);

  return exec({}, command);
}

function upload (bucketName, fileDir) {
  return exec({}, `aws s3 cp ${fileDir} s3://${bucketName} --recursive`);
}

start();

