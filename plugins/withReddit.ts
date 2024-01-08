import {
    ConfigPlugin,
    AndroidManifest,
    withAndroidManifest,
} from "expo/config-plugins"

export const withReddit: ConfigPlugin = (config) => {
    return withAndroidReddit(config)
}

// want:
// <package android:name:"com.reddit.frontpage" />
const withAndroidReddit: ConfigPlugin = (config) => {
    return withAndroidManifest(config, (config) => {
        const oldManifest = config.modResults.manifest as ManifestWithQueries

        //const queries: ManifestQueries[] = oldManifest.queries ?? [];
        const manifest: ManifestWithQueries = {
            ...oldManifest,
            queries: [...(oldManifest.queries ?? []), ...redditQueries],
        }
        config.modResults.manifest = manifest

        return config
    })
}

// copying this from https://github.com/expo/config-plugins/issues/123
// the category, etc. might not all be super relevant?
const redditQueries: ManifestQueries[] = [{
    package: [
        {
            $: {
                "android:name": "com.reddit.frontpage"
            },
        },
    ],
    intent: [
        {
            action: {
                $: {
                    "android:name": "android.intent.action.VIEW",
                },
            },
            category: {
                $: {
                    "android:name": "android.intent.category.BROWSABLE",
                },
            },
            data: {
                $: {
                    "android:scheme": "https",
                },
            },
        },
    ],
}]

type ManifestQueries = {
    package: {
        $: {
            "android:name": string;
        };
    }[];
    intent: {
        action: {
            $: {
                "android:name": string;
            };
        };
        category: {
            $: {
                "android:name": string;
            };
        };
        data: {
            $: {
                "android:scheme": string;
            };
        };
    }[];
};

type ManifestWithQueries = AndroidManifest["manifest"] & {
    queries?: ManifestQueries[]
}