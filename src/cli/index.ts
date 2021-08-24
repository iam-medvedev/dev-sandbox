#!/usr/bin/env node
import { getConfig } from "./config";
import { generateTypes } from "./local-types";
import {
  copyPublicAssets,
  getSandboxDir,
  writeGeneratedAssets,
} from "./assets";

/** Builder */
async function buildSandbox() {
  // Create sandbox directory
  const sandboxOutDir = await getSandboxDir();

  // Get config
  const config = await getConfig();

  // Generate types
  const localTypes = await generateTypes();

  // Get public assets (html, etc)
  await copyPublicAssets(sandboxOutDir);

  // Write generated assets (config, types)
  await writeGeneratedAssets(sandboxOutDir, { config, localTypes });

  console.log("Done! Your sandbox is created at '.sandbox' folder");
}

// Start builder
buildSandbox();
