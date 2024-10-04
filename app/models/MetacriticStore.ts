import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { api } from "../services/api"
import { MetacriticPost, MetacriticPostModel } from "./Metacritic"
import { withSetPropAction } from "./helpers/withSetPropAction"

export const MetacriticStoreModel = types
  .model("MetacriticStore")
  .props({
    posts: types.array(MetacriticPostModel),
  })
  .actions(withSetPropAction)
  .actions((store) => ({
    async fetchPosts(medium: string, minYear: number, maxYear: number) {
      const response = await api.getMetacriticPosts(medium, minYear, maxYear)
      if (response.kind === "ok") {
        store.setProp("posts", response.posts)
      } else {
        console.error(`Error fetching posts: ${JSON.stringify(response)}`)
      }
    },
    async savePost(id: number) {
      const response = await api.saveMetacriticPosts([id]);
      if (response.kind === "ok") {
        // TODO(zeke): save posts!
      } else {
        console.error(`Error saving posts: ${JSON.stringify(response)}`);
      }
    },
  }))
  .views((store) => ({
    postsForDisplay(sortByScore = false): MetacriticPost[] {
      const posts = store.posts.slice()
      if (!sortByScore) {
        return posts
      }
      return posts.sort((a: MetacriticPost, b: MetacriticPost) => b.score - a.score)
    },
  }))

export interface MetacriticStore extends Instance<typeof MetacriticStoreModel> { }
export interface MetacriticStoreSnapshot extends SnapshotOut<typeof MetacriticStoreModel> { }
