import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { api } from "../services/api"
import { withSetPropAction } from "./helpers/withSetPropAction"
import { SpotifyArtistModel } from "./Spotify"

export const SpotifyStoreModel = types
  .model("SpotifyStore")
  .props({
    artistsWithListens: types.array(SpotifyArtistModel),
  })
  .actions(withSetPropAction)
  .actions((store) => ({
    async fetchArtists(startTime: Date, endTime?: Date) {
      const response = await api.getSpotifyArtists(startTime, endTime)
      if (response.kind === "ok") {
        store.setProp("artistsWithListens", response.artists)
      } else {
        console.error(`Error fetching artists: ${JSON.stringify(response)}`)
      }
    },
  }))

export interface SpotifyStore extends Instance<typeof SpotifyStoreModel> {}
export interface SpotifyStoreSnapshot extends SnapshotOut<typeof SpotifyStoreModel> {}
