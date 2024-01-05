import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { AuthenticationStoreModel } from "./AuthenticationStore"
import { EpisodeStoreModel } from "./EpisodeStore"
import { RedditStoreModel } from "./RedditStore"
import { MetacriticStoreModel } from "./MetacriticStore"


// TODO(zeke): store metacritic and reddit models in here?
// or just use state in components?

/**
 * A RootStore model.
 */
export const RootStoreModel = types.model("RootStore").props({
  authenticationStore: types.optional(AuthenticationStoreModel, {}),
  episodeStore: types.optional(EpisodeStoreModel, {}),
  redditStore: types.optional(RedditStoreModel, {}),
  metacriticStore: types.optional(MetacriticStoreModel, {})
})

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> { }
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> { }
