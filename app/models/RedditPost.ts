import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"

export const RedditPostModel = types
  .model("RedditPost")
  .props({
    subreddit: "",
    permalink: "",
    score: 0,
    title: "",
    name: "",
    created_utc: 0.0,
    link_title: types.maybeNull(types.string),
    body: types.maybeNull(types.string),
  })
  .views((post) => ({
    get createdAt(): string {
      const dt = new Date(post.created_utc * 1e3)
      return formatter.format(dt)
    },
    get actualTitle(): string {
      if (!isComment(post.name)) {
        return post.title
      }
      return post.link_title !== null ? post.link_title : "<saved comment>"
    },
    get isComment(): boolean {
      return isComment(post.name)
    },
  }))
  .actions(withSetPropAction)

const isComment = (name: string): boolean => name.startsWith("t1")
// see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
// for why this is in global scope
const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  day: "numeric",
})

export interface RedditPost extends Instance<typeof RedditPostModel> {}
export interface RedditPostSnapshotOut extends SnapshotOut<typeof RedditPostModel> {}
export interface RedditPostSnapshotIn extends SnapshotIn<typeof RedditPostModel> {}
