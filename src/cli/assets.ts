import fs from "fs";
import ora from "ora";
import path from "path";
import { Config } from "../types";

const cwd = process.cwd();

/** Removes old sandbox dir and creates a new one */
export async function getSandboxDir() {
  const sandboxPath = path.resolve(cwd, "./.sandbox");

  if (fs.existsSync(sandboxPath)) {
    await fs.promises.rmdir(sandboxPath, { recursive: true });
  }

  await fs.promises.mkdir(sandboxPath);

  return sandboxPath;
}

/** Write assets to sandbox dir */
export async function writeGeneratedAssets(
  outDir: string,
  { config, localTypes }: { config: Config; localTypes: Record<string, string> }
) {
  const assets = [
    {
      name: "config.json",
      content: JSON.stringify(config, null, 2),
    },
    {
      name: "local-types.json",
      content: JSON.stringify(localTypes),
    },
  ];

  const spinner = ora("Write generated assets").start();

  for (const asset of assets) {
    await fs.promises.writeFile(
      path.resolve(outDir, `./${asset.name}`),
      asset.content
    );
  }

  spinner.succeed();
}

/** Copy sandbox public assets */
export async function copyPublicAssets(outDir: string) {
  const spinner = ora("Copying public assets").start();

  // Public path is: ./dist/sandbox
  const publicPath = path.resolve(__dirname, "../sandbox");
  const assets = await fs.promises.readdir(publicPath);

  for (const asset of assets) {
    const assetPath = path.resolve(publicPath, `./${asset}`);
    await fs.promises.copyFile(assetPath, path.resolve(outDir, `./${asset}`));
  }

  spinner.succeed();
}
