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
  ApiFeedResponse,
  MetacriticItem,
  RedditItem,
} from "./api.types"
import type { EpisodeSnapshotIn } from "../../models/Episode"
import type { RedditPostSnapshotIn } from "../../models/RedditPost"
import { MetacriticPostSnapshotIn } from "app/models/Metacritic"

/**
 * Configuring the apisauce instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  timeout: 10000,
}

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

  /**
   * Gets a list of recent React Native Radio episodes.
   */
  async getEpisodes(): Promise<{ kind: "ok"; episodes: EpisodeSnapshotIn[] } | GeneralApiProblem> {
    // make the api call
    const response: ApiResponse<ApiFeedResponse> = await this.apisauce.get(
      `api.json?rss_url=https%3A%2F%2Ffeeds.simplecast.com%2FhEI_f9Dx`,
    )

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      const rawData = response.data

      // This is where we transform the data into the shape we expect for our MST model.
      const episodes: EpisodeSnapshotIn[] =
        rawData?.items.map((raw) => ({
          ...raw,
        })) ?? []

      return { kind: "ok", episodes }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  async getRedditPosts(): Promise<
    { kind: "ok"; posts: RedditPostSnapshotIn[] } | GeneralApiProblem
  > {
    const response: ApiResponse<ApiDropletResponse> = await this.apisauce.get(`v1/reddit/posts`)

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
    const response: ApiResponse<ApiDropletResponse> = await this.apisauce.get(`v1/reddit/subreddits`)

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

  async loginUser(
    username: string,
    password: string,
  ): Promise<{ kind: "ok"; token: string; expiresAt: Date } | GeneralApiProblem> {
    console.log(`username: ${username} password: ${password}`)
    const response: ApiResponse<ApiDropletResponse> = await this.apisauce.post(
      `login`, JSON.stringify({ username, password }),
      { headers: { "Content-Type": "application/json" } })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const cookie: string | undefined = response.headers?.['set-cookie']
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

  async refreshCreds(): Promise<{ kind: "ok"; token: string; expiresAt: Date } | GeneralApiProblem> {
    const response: ApiResponse<ApiDropletResponse> = await this.apisauce.post('refresh')

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    try {
      const cookie: string | undefined = response.headers?.['set-cookie']
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
    const parts = header.toString().split(';')
    const token: string = parts[0]
    const expiresAt: Date = new Date(parts[1].split("Expires=")[1])
    return { token, expiresAt }
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
