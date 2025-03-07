---
title: Vite (Unstable)
---

# Vite (Unstable)

[Vite][vite] is a powerful, performant and extensible development environment for JavaScript projects. In order to improve and extend Remix's bundling capabilities, we're currently exploring the use of Vite as an alternative compiler to esbuild.

**Legend**: ✅ (Tested),❓ (Untested), ⏳ (Not Yet Supported)

| Feature                      | Node | Deno | Cloudflare | Notes                                                                 |
| ---------------------------- | ---- | ---- | ---------- | --------------------------------------------------------------------- |
| Built-in dev server          | ✅   | ❓   | ⏳         |                                                                       |
| Other servers (e.g. Express) | ✅   | ❓   | ⏳         |                                                                       |
| HMR                          | ✅   | ❓   | ⏳         |                                                                       |
| HDR                          | ✅   | ❓   | ⏳         |                                                                       |
| MDX routes                   | ✅   | ❓   | ⏳         | [Supported with some deprecations.][supported-with-some-deprecations] |

## Getting started

To get started with a minimal server, you can use the [`unstable-vite`][template-vite] template:

```shellscript nonumber
npx create-remix@latest --template remix-run/remix/templates/unstable-vite
```

If you'd rather customize your server, you can use the [`unstable-vite-express`][template-vite-express] template:

```shellscript nonumber
npx create-remix@latest --template remix-run/remix/templates/unstable-vite-express
```

These templates include a `vite.config.ts` file which is where the Remix Vite plugin is configured.

## Configuration

The Vite plugin does not use [`remix.config.js`][remix-config]. Instead, the plugin directly accepts the following subset of Remix config options:

- [appDirectory][app-directory]
- [assetsBuildDirectory][assets-build-directory]
- [ignoredRouteFiles][ignored-route-files]
- [publicPath][public-path]
- [routes][routes]
- [serverBuildPath][server-build-path]
- [serverModuleFormat][server-module-format]

For example, to configure `ignoredRouteFiles`:

```ts filename=vite.config.ts lines=[7]
import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
    }),
  ],
});
```

All other bundling-related options are now [configured with Vite][vite-config]. This means you have much greater control over the bundling process.

## New build output paths

There is a notable difference with the way Vite manages the `public` directory compared to the existing Remix compiler. During the build, Vite copies files from the `public` directory into `build/client`, whereas the Remix compiler left the `public` directory untouched and used a subdirectory (`public/build`) as the client build directory.

In order to align the default Remix project structure with the way Vite works, the build output paths have been changed.

- The server is now compiled into `build/server` by default.
- The client is now compiled into `build/client` by default.

This means that the following configuration defaults have been changed:

- [assetsBuildDirectory][assets-build-directory] defaults to `"build/client"` rather than `"public/build"`
- [publicPath][public-path] defaults to `"/"` rather than `"/build/"`
- [serverBuildPath][server-build-path] defaults to `"build/server/index.js"` rather than `"build/index.js"`

## Additional features & plugins

One of the reasons that Remix is moving to Vite is, so you have less to learn when adopting Remix.
This means that, for any additional bundling features you'd like to use, you should reference [Vite documentation][vite] and the [Vite plugin community][vite-plugins] rather than the Remix documentation.

Vite has many [features][vite-features] and [plugins][vite-plugins] that are not built into the existing Remix compiler.
The use of any such features will render the existing Remix compiler unable to compile your app, so only use them if you intend to use Vite exclusively from here on out.

#### `.server` directories

In addition to `.server` files, the Remix's Vite plugin also supports `.server` directories.
Any code in a `.server` directory will be excluded from the client bundle.

```txt
app
├── .server 👈 everything in this directory is excluded from the client bundle
│   ├── auth.ts
│   └── db.ts
├── cms.server.ts 👈 everything in this file is excluded from the client bundle
├── root.tsx
└── routes
    └── _index.tsx
```

`.server` files and directories can be _anywhere_ within your Remix app directory (typically `app/`).
If you need more control, you can always write your own Vite plugins to exclude other files or directories from any other locations.

## Migrating

#### Setup Vite

👉 **Install Vite as a development dependency**

```shellscript nonumber
npm install -D vite
```

Remix is now just a Vite plugin, so you'll need to hook it up to Vite.

👉 **Replace `remix.config.js` with `vite.config.ts` at the root of your Remix app**

```ts filename=vite.config.ts
import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [remix()],
});
```

The subset of [supported Remix config options][supported-remix-config-options] should be passed directly to the plugin:

```ts filename=vite.config.ts lines=[3-5]
export default defineConfig({
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
    }),
  ],
});
```

#### TypeScript integration

Vite handles imports for all sorts of different file types, sometimes in ways that differ from the existing Remix compiler, so let's reference Vite's types from `vite/client` instead of the obsolete types from `@remix-run/dev`.

👉 **Rename `remix.env.d.ts` to `env.d.ts`**

```diff nonumber
-/remix.env.d.ts
+/env.d.ts
```

👉 **Replace `@remix-run/dev` types with `vite/client` in `env.d.ts`**

```diff filename=env.d.ts
-/// <reference types="@remix-run/dev" />
+/// <reference types="vite/client" />
/// <reference types="@remix-run/node" />
```

👉 **Replace reference to `remix.env.d.ts` with `env.d.ts` in `tsconfig.json`**

```diff filename=tsconfig.json
- "include": ["remix.env.d.ts", "**/*.ts", "**/*.tsx"],
+ "include": ["env.d.ts", "**/*.ts", "**/*.tsx"],
```

👉 **Ensure `module` and `moduleResolution` fields are set correctly in `tsconfig.json`**

```json filename=tsconfig.json
"module": "ESNext",
"moduleResolution": "Bundler",
```

#### Migrating from Remix App Server

If you were using `remix-serve` in development (or `remix dev` without the `-c` flag), you'll need to switch to the new minimal dev server.
It comes built-in with the Remix Vite plugin and will take over when you run `remix vite:dev`.

Unlike `remix-serve`, the Remix Vite plugin doesn't install any [global Node polyfills][global-node-polyfills] so you'll need to install them yourself if you were relying on them. The easiest way to do this is by calling `installGlobals` at the top of your Vite config.

You'll also need to update to the new build output paths, which are `build/server` for the server and `build/client` for client assets.

👉 **Update your `dev`, `build` and `start` scripts**

```json filename=package.json lines=[3-4]
{
  "scripts": {
    "dev": "remix vite:dev",
    "build": "remix vite:build",
    "start": "remix-serve ./build/server/index.js"
  }
}
```

👉 **Install global Node polyfills in your Vite config**

```diff filename=vite.config.ts
import { unstable_vitePlugin as remix } from "@remix-run/dev";
+import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";

+installGlobals();

export default defineConfig({
  plugins: [remix()],
});
```

#### Migrating from a custom server

If you were using a custom server in development, you'll need to edit your custom server to use Vite's `connect` middleware.
This will delegate asset requests and initial render requests to Vite during development, letting you benefit from Vite's excellent DX even with a custom server.

You can then load the virtual module named `"virtual:remix/server-build"` during development to create a Vite-based request handler.

You'll also need to update your server code to reference the new build output paths, which are `build/server` for the server build and `build/client` for client assets.

For example, if you were using Express, here's how you could do it.

👉 **Update your `server.mjs` file**

```ts filename=server.mjs lines=[1,8-17,21-24,32,39-44]
import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import express from "express";

installGlobals();

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const app = express();

// handle asset requests
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    "/assets",
    express.static("build/client/assets", {
      immutable: true,
      maxAge: "1y",
    })
  );
}
app.use(express.static("build/client", { maxAge: "1h" }));

// handle SSR requests
app.all(
  "*",
  createRequestHandler({
    build: viteDevServer
      ? () =>
          viteDevServer.ssrLoadModule(
            "virtual:remix/server-build"
          )
      : await import("./build/server/index.js"),
  })
);

const port = 3000;
app.listen(port, () =>
  console.log("http://localhost:" + port)
);
```

👉 **Update your `build`, `dev`, and `start` scripts**

```json filename=package.json
{
  "scripts": {
    "dev": "node ./server.mjs",
    "build": "remix vite:build",
    "start": "cross-env NODE_ENV=production node ./server.mjs"
  }
}
```

If you prefer, you can instead author your custom server in TypeScript.
You could then use tools like [`tsx`][tsx] or [`tsm`][tsm] to run your custom server:

```shellscript nonumber
tsx ./server.ts
node --loader tsm ./server.ts
```

Just remember that there might be some noticeable slowdown for initial server startup if you do this.

#### Migrate references to build output paths

When using the existing Remix compiler's default options, the server was compiled into `build` and the client was compiled into `public/build`. Due to differences with the way Vite typically works with its `public` directory compared to the existing Remix compiler, these output paths have changed.

👉 **Update references to build output paths**

- The server is now compiled into `build/server` by default.
- The client is now compiled into `build/client` by default.

For example, to update the Dockerfile from the [Blues Stack][blues-stack]:

```diff filename=Dockerfile
-COPY --from=build /myapp/build /myapp/build
-COPY --from=build /myapp/public /myapp/public
+COPY --from=build /myapp/build/server /myapp/build/server
+COPY --from=build /myapp/build/client /myapp/build/client
```

#### Configure path aliases

The Remix compiler leverages the `paths` option in your `tsconfig.json` to resolve path aliases. This is commonly used in the Remix community to define `~` as an alias for the `app` directory.

Vite does not provide any path aliases by default. If you were relying on this feature, you can install the [vite-tsconfig-paths][vite-tsconfig-paths] plugin to automatically resolve path aliases from your `tsconfig.json` in Vite, matching the behavior of the Remix compiler:

👉 **Install `vite-tsconfig-paths`**

```shellscript nonumber
npm install -D vite-tsconfig-paths
```

👉 **Add `vite-tsconfig-paths` to your Vite config**

```ts filename=vite.config.ts lines=[3,6]
import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [remix(), tsconfigPaths()],
});
```

#### Remove `@remix-run/css-bundle`

Vite has built-in support for CSS side effect imports, PostCSS and CSS Modules, among other CSS bundling features. The Remix Vite plugin automatically attaches bundled CSS to the relevant routes.

The <nobr>[`@remix-run/css-bundle`][css-bundling]</nobr> package is redundant when using Vite since its `cssBundleHref` export will always be `undefined`.

👉 **Uninstall `@remix-run/css-bundle`**

```shellscript nonumber
npm uninstall @remix-run/css-bundle
```

👉 **Remove references to `cssBundleHref`**

```diff filename=app/root.tsx
- import { cssBundleHref } from "@remix-run/css-bundle";
  import type { LinksFunction } from "@remix-run/node"; // or cloudflare/deno

  export const links: LinksFunction = () => [
-   ...(cssBundleHref
-     ? [{ rel: "stylesheet", href: cssBundleHref }]
-     : []),
    // ...
  ];
```

If a route's `links` function is only used to wire up `cssBundleHref`, you can remove it entirely.

```diff filename=app/root.tsx
- import { cssBundleHref } from "@remix-run/css-bundle";
- import type { LinksFunction } from "@remix-run/node"; // or cloudflare/deno

- export const links: LinksFunction = () => [
-   ...(cssBundleHref
-     ? [{ rel: "stylesheet", href: cssBundleHref }]
-     : []),
- ];
```

#### Fix up CSS imports

In Vite, CSS files are typically imported as side effects.

During development, [Vite injects imported CSS files into the page via JavaScript,][vite-css] and the Remix Vite plugin will inline imported CSS alongside your link tags to avoid a flash of unstyled content. In the production build, the Remix Vite plugin will automatically attach CSS files to the relevant routes.

This also means that in many cases you won't need the `links` function export anymore.

Since the order of your CSS is determined by its import order, you'll need to ensure that your CSS imports are in the same order as your `links` function.

👉 **Convert CSS imports into side effects — in the same order they were in your `links` function!**

```diff filename=app/dashboard/route.tsx
- import type { LinksFunction } from "@remix-run/node"; // or cloudflare/deno

- import dashboardStyles from "./dashboard.css?url";
- import sharedStyles from "./shared.css?url";
+ // ⚠️ NOTE: The import order has been updated
+ //   to match the original `links` function!
+ import "./shared.css";
+ import "./dashboard.css";

- export const links: LinksFunction = () => [
-   { rel: "stylesheet", href: sharedStyles },
-   { rel: "stylesheet", href: dashboardStyles },
- ];
```

<docs-warning>While [Vite supports importing static asset URLs via an explicit `?url` query string][vite-url-imports], which in theory would match the behavior of the existing Remix compiler when used for CSS files, there is a [known Vite issue with `?url` for CSS imports][vite-css-url-issue]. This may be fixed in the future, but in the meantime you should exclusively use side effect imports for CSS.</docs-warning>

#### Optionally scope regular CSS

If you were using [Remix's regular CSS support][regular-css], one important caveat to be aware of is that these styles will no longer be mounted and unmounted automatically when navigating between routes during development.

As a result, you may be more likely to encounter CSS collisions. If this is a concern, you might want to consider migrating your regular CSS files to [CSS Modules][vite-css-modules] or using a naming convention that prefixes class names with the corresponding file name.

#### Enable Tailwind via PostCSS

If your project is using [Tailwind CSS][tailwind], you'll first need to ensure that you have a [PostCSS][postcss] config file which will get automatically picked up by Vite.
This is because the Remix compiler didn't require a PostCSS config file when Remix's `tailwind` option was enabled.

👉 **Add PostCSS config if it's missing, including the `tailwindcss` plugin**

```js filename=postcss.config.mjs
export default {
  plugins: {
    tailwindcss: {},
  },
};
```

If your project already has a PostCSS config file, you'll need to add the `tailwindcss` plugin if it's not already present.
This is because the Remix compiler included this plugin automatically when Remix's [`tailwind` config option][tailwind-config-option] was enabled.

👉 **Add the `tailwindcss` plugin to your PostCSS config if it's missing**

```js filename=postcss.config.mjs lines=[3]
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

👉 **Convert Tailwind CSS import to a side effect**

If you haven't already, be sure to [convert your CSS imports to side effects.][convert-your-css-imports-to-side-effects]

```diff filename=app/dashboard/route.tsx
// Don't export as a link descriptor:
- import type { LinksFunction } from "@remix-run/node"; // or cloudflare/deno

- import tailwind from "./tailwind.css";

- export const links: LinksFunction = () => [
-   { rel: "stylesheet", href: tailwind },
- ];

// Import as a side effect instead:
+ import "./tailwind.css";
```

#### Add Vanilla Extract plugin

If you're using [Vanilla Extract][vanilla-extract], you'll need to set up the Vite plugin.

👉 **Install the official [Vanilla Extract plugin for Vite][vanilla-extract-vite-plugin]**

```shellscript nonumber
npm install -D @vanilla-extract/vite-plugin
```

👉 **Add the Vanilla Extract plugin to your Vite config**

```ts filename=vite.config.ts lines=[2,6]
import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [remix(), vanillaExtractPlugin()],
});
```

#### Add MDX plugin

If you're using [MDX][mdx], since Vite's plugin API is an extension of the [Rollup][rollup] plugin API, you should use the official [MDX Rollup plugin][mdx-rollup-plugin]:

👉 **Install the MDX Rollup plugin**

```shellscript nonumber
npm install -D @mdx-js/rollup
```

👉 **Add the MDX Rollup plugin to your Vite config**

```ts filename=vite.config.ts lines=[1,6]
import mdx from "@mdx-js/rollup";
import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [remix(), mdx()],
});
```

##### Add MDX frontmatter support

The Remix compiler allowed you to define [frontmatter in MDX][mdx-frontmatter]. If you were using this feature, you can achieve this in Vite using [remark-mdx-frontmatter].

👉 **Install the required [Remark][remark] frontmatter plugins**

```shellscript nonumber
npm install -D remark-frontmatter remark-mdx-frontmatter
```

👉 **Pass the Remark frontmatter plugins to the MDX Rollup plugin**

```ts filename=vite.config.ts lines=[3-4,10-15]
import mdx from "@mdx-js/rollup";
import { unstable_vitePlugin as remix } from "@remix-run/dev";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    remix(),
    mdx({
      remarkPlugins: [
        remarkFrontmatter,
        remarkMdxFrontmatter,
      ],
    }),
  ],
});
```

In the Remix compiler, the frontmatter export was named `attributes`. This differs from the frontmatter plugin's default export name of `frontmatter`. Although it's possible to configure the frontmatter export name, we recommend updating your app code to use the default export name instead.

👉 **Rename MDX `attributes` export to `frontmatter` within MDX files**

```diff filename=app/posts/first-post.mdx
  ---
  title: Hello, World!
  ---

- # {attributes.title}
+ # {frontmatter.title}
```

👉 **Rename MDX `attributes` export to `frontmatter` for consumers**

```diff filename=app/routes/posts/first-post.tsx
  import Component, {
-   attributes,
+   frontmatter,
  } from "./posts/first-post.mdx";
```

###### Define types for MDX files

👉 **Add types for `*.mdx` files to `env.d.ts`**

```ts filename=env.d.ts lines=[4-8]
/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

declare module "*.mdx" {
  let MDXComponent: (props: any) => JSX.Element;
  export const frontmatter: any;
  export default MDXComponent;
}
```

###### Map MDX frontmatter to route exports

The Remix compiler allowed you to define `headers`, `meta` and `handle` route exports in your frontmatter. This Remix-specific feature is obviously not supported by the `remark-mdx-frontmatter` plugin. If you were using this feature, you should manually map frontmatter to route exports yourself:

👉 **Map frontmatter to route exports for MDX routes**

```mdx lines=[10-11]
---
meta:
  - title: My First Post
  - name: description
    content: Isn't this awesome?
headers:
  Cache-Control: no-cache
---

export const meta = frontmatter.meta;
export const headers = frontmatter.headers;

# Hello World
```

Note that, since you're explicitly mapping MDX route exports, you're now free to use whatever frontmatter structure you like.

```mdx
---
title: My First Post
description: Isn't this awesome?
---

export const meta = () => {
  return [
    { title: frontmatter.title },
    {
      name: "description",
      content: frontmatter.description,
    },
  ];
};

# Hello World
```

###### Update MDX filename usage

The Remix compiler also provided a `filename` export from all MDX files. This was primarily designed to enable linking to collections of MDX routes. If you were using this feature, you can achieve this in Vite via [glob imports][glob-imports] which give you a handy data structure that maps file names to modules. This makes it much easier to maintain a list of MDX files since you no longer need to import each one manually.

For example, to import all MDX files in the `posts` directory:

```ts
const posts = import.meta.glob("./posts/*.mdx");
```

This is equivalent to writing this by hand:

```ts
const posts = {
  "./posts/a.mdx": () => import("./posts/a.mdx"),
  "./posts/b.mdx": () => import("./posts/b.mdx"),
  "./posts/c.mdx": () => import("./posts/c.mdx"),
  // etc.
};
```

You can also eagerly import all MDX files if you'd prefer:

```ts
const posts = import.meta.glob("./posts/*.mdx", {
  eager: true,
});
```

#### Strict route exports

With Vite, Remix gets stricter about which exports are allowed from your route modules.

Previously, Remix allowed user-defined exports from routes.
The Remix compiler would then rely on treeshaking to remove any code only intended for use on the server from the client bundle.

```ts filename=app/routes/super-cool.tsx
// `loader`: always server-only, remove from client bundle 👍
export const loader = () => {};

// `default`: always client-safe, keep `default` in client bundle 👍
export default function SuperCool() {}

// User-defined export
export const mySuperCoolThing = () => {
  /*
  Client-safe or server-only? Depends on what code is in here... 🤷
  Rely on treeshaking to remove from client bundle if it depends on server-only code.
  */
};
```

In contrast, Vite processes each module in isolation during development, so relying on cross-module treeshaking is not an option.
For most modules, you should already be using `.server` files or directories to isolate server-only code.
But routes are a special case since they intentionally blend client and server code.
Remix knows that exports like `loader`, `action`, `headers`, etc. are server-only, so it can safely remove them from the client bundle.
But there's no way to know when looking at a single route module in isolation whether user-defined exports are server-only.
That's why Remix's Vite plugin is stricter about which exports are allowed from your route modules.

```ts filename=app/routes/super-cool.tsx
export const loader = () => {}; // server-only 👍
export default function SuperCool() {} // client-safe 👍

// Need to decide whether this is client-safe or server-only without any other information 😬
export const mySuperCoolThing = () => {};
```

In fact, we'd rather not rely on treeshaking for correctness at all.
If tomorrow you or your coworker accidentally imports something you _thought_ was client-safe,
treeshaking will no longer exclude that from your client bundle and you might end up with server code in your app!
Treeshaking is designed as a pure optimization, so relying on it for correctness is brittle.

So instead of treeshaking, its better to be explicit about what code is client-safe and what code is server-only.
For route modules, that means only exporting Remix route exports.
For anything else, put it in a separate module and use a `.server` file or directory when needed.

Ultimately, Route exports are Remix API.
Think of a Remix route module like a function and the exports like named arguments to the function.

```ts
// Not real API, just a mental model
const route = createRoute({ loader, mySuperCoolThing });
//                                  ^^^^^^^^^^^^^^^^
// Object literal may only specify known properties, and 'mySuperCoolThing' does not exist in type 'RemixRoute'
```

Just like how you shouldn't pass unexpected named arguments to a function, you shouldn't create unexpected exports from a route module.
The result is that Remix is simpler and more predictable.
In short, Vite made us eat our veggies, but turns out they were delicious all along!

👉 **Move any user-defined route exports to a separate module**

For example, here's a route with a user-defined export called `mySuperCoolThing`:

```ts filename=app/routes/super-cool.tsx
// ✅ This is a valid Remix route export, so it's fine
export const loader = () => {};

// ✅ This is also a valid Remix route export
export default function SuperCool() {}

// ❌ This isn't a Remix-specific route export, just something I made up
export const mySuperCoolThing = () => {};
```

One option is to colocate your route and related utilities in the same directory if your routing convention allows it.
For example, with the default route convention in v2:

```ts filename=app/routes/super-cool/route.tsx
export const loader = () => {};

export default function SuperCool() {}
```

```ts filename=app/routes/super-cool/utils.ts
// If this was server-only code, I'd rename this file to "utils.server.ts"
export const mySuperCoolThing = () => {};
```

##### Full Stack components

[Full stack components][fullstack-components] are components that are colocated in the same file as a resource route and exported for use in other routes.
They access data from a resource route by fetching that route's URL.

Conceptually, it's tempting to think of full stack components as a new concept,
but as far as Remix is concerned, they are standard React components.
Looking closer, they only depend on the resource route's URL and the type for the corresponding `loader`.
That means they are shared components with _zero_ runtime dependencies on code from the resource route.
Organize them they way you would organize any shared component.

For better intuition, consider a full stack component that needs to fetch data from multiple resource routes.
It doesn't belong to any particular resource route.

👉 **Move full stack components alongside other shared components**

```ts filename=app/components/hello.tsx
export function Hello() {
  /* ... */
}
```

👉 **Export the loader's type from the resource route**

```diff filename=app/routes/api/hello.ts
+ export type Loader = typeof loader;
```

👉 **Replace `typeof loader` with `Loader` type**

```diff filename=app/components/hello.tsx
+ import type { Loader } from "~/routes/api/hello";

export function Hello() {
  // ...
-   const data = useFetcher<typeof loader>()
+   const data = useFetcher<Loader>()
  // ...
}
```

## Troubleshooting

Check out the [known issues with the Remix Vite plugin on GitHub][issues-vite] before filing a new bug report!

#### HMR

If you are expecting hot updates but getting full page reloads,
check out our [discussion on Hot Module Replacement][hmr] to learn more about the limitations of React Fast Refresh and workarounds for common issues.

#### ESM / CJS

Vite supports both ESM and CJS dependencies, but sometimes you might still run into issues with ESM / CJS interop.
Usually, this is because a dependency is not properly configured to support ESM.
And we don't blame them, its [really tricky to support both ESM and CJS properly][modernizing-packages-to-esm].

To diagnose if one of your dependencies is misconfigured, check [publint][publint] or [_Are The Types Wrong_][arethetypeswrong].
Additionally, you can use the [vite-plugin-cjs-interop plugin][vite-plugin-cjs-interop] smooth over issues with `default` exports for external CJS dependencies.

Finally, you can also explicitly configure which dependencies to bundle into your server bundled
with [Vite's `ssr.noExternal` option][ssr-no-external] to emulate the Remix compiler's [`serverDependenciesToBundle`][server-dependencies-to-bundle] with the Remix Vite plugin.

#### Server code not tree shaken in development

In production, Vite tree-shakes server-only code from your client bundle, just like the existing Remix compiler.
However, in development, Vite lazily compiles each module on-demand and therefore _does not_ tree shake across module boundaries.

If you run into browser errors in development that reference server-only code, be sure to place that [server-only code in a `.server` file][server-only-code].

At first, this might seem like a compromise for DX when compared to the existing Remix compiler, but the mental model is simpler: `.server` is for server-only code, everything else could be on both the client and the server.

#### Plugin usage with other Vite-based tools (e.g. Vitest, Storybook)

The Remix Vite plugin is only intended for use in your application's development server and production builds.
While there are other Vite-based tools such as Vitest and Storybook that make use of the Vite config file, the Remix Vite plugin has not been designed for use with these tools.
We currently recommend excluding the plugin when used with other Vite-based tools.

For Vitest:

```ts filename=vite.config.ts lines=[7,12-13]
import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { defineConfig, loadEnv } from "vite";

export default defineConfig({
  plugins: [!process.env.VITEST && remix()],
  test: {
    environment: "happy-dom",
    // Additionally, this is to load ".env.test" during vitest
    env: loadEnv("test", process.cwd(), ""),
  },
});
```

For Storybook:

```ts filename=vite.config.ts lines=[7]
import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

const isStorybook = process.argv[1]?.includes("storybook");

export default defineConfig({
  plugins: [!isStorybook && remix()],
});
```

Alternatively, you can use separate Vite config files for each tool.
For example, to use a Vite config specifically scoped to Remix:

```shellscript nonumber
remix vite:dev --config vite.config.remix.ts
```

## Acknowledgements

Vite is an amazing project, and we're grateful to the Vite team for their work.
Special thanks to [Matias Capeletto, Arnaud Barré, and Bjorn Lu from the Vite team][vite-team] for their guidance.

The Remix community was quick to explore Vite support, and we're grateful for their contributions:

- [Discussion: Consider using Vite][consider-using-vite]
- [remix-kit][remix-kit]
- [remix-vite][remix-vite]
- [vite-plugin-remix][vite-plugin-remix]

Finally, we were inspired by how other frameworks implemented Vite support:

- [Astro][astro]
- [SolidStart][solidstart]
- [SvelteKit][sveltekit]

We're definitely late to the Vite party, but we're excited to be here now!

[vite]: https://vitejs.dev
[supported-with-some-deprecations]: #add-mdx-plugin
[template-vite]: https://github.com/remix-run/remix/tree/main/templates/unstable-vite
[template-vite-express]: https://github.com/remix-run/remix/tree/main/templates/unstable-vite-express
[remix-config]: ../file-conventions/remix-config
[app-directory]: ../file-conventions/remix-config#appdirectory
[assets-build-directory]: ../file-conventions/remix-config#assetsbuilddirectory
[ignored-route-files]: ../file-conventions/remix-config#ignoredroutefiles
[public-path]: ../file-conventions/remix-config#publicpath
[routes]: ../file-conventions/remix-config#routes
[server-build-path]: ../file-conventions/remix-config#serverbuildpath
[server-module-format]: ../file-conventions/remix-config#servermoduleformat
[vite-config]: https://vitejs.dev/config
[vite-plugins]: https://vitejs.dev/plugins
[vite-features]: https://vitejs.dev/guide/features
[supported-remix-config-options]: #configuration
[tsx]: https://github.com/esbuild-kit/tsx
[tsm]: https://github.com/lukeed/tsm
[vite-tsconfig-paths]: https://github.com/aleclarson/vite-tsconfig-paths
[css-bundling]: ../styling/bundling
[vite-css]: https://vitejs.dev/guide/features.html#css
[regular-css]: ../styling/css
[vite-css-modules]: https://vitejs.dev/guide/features#css-modules
[vite-url-imports]: https://vitejs.dev/guide/assets.html#explicit-url-imports
[vite-css-url-issue]: https://github.com/remix-run/remix/issues/7786
[tailwind]: https://tailwindcss.com
[postcss]: https://postcss.org
[tailwind-config-option]: ../file-conventions/remix-config#tailwind
[convert-your-css-imports-to-side-effects]: #fix-up-css-imports
[vanilla-extract]: https://vanilla-extract.style
[vanilla-extract-vite-plugin]: https://vanilla-extract.style/documentation/integrations/vite
[mdx]: https://mdxjs.com
[rollup]: https://rollupjs.org
[mdx-rollup-plugin]: https://mdxjs.com/packages/rollup
[mdx-frontmatter]: https://mdxjs.com/guides/frontmatter
[remark-mdx-frontmatter]: https://github.com/remcohaszing/remark-mdx-frontmatter
[remark]: https://remark.js.org
[glob-imports]: https://vitejs.dev/guide/features.html#glob-import
[issues-vite]: https://github.com/remix-run/remix/labels/vite
[hmr]: ../discussion/hot-module-replacement
[server-only-code]: ../guides/gotchas#server-code-in-client-bundles
[vite-team]: https://vitejs.dev/team
[consider-using-vite]: https://github.com/remix-run/remix/discussions/2427
[remix-kit]: https://github.com/jrestall/remix-kit
[remix-vite]: https://github.com/sudomf/remix-vite
[vite-plugin-remix]: https://github.com/yracnet/vite-plugin-remix
[astro]: https://astro.build/
[solidstart]: https://start.solidjs.com/getting-started/what-is-solidstart
[sveltekit]: https://kit.svelte.dev/
[modernizing-packages-to-esm]: https://blog.isquaredsoftware.com/2023/08/esm-modernization-lessons/
[arethetypeswrong]: https://arethetypeswrong.github.io/
[publint]: https://publint.dev/
[vite-plugin-cjs-interop]: https://github.com/cyco130/vite-plugin-cjs-interop
[ssr-no-external]: https://vitejs.dev/config/ssr-options.html#ssr-noexternal
[server-dependencies-to-bundle]: https://remix.run/docs/en/main/file-conventions/remix-config#serverdependenciestobundle
[blues-stack]: https://github.com/remix-run/blues-stack
[global-node-polyfills]: ../other-api/node#polyfills
[fullstack-components]: https://www.epicweb.dev/full-stack-components
