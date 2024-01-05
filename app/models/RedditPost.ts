import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree";
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
    })
    .views((post) => ({
        get createdAt(): string {
            const dt = new Date(post.created_utc * 1e3)
            return dt.toDateString()
        },
        get text(): string {
            if (post.name.startsWith("t3")) {
                return post.title
            }
            return "<saved comment>"
        }
    }))
    .actions(withSetPropAction)

export interface RedditPost extends Instance<typeof RedditPostModel> { }
export interface RedditPostSnapshotOut extends SnapshotOut<typeof RedditPostModel> { }
export interface RedditPostSnapshotIn extends SnapshotIn<typeof RedditPostModel> { }