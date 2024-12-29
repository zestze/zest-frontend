import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { api } from "../services/api"
import { MetacriticPost, MetacriticPostModel } from "./Metacritic"
import { withSetPropAction } from "./helpers/withSetPropAction"

export const MetacriticStoreModel = types
  .model("MetacriticStore")
  .props({
    posts: types.array(MetacriticPostModel),
    // want to save (ID, action) - use types reference or create a new model?
    saved: types.array(types.reference(MetacriticPostModel)),
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
      const action = "saved"
      const response = await api.saveMetacriticPosts([id], action)
      if (response.kind === "ok") {
        // save the ID in short list
        store.saved.push(id)
        // update the `reason` in main list
        // TODO: does this need to use withSetPropAction or can it be modified this way?
        const i = store.posts.findIndex((m) => m.id === id)
        if (i !== undefined) {
          store.posts[i].action = action
        }
      } else {
        console.error(`Error saving posts: ${JSON.stringify(response)}`)
      }
    },
    async fetchSavedPosts() {
      // TODO(zeke): store saved posts
      const action = "saved"
      const response = await api.getSavedMetacriticPosts(action)
      if (response.kind === "ok") {
        // update saved
        store.setProp(
          "saved",
          response.posts.map((p) => p.id),
        )
        // update the `reason` in main list, for each of these!
        // TODO: is there a smarter way to do this?
        response.posts.forEach((value) => {
          const i = store.posts.findIndex((m) => m.id === value.id)
          if (i !== undefined && value.action !== undefined) {
            store.posts[i].action = value.action
          }
        })
      } else {
        console.error(`Error fetching saved posts: ${JSON.stringify(response)}`)
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

export interface MetacriticStore extends Instance<typeof MetacriticStoreModel> {}
export interface MetacriticStoreSnapshot extends SnapshotOut<typeof MetacriticStoreModel> {}
