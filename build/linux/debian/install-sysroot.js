"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSysroot = void 0;
const child_process_1 = require("child_process");
const crypto_1 = require("crypto");
const os_1 = require("os");
const fs = require("fs");
const https = require("https");
const path = require("path");
const util = require("../../lib/util");
// Based on https://source.chromium.org/chromium/chromium/src/+/main:build/linux/sysroot_scripts/install-sysroot.py.
const URL_PREFIX = 'https://msftelectron.blob.core.windows.net';
const URL_PATH = 'sysroots/toolchain';
function getSha(filename) {
    const hash = (0, crypto_1.createHash)('sha1');
    // Read file 1 MB at a time
    const fd = fs.openSync(filename, 'r');
    const buffer = Buffer.alloc(1024 * 1024);
    let position = 0;
    let bytesRead = 0;
    while ((bytesRead = fs.readSync(fd, buffer, 0, buffer.length, position)) === buffer.length) {
        hash.update(buffer);
        position += bytesRead;
    }
    hash.update(buffer.slice(0, bytesRead));
    return hash.digest('hex');
}
async function getSysroot(arch) {
    const sysrootJSONUrl = `https://raw.githubusercontent.com/electron/electron/v${util.getElectronVersion().electronVersion}/script/sysroots.json`;
    const sysrootDictLocation = `${(0, os_1.tmpdir)()}/sysroots.json`;
    const result = (0, child_process_1.spawnSync)('curl', [sysrootJSONUrl, '-o', sysrootDictLocation]);
    if (result.status !== 0) {
        throw new Error('Cannot retrieve sysroots.json. Stderr:\n' + result.stderr);
    }
    const sysrootInfo = require(sysrootDictLocation);
    const sysrootArch = `bullseye_${arch}`;
    const sysrootDict = sysrootInfo[sysrootArch];
    const tarballFilename = sysrootDict['Tarball'];
    const tarballSha = sysrootDict['Sha1Sum'];
    const sysroot = path.join((0, os_1.tmpdir)(), sysrootDict['SysrootDir']);
    const url = [URL_PREFIX, URL_PATH, tarballSha, tarballFilename].join('/');
    const stamp = path.join(sysroot, '.stamp');
    if (fs.existsSync(stamp) && fs.readFileSync(stamp).toString() === url) {
        return sysroot;
    }
    console.log(`Installing Debian ${arch} root image: ${sysroot}`);
    fs.rmSync(sysroot, { recursive: true, force: true });
    fs.mkdirSync(sysroot);
    const tarball = path.join(sysroot, tarballFilename);
    console.log(`Downloading ${url}`);
    let downloadSuccess = false;
    for (let i = 0; i < 3 && !downloadSuccess; i++) {
        fs.writeFileSync(tarball, '');
        await new Promise((c) => {
            https.get(url, (res) => {
                res.on('data', (chunk) => {
                    fs.appendFileSync(tarball, chunk);
                });
                res.on('end', () => {
                    downloadSuccess = true;
                    c();
                });
            }).on('error', (err) => {
                console.error('Encountered an error during the download attempt: ' + err.message);
                c();
            });
        });
    }
    if (!downloadSuccess) {
        fs.rmSync(tarball);
        throw new Error('Failed to download ' + url);
    }
    const sha = getSha(tarball);
    if (sha !== tarballSha) {
        throw new Error(`Tarball sha1sum is wrong. Expected ${tarballSha}, actual ${sha}`);
    }
    const proc = (0, child_process_1.spawnSync)('tar', ['xf', tarball, '-C', sysroot]);
    if (proc.status) {
        throw new Error('Tarball extraction failed with code ' + proc.status);
    }
    fs.rmSync(tarball);
    fs.writeFileSync(stamp, url);
    return sysroot;
}
exports.getSysroot = getSysroot;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbC1zeXNyb290LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW5zdGFsbC1zeXNyb290LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O2dHQUdnRzs7O0FBRWhHLGlEQUEwQztBQUMxQyxtQ0FBb0M7QUFDcEMsMkJBQTRCO0FBQzVCLHlCQUF5QjtBQUN6QiwrQkFBK0I7QUFDL0IsNkJBQTZCO0FBRTdCLHVDQUF1QztBQUV2QyxvSEFBb0g7QUFDcEgsTUFBTSxVQUFVLEdBQUcsNENBQTRDLENBQUM7QUFDaEUsTUFBTSxRQUFRLEdBQUcsb0JBQW9CLENBQUM7QUFFdEMsU0FBUyxNQUFNLENBQUMsUUFBcUI7SUFDcEMsTUFBTSxJQUFJLEdBQUcsSUFBQSxtQkFBVSxFQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2hDLDJCQUEyQjtJQUMzQixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN0QyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQztJQUN6QyxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFDakIsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQ2xCLE9BQU8sQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLEtBQUssTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzVGLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEIsUUFBUSxJQUFJLFNBQVMsQ0FBQztJQUN2QixDQUFDO0lBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sSUFBSSxDQUFD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