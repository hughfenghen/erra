import fs from 'fs';
import os from 'os';
import pem from 'pem';
import path from 'path';
import LRU from 'lru-cache';
import { promisify } from 'es6-promisify';

const certCache = new LRU({
  max: 500,
  maxAge: 1000 * 60 * 60,
})

const fsReadFile = promisify(fs.readFile);
const pemCreateCertificate = promisify(pem.createCertificate);

async function getRootCert() {
  const cacheKey = 'root-cert'

  if (certCache.has(cacheKey)) return certCache.get(cacheKey)

  const rootCert = {
    cert: await fsReadFile(path.resolve(os.homedir(), '.erra/erra.crt.pem'), {
      encoding: 'utf-8',
    }),
    key: await fsReadFile(path.resolve(os.homedir(), '.erra/erra.key.pem'), {
      encoding: 'utf-8',
    }),
  }

  certCache.set(cacheKey, rootCert);
  return rootCert;
}

export async function createCert(host) {
  if (certCache.has(host)) return certCache.get(host)

  const root = await getRootCert();
  const res = await pemCreateCertificate({
    altNames: [host],
    commonName: host,
    days: 365,
    serviceCertificate: root.cert,
    serviceKey: root.key,
  });

  const cert = {
    cert: res.certificate,
    key: res.clientKey,
  }
  certCache.set(host, cert);

  return cert;
}