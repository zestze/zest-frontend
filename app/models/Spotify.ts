import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"

export const SpotifyArtistModel = types
  .model("SpotifyArtist")
  .props({
    name: types.identifier, // string key used in map to uniquely identify
    plays: types.number,
  })
  .actions(withSetPropAction)

export interface SpotifyArtist extends Instance<typeof SpotifyArtistModel> {}
export interface SpotifyArtistSnapshotOut extends SnapshotOut<typeof SpotifyArtistModel> {}
export interface SpotifyArtistSnapshotIn extends SnapshotIn<typeof SpotifyArtistModel> {}
