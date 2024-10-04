import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"

export const MetacriticPostModel = types
  .model("MetacriticPost")
  .props({
    title: "",
    href: "",
    score: 0,
    description: "",
    release_date: types.Date,
    id: types.number,
  })
  .actions(withSetPropAction)

export interface MetacriticPost extends Instance<typeof MetacriticPostModel> { }
export interface MetacriticPostSnapshotOut extends SnapshotOut<typeof MetacriticPostModel> { }
export interface MetacriticPostSnapshotIn extends SnapshotIn<typeof MetacriticPostModel> { }
