import fs from "fs";
import path from "path";
import * as ts from "typescript";
import ora from "ora";
import { getTmpPath } from "./utils";

const currentDir = process.cwd();

async function getTSConfig(tsConfigPath: string) {
  const outDir = getTmpPath("./types");
  const fileName = path.resolve(currentDir, tsConfigPath);
  const configText = await fs.promises.readFile(fileName, "utf-8");
  const configJson = ts.parseConfigFileTextToJson(fileName, configText);

  const result = ts.parseJsonConfigFileContent(
    configJson.config,
    ts.sys,
    path.dirname(fileName)
  );

  const options: ts.CompilerOptions = {
    ...result.options,
    esModuleInterop: true,
    emitDeclarationOnly: true,
    declaration: true,
    outDir,
    baseUrl: currentDir,
    rootDir: currentDir,
  };

  return {
    compilerOptions: options,
    fileNames: result.fileNames,
  };
}

function getTypesJSON(sourceFiles: readonly ts.SourceFile[], rootDir?: string) {
  const result: Record<string, string> = {};
  if (!rootDir) {
    return result;
  }

  const printer = ts.createPrinter();

  for (const file of sourceFiles) {
    const relativePath = path.relative(rootDir, file.fileName);
    result[relativePath] = printer.printFile(file);
  }

  return result;
}

/** Generate types for whole project in Record<relativePath, d.ts> */
export async function generateTypes(tsConfigPath = "tsconfig.json") {
  // Loading tsconfig
  const spinnerLoadingConfig = ora(
    `Loading typescript config from: ${tsConfigPath}`
  ).start();
  const { compilerOptions, fileNames } = await getTSConfig(tsConfigPath);
  spinnerLoadingConfig.succeed(`Typescript config loaded from ${tsConfigPath}`);

  // Generating types
  const spinnerGeneration = ora("Generating types").start();
  const host = ts.createCompilerHost(compilerOptions);
  const program = ts.createProgram(fileNames, compilerOptions, host);
  program.emit();

  const result = getTypesJSON(
    program.getSourceFiles(),
    compilerOptions.rootDir
  );

  spinnerGeneration.succeed("Types generated");

  return {
    typesPath: compilerOptions.outDir,
    types: result,
  };
}
