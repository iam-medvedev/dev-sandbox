declare module "find-node-modules" {
  export default function (): string[];
  export default function (path?: string): string[];
  export default function (opts: {
    cwd?: string;
    relative?: boolean;
  }): string[];
}
