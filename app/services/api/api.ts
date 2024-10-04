/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://github.com/infinitered/ignite/blob/master/docs/Backend-API-Integration.md)
 * documentation for more details.
 */
import { ApiResponse, ApisauceInstance, create } from "apisauce"
import Config from "../../config"
import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem"
import type {
  ApiConfig,
  ApiDropletResponse,
  MetacriticItem,
  NameWithListens,
  RedditItem,
} from "./api.types"
import type { RedditPostSnapshotIn } from "../../models/RedditPost"
import { MetacriticPostSnapshotIn } from "app/models/Metacritic"

/**
 * Configuring the apisauce instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  timeout: 10000,
}

// TODO(zeke): is this the best place for this?
export interface MetacriticTitles {
  title: string
  medium: string
};

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })
  }

  async getRedditPosts(
    subreddit?: string,
  ): Promise<{ kind: "ok"; posts: RedditPostSnapshotIn[] } | GeneralApiProblem> {
    const response: ApiResponse<ApiDropletResponse> = await this.apisauce.get(
      subreddit ? `v1/reddit/posts?subreddit=${subreddit}` : `v1/reddit/posts`,
    )

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const rawData = response.data

      const posts: RedditPostSnapshotIn[] =
        (rawData?.posts as RedditItem[]).map((raw: RedditItem) => ({
          ...raw,
        })) ?? []

      return { kind: "ok", posts }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  async getSubreddits(): Promise<{ kind: "ok"; subreddits: string[] } | GeneralApiProblem> {
    const response: ApiResponse<ApiDropletResponse> = await this.apisauce.get(
      `v1/reddit/subreddits`,
    )

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const rawData = response.data
      const subreddits = rawData?.subreddits ?? []
      return { kind: "ok", subreddits }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  async getMetacriticPosts(
    medium: string,
    minYear: number,
    maxYear: number,
  ): Promise<{ kind: "ok"; posts: MetacriticPostSnapshotIn[] } | GeneralApiProblem> {
    const response: ApiResponse<ApiDropletResponse> = await this.apisauce.get(
      `v1/metacritic/posts?medium=${medium}&min_year=${minYear}&max_year=${maxYear}`,
    )

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const rawData = response.data
      const posts: MetacriticPostSnapshotIn[] = (rawData?.posts as MetacriticItem[]).map(
        (raw: MetacriticItem) => ({
          ...raw,
          release_date: new Date(raw.release_date as string),
        }),
      )
      return { kind: "ok", posts }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  // TODO(zeke): does kind need to be created?
  async saveMetacriticPosts(
    ids: number[],
    action?: string | undefined,
  ): Promise<{ kind: "ok" } | GeneralApiProblem> {
    if (action === undefined) {
      action = "saved"
    }
    const response = await this.apisauce.patch(
      `v1/metacritic/posts`,
      JSON.stringify({ posts: ids, action: action })
    )

    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        return problem;
      }
    }
    try {
      if (response.data === undefined) {
        return { kind: "bad-data" };
      }
      return { kind: "ok" };
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack);
      }
      return { kind: "bad-data" };
    }
  }

  async getSpotifyArtists(
    startTime: Date,
    endTime?: Date,
  ): Promise<
    | {
      kind: "ok"
      artists: NameWithListens[]
    }
    | GeneralApiProblem
  > {
    let url = `v1/spotify/artists?start=${startTime.toISOString()}`
    if (endTime !== undefined) url = `${url}&end=${endTime.toISOString()}`
    const response: ApiResponse<ApiDropletResponse> = await this.apisauce.get(url)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      if (response.data === undefined) return { kind: "bad-data" }
      return { kind: "ok", artists: response.data?.artists }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  async loginUser(
    username: string,
    password: string,
  ): Promise<{ kind: "ok"; token: string; expiresAt: Date } | GeneralApiProblem> {
    const response: ApiResponse<ApiDropletResponse> = await this.apisauce.post(
      `login`,
      JSON.stringify({ username, password }),
      { headers: { "Content-Type": "application/json" } },
    )

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const cookie: string | undefined = response.headers?.["set-cookie"]
      if (cookie === undefined) {
        return { kind: "unauthorized" }
      }

      const { token, expiresAt } = this.extractFromCookie(cookie)
      // if I don't do `${token}` it does some weird stuff
      return { kind: "ok", token: `${token}`, expiresAt }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  async refreshCreds(): Promise<
    { kind: "ok"; token: string; expiresAt: Date } | GeneralApiProblem
  > {
    const response: ApiResponse<ApiDropletResponse> = await this.apisauce.post("refresh")

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const cookie: string | undefined = response.headers?.["set-cookie"]
      if (cookie === undefined) {
        return { kind: "unauthorized" }
      }

      const { token, expiresAt } = this.extractFromCookie(cookie)
      // if I don't do `${token}` it does some weird stuff
      return { kind: "ok", token: `${token}`, expiresAt }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  // grab the cookie and the expiration date from the header
  // might look like:
  // zest-token=be1d80f8-8fac-4eea-8627-b428c705ccd6; Expires=Wed, 17 Jan 2024 13:17:49 GMT
  extractFromCookie(header: string | object) {
    const parts = header.toString().split(";")
    const token: string = parts[0]
    const expiresAt: Date = new Date(parts[1].split("Expires=")[1])
    return { token, expiresAt }
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
