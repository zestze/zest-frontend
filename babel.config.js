/** @type {import('@babel/core').TransformOptions['plugins']} */
const plugins = [
  /** react-native-reanimated web support @see https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/installation/#web */
  "@babel/plugin-proposal-export-namespace-from",
  /** NOTE: This must be last in the plugins @see https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/installation/#babel-plugin */
  "react-native-reanimated/plugin",
]

/** @type {import('@babel/core').TransformOptions} */
module.exports = function (api) {
  api.cache(true);
  return {
    // running into issues with `babel-preset-expo`. Something about a variable not being interactible .
    // ```
    // Android Bundling failed 809ms node_modules/expo/AppEntry.js (3 modules)
    // ERROR  App.tsx: [BABEL] /home/zeke/Documents/cs/zest-frontend/App.tsx: _traverse.visitors.environmentVisitor is not a function (While processing: "/home/zeke/Documents/cs/zest-frontend/node_modules/babel-preset-expo/build/index.js")
    // ```
    // 
    // removed, then it started say8ing there was a syntax issue with `expo/..../registerRootComponent.tsx
    // `import type ComponentType } from 'react'; // <-- expected "," before C.
    //
    // also somehow got past that and saw an error that says:
    // ```
    // Add @babel/preset-react (https://github.com/babel/babel/tree/main/packages/babel-preset-react) to the 'presets' section of your Babel config to enable transformation.
    // If you want to leave it as-is, add @babel/plugin-syntax-jsx (https://github.com/babel/babel/tree/main/packages/babel-plugin-syntax-jsx) to the 'plugins' section to enable parsing.
    // ````
    //
    // ran `npx expo-doctor@latest` and got the following:
    // ```
    // Expected package @expo/config-plugins@~9.0.0
    // Found invalid:
    // @expo/config-plugins@7.2.5
    // @expo/config-plugins@7.2.4
    // @expo/config-plugins@7.9.2
    // @expo/config-plugins@7.2.5
    // @expo/config-plugins@7.2.5
    // (for more info, run: npm why @expo/config-plugins)
    // Expected package @expo/prebuild-config@~8.0.0
    // Found invalid:
    // @expo/prebuild-config@6.2.5
    // (for more info, run: npm why @expo/prebuild-config)
    // Expected package @expo/metro-config@~0.19.0
    // Found invalid:
    // @expo/metro-config@0.17.8
    // (for more info, run: npm why @expo/metro-config)
    // Advice: Upgrade dependencies that are using the invalid package versions.
    // ```
    //
    // went and ran:
    // ```
    // yarn upgrade @expo/config-plugins@^9.0.0
    // yarn upgrade @expo/prebuild-config@^8.0.0
    // yarn upgrade @expo/metro-config@^0.19.0
    // ```
    // which was kinda guesswork, not super sure on syntax or if that's all that needs to be done.

    presets: ["babel-preset-expo"],
    env: {
      production: {},
    },
    plugins,
  };
};