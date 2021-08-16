import type { languages } from "monaco-editor";
import prettier from "prettier/standalone";
import babel from "prettier/parser-babel";

function getDocumentFormatter(): languages.DocumentFormattingEditProvider {
  return {
    async provideDocumentFormattingEdits(model) {
      const text = prettier.format(model.getValue(), {
        parser: "babel",
        plugins: [babel],
        singleQuote: true,
      });

      return [
        {
          range: model.getFullModelRange(),
          text,
        },
      ];
    },
  };
}

function registerFormatter(language: string) {
  monaco.languages.registerDocumentFormattingEditProvider(
    language,
    getDocumentFormatter()
  );
}

/** Configure prettier for editor */
export function configureFormatter() {
  const languages = ["javascript", "typescript"];
  for (const lang of languages) {
    registerFormatter(lang);
  }
}
