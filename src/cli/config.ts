import { cosmiconfig } from "cosmiconfig";
import type { Config } from "../types";

export async function getConfig() {
  const configExplorer = cosmiconfig("sandbox");
  const result = await configExplorer.search();

  const config: Config = {
    initialCode: `// Write your code here`,
    typescript: true,
    ...(result?.config || {}),
  };

  return config;
}
