import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { api } from "app/services/api"
import { withSetPropAction } from "./helpers/withSetPropAction"

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    authToken: types.maybe(types.string),
    authEmail: "",
    expiresAt: types.maybe(types.Date),
  })
  .views((store) => ({
    get isAuthenticated() {
      const now = new Date()
      return !!store.authToken && (store.expiresAt !== undefined && now < store.expiresAt)
    },
    get validationError() {
      if (store.authEmail.length === 0) return "can't be blank"
      // if (store.authEmail.length < 6) return "must be at least 6 characters"
      // if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.authEmail))
      //  return "must be a valid email address"
      return ""
    },
    get authWillExpire() {
      const now = new Date()
      const fiveMinutes = 5 * 60 * 1000;
      return store.expiresAt !== undefined && (now.getTime() - store.expiresAt.getTime() < fiveMinutes)
    }
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    setAuthToken(value?: string) {
      store.authToken = value
    },
    setAuthEmail(value: string) {
      store.authEmail = value.replace(/ /g, "")
    },
    setExpiresAt(value: Date) {
      store.expiresAt = value
    },
    logout() {
      store.authToken = undefined
      store.authEmail = ""
    },
    // see https://ignitecookbook.com/docs/recipes/DistributingAuthTokenToAPI/
    distributeAuthToken(value?: string) {
      // optionally grab the store's authToken if not passing a value
      const token = value || store.authToken
      if (token !== undefined) {
        api.apisauce.setHeader("Cookie", token)
      }
    },
    async refresh() {
      api.refreshCreds().then(
        (value) => {
          if (value.kind === "ok") {
            const { token, expiresAt } = value
            store.setProp("authToken", token)
            store.setProp("expiresAt", expiresAt)
            api.apisauce.setHeader("Cookie", token)
          } else {
            console.error(`Error refreshing creds: ${JSON.stringify(value)}`)
          }
        }
      )
    }
  }))

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> { }
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> { }
