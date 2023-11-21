// https://github.com/apexskier/nova-json-language-server/blob/a64f704bee06071ad6fd82062a3656669d62b0a8/src/main.ts#L18-L32
const makeFileExecutable = async (file) => {
  return new Promise((resolve, reject) => {
    const process = new Process("/usr/bin/env", {
      args: ["chmod", "u+x", file],
    });
    process.onDidExit((status) => {
      if (status === 0) {
        resolve();
      } else {
        reject(status);
      }
    });
    process.start();
  });
};

var langserver = null;

const lspPath = nova.path.join(
  nova.extension.path,
  "node_modules/@tailwindcss/language-server/bin/tailwindcss-language-server"
);

exports.activate = function () {
  // Do work when the extension is activated
  const projectRoot = nova.workspace.path;

  nova.commands.register("restart", () => {
    langserver.stop();
    langserver = new ExampleLanguageServer();
  });

  langserver = new ExampleLanguageServer();
};

exports.deactivate = function () {
  // Clean up state before the extension is deactivated
  if (langserver) {
    langserver.deactivate();
    langserver = null;
  }
};

class ExampleLanguageServer {
  constructor() {
    // Observe the configuration setting for the server's location, and restart the server on change
    nova.config.observe(
      "example.language-server-path",
      function (path) {
        this.start(path);
      },
      this
    );
  }

  deactivate() {
    this.stop();
  }

  async start(path) {
    console.log("Starting");
    if (this.languageClient) {
      this.languageClient.stop();
      nova.subscriptions.remove(this.languageClient);
    }

    // Use the default server path
    if (!path) {
      path = lspPath;
    }

    const runShPath = nova.path.join(nova.extension.path, "run.sh");
    await makeFileExecutable(path);
    await makeFileExecutable(runShPath);

    // Create the client
    var serverOptions = {
      // type: "stdio",
      // type: "socket",
      // path: runShPath,
      // path: "./node_modules/@tailwindcss/language-server/bin/tailwindcss-language-server",
      path: lspPath,
      // env: {
      //   TAILWIND_LSP_SERVER: path,
      //   WORKDIR: nova.workspace.path || ".",
      // },
    };

    const initializationOptions = {
      tailwindCSS: {
        classAttributes: [
          "class",
          "className",
          "class:list",
          "classList",
          "ngClass",
        ],
        lint: {
          cssConflict: "warning",
          invalidApply: "error",
          invalidConfigPath: "error",
          invalidScreen: "error",
          invalidTailwindDirective: "error",
          invalidVariant: "error",
          recommendedVariantOrder: "warning",
        },
        validate: true,
      },
    };

    var clientOptions = {
      debug: true,
      syntaxes: [
        "html",
        "javascript",
        "javascript",
        { syntax: "jsx", languageId: "typescript" },
        "typescript",
        "tsx",
        { syntax: "tsx", languageId: "typescript" },
        "css",
        "postcss",
        "less",
        "sass",
        "scss",
        "stylus",
        "sugarss",
        "tailwindcss",
        "aspnetcorerazor",
        "astro",
        "astro-markdown",
        "blade",
        "django-html",
        "edge",
        "ejs",
        "erb",
        "gohtml",
        "GoHTML",
        "gohtmltmpl",
        "haml",
        "handlebars",
        "hbs",
        "html",
        "HTML (Eex)",
        "HTML (EEx)",
        "html-eex",
        "htmldjango",
        "jade",
        "leaf",
        "liquid",
        "markdown",
        "mdx",
        "mustache",
        "njk",
        "nunjucks",
        "phoenix-heex",
        "php",
        "razor",
        "slim",
        "surface",
        "twig",
      ],
      initializationOptions,
    };

    var client = new LanguageClient(
      "tailwindcss-language-server",
      "TailwindCSS LSP",
      serverOptions,
      clientOptions
    );

    try {
      // Start the client
      client.start();

      // Add the client to the subscriptions to be cleaned up
      nova.subscriptions.add(client);
      this.languageClient = client;
      console.log("isrunning: ", client.running);
    } catch (err) {
      // If the .start() method throws, it's likely because the path to the language server is invalid

      if (nova.inDevMode()) {
        // console.error(err);
      }
    }
  }

  stop() {
    console.log("Stopping");
    if (this.languageClient) {
      this.languageClient.stop();
      nova.subscriptions.remove(this.languageClient);
      this.languageClient = null;
    }
  }
}
