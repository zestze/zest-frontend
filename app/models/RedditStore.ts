import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { api } from "../services/api"
import { RedditPost, RedditPostModel } from "./RedditPost"
import { withSetPropAction } from "./helpers/withSetPropAction"

export const RedditStoreModel = types
  .model("RedditStore")
  .props({
    posts: types.array(RedditPostModel),
    subreddits: types.array(types.string),
  })
  .actions(withSetPropAction)
  .actions((store) => ({
    async fetchPosts(subreddit?: string) {
      const response = await api.getRedditPosts(subreddit)
      if (response.kind === "ok") {
        store.setProp("posts", response.posts)
      } else {
        console.error(`Error fetching posts: ${JSON.stringify(response)}`)
      }
    },

    async fetchSubreddits() {
      const response = await api.getSubreddits()
      if (response.kind === "ok") {
        store.setProp("subreddits", response.subreddits)
      } else {
        console.error(`Error fetching subreddits: ${JSON.stringify(response)}`)
      }
    },
  }))
  .views((store) => ({
    postsForDisplay(sortByScore: boolean): RedditPost[] {
      return store.posts
        .slice()
        .sort(
          sortByScore
            ? (a: RedditPost, b: RedditPost) => b.score - a.score
            : (a: RedditPost, b: RedditPost) => b.created_utc - a.created_utc,
        )
    },

    subredditsForDisplay(): string[] {
      return store.subreddits.slice().sort((a: string, b: string) => {
        const upperA = a.toUpperCase()
        const upperB = b.toUpperCase()
        if (upperA < upperB) {
          return -1
        } else if (upperA > upperB) {
          return 1
        }
        return 0
      })
    },
  }))

export interface RedditStore extends Instance<typeof RedditStoreModel> {}
export interface RedditStoreSnapshot extends SnapshotOut<typeof RedditStoreModel> {}
