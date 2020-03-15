import nock from 'nock';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

import loadPage from '../src';
import { getNameFromURL } from '../src/utils';
import { types } from '../dist/utils';

nock.disableNetConnect();

let tempDir = '';
let outputFilesDir = '';
let originalHtml = '';
const requestUrl = 'http://lunar-sea-surgel.sh';
const pathFixturesDir = path.join(__dirname, '__fixtures__');
let mappingResult = {};

const fileTypes = {
  html: 'html', css: 'css', script: 'script', image: 'image',
};

const mappingPath = {
  [fileTypes.html]: '/',
  [fileTypes.css]: '/styles/style.css',
  [fileTypes.script]: '/scripts/index.js',
  [fileTypes.image]: '/images/banner.png',
};

const readFile = (dir, pathToFile) => fs.readFile(path.join(dir, pathToFile), 'utf8');

beforeAll(async () => {
  originalHtml = await readFile(pathFixturesDir, 'index.html');

  mappingResult = {
    [fileTypes.html]: await readFile(pathFixturesDir, 'changedIndex.html'),
    [fileTypes.css]: await readFile(pathFixturesDir, mappingPath.css),
    [fileTypes.script]: await readFile(pathFixturesDir, mappingPath.script),
    [fileTypes.image]: await readFile(pathFixturesDir, mappingPath.image),
  };

  nock(requestUrl)
    .persist()
    .get(mappingPath[fileTypes.html])
    .reply(200, originalHtml)
    .get(mappingPath[fileTypes.css])
    .reply(200, mappingResult[fileTypes.css])
    .get(mappingPath[fileTypes.script])
    .reply(200, mappingResult[fileTypes.script])
    .get(mappingPath[fileTypes.image])
    .reply(200, mappingResult[fileTypes.image]);
});

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  outputFilesDir = path.join(tempDir, getNameFromURL(requestUrl, types.sourceDir));
});

test.each([
  [fileTypes.html, getNameFromURL(requestUrl, types.htmlFile)],
  [fileTypes.css, getNameFromURL(mappingPath.css)],
  [fileTypes.script, getNameFromURL(mappingPath.script)],
  [fileTypes.image, getNameFromURL(mappingPath.image)],
])('download correct %s file', async (type, filePath) => {
  await loadPage(requestUrl, tempDir);

  const dirName = type === fileTypes.html ? tempDir : outputFilesDir;

  const result = await readFile(dirName, filePath);
  expect(result).toEqual(mappingResult[type]);
});

test('application error handling', async () => {
  await expect(loadPage(requestUrl, 'output')).rejects.toThrow("ENOENT: no such file or directory, open 'output/lunar-sea-surgel-sh.html'");
});

afterEach(async () => {
  await fs.rmdir(tempDir, { recursive: true });
});
