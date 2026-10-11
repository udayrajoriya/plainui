import { writeFile, mkdir } from 'node:fs/promises';

const versions = {
  '@axe-core/playwright': '4.13.0',
  '@codemirror/state': '6.7.6',
  '@noble/hashes': '2.4.0',
  '@playwright/test': '1.64.0',
  busboy: '1.6.0',
  'chart.js': '4.5.1',
  codemirror: '6.0.2',
  dompurify: '3.4.16',
  esbuild: '0.28.2',
  'fast-check': '4.10.2',
  parse5: '8.0.1',
  pnpm: '12.10.1',
  typescript: '7.0.2',
  vite: '7.3.7',
  vitest: '5.0.3',
};

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

const npm = {};
for (const [name, version] of Object.entries(versions)) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(name)}/${version}`;
  const data = await json(url);
  if (data.name !== name || data.version !== version || !data.dist?.integrity) {
    throw new Error(`Registry metadata mismatch for ${name}@${version}`);
  }
  npm[name] = {
    version,
    source: url,
    integrity: data.dist.integrity,
    shasum: data.dist.shasum,
    tarball: data.dist.tarball,
    engines: data.engines ?? null,
  };
}

const pythonMultipartUrl = 'https://pypi.org/pypi/python-multipart/0.0.32/json';
const pythonMultipart = await json(pythonMultipartUrl);
if (pythonMultipart.info.version !== '0.0.32') throw new Error('python-multipart version mismatch');
const nodeSumsUrl = 'https://nodejs.org/dist/v24.21.0/SHASUMS256.txt';
const sumsResponse = await fetch(nodeSumsUrl);
if (!sumsResponse.ok) throw new Error(`Node SHASUMS: HTTP ${sumsResponse.status}`);
const sums = await sumsResponse.text();
const nodeArtifacts = Object.fromEntries(
  sums.trim().split('\n').map((line) => {
    const [sha256, filename] = line.trim().split(/\s+/u);
    return [filename, sha256];
  }),
);

const evidence = {
  retrievedAt: new Date().toISOString(),
  npm,
  python: {
    version: '3.13.7',
    source: 'https://www.python.org/downloads/release/python-3137/',
    role: 'example backend only; not installed by the JavaScript workspace',
  },
  pythonMultipart: {
    version: '0.0.32',
    source: pythonMultipartUrl,
    files: pythonMultipart.urls.map(({ filename, digests, url }) => ({ filename, sha256: digests.sha256, url })),
  },
  node: {
    version: '24.21.0',
    source: nodeSumsUrl,
    artifacts: {
      'node-v24.21.0-win-x64.zip': nodeArtifacts['node-v24.21.0-win-x64.zip'],
      'node-v24.21.0-linux-x64.tar.xz': nodeArtifacts['node-v24.21.0-linux-x64.tar.xz'],
    },
  },
};
if (Object.values(evidence.node.artifacts).some((hash) => !hash)) throw new Error('Missing Node artifact hash');
await mkdir('evidence/dependencies', { recursive: true });
await writeFile('evidence/dependencies/registry-metadata.json', `${JSON.stringify(evidence, null, 2)}\n`);
