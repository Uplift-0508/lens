/**
 * Copyright (c) 2021 OpenLens Authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import type { LensExtensionManifest } from "../../../../../extensions/lens-extension";
import { listTarEntries, readFileFromTar } from "../../../../../common/utils";
import { manifestFilename } from "../../../../../extensions/extension-discovery";
import path from "path";

export const validatePackage = async (
  filePath: string,
): Promise<LensExtensionManifest> => {
  const tarFiles = await listTarEntries(filePath);

  // tarball from npm contains single root folder "package/*"
  const firstFile = tarFiles[0];

  if (!firstFile) {
    throw new Error(`invalid extension bundle,  ${manifestFilename} not found`);
  }

  const rootFolder = path.normalize(firstFile).split(path.sep)[0];
  const packedInRootFolder = tarFiles.every(entry =>
    entry.startsWith(rootFolder),
  );
  const manifestLocation = packedInRootFolder
    ? path.join(rootFolder, manifestFilename)
    : manifestFilename;

  if (!tarFiles.includes(manifestLocation)) {
    throw new Error(`invalid extension bundle, ${manifestFilename} not found`);
  }

  const manifest = await readFileFromTar<LensExtensionManifest>({
    tarPath: filePath,
    filePath: manifestLocation,
    parseJson: true,
  });

  if (!manifest.main && !manifest.renderer) {
    throw new Error(
      `${manifestFilename} must specify "main" and/or "renderer" fields`,
    );
  }

  return manifest;
};