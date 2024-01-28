import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { ActivityIndicator, ImageStyle, TextStyle, View, ViewStyle } from "react-native"
import { type ContentStyle } from "@shopify/flash-list"
import { Card, EmptyState, ListView, Screen, Text, Toggle, SelectField } from "../components"
import { isRTL } from "../i18n"
import { useStores } from "../models"
import { RedditPost } from "../models/RedditPost"
import { DemoTabScreenProps } from "../navigators/DemoNavigator"
import { colors, spacing } from "../theme"
import { delay } from "../utils/delay"
import { openLinkInBrowser } from "../utils/openLinkInBrowser"

// const ICON_SIZE = 14

export const RedditScreen: FC<DemoTabScreenProps<"Reddit">> = observer((_props) => {
  const {
    authenticationStore: { authWillExpire, refresh },
    redditStore,
  } = useStores()

  const [refreshing, setRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sortByScore, setSortByScore] = useState(false)
  const [selectedSubreddit, setSelectedSubreddit] = useState<string[]>([])

  useEffect(() => {
    if (authWillExpire) refresh()
  }, [authWillExpire])

  const postsForDisplay = redditStore.postsForDisplay(sortByScore)

  const subreddits = redditStore
    .subredditsForDisplay()
    .map((sub: string) => ({ label: sub, value: sub }))

  // initially, kick off a background refresh without the refreshing UI
  useEffect(() => {
    ;(async function load() {
      setIsLoading(true)
      // await episodeStore.fetchEpisodes()
      await Promise.all([
        redditStore.fetchSubreddits(),
        redditStore.fetchPosts(selectedSubreddit.length > 0 ? selectedSubreddit[0] : undefined),
      ])
      setIsLoading(false)
    })()
  }, [redditStore, JSON.stringify(selectedSubreddit)])

  // simulate a longer refresh, if the refresh is too fast for UX
  async function manualRefresh() {
    setRefreshing(true)
    // await Promise.all([episodeStore.fetchEpisodes(), redditStore.fetchPosts(), delay(750)])
    await Promise.all([
      redditStore.fetchSubreddits(),
      redditStore.fetchPosts(selectedSubreddit.length > 0 ? selectedSubreddit[0] : undefined),
      delay(750),
    ])
    setRefreshing(false)
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={$screenContentContainer}>
      <ListView<RedditPost>
        contentContainerStyle={$listContentContainer}
        data={postsForDisplay}
        refreshing={refreshing}
        estimatedItemSize={177}
        onRefresh={manualRefresh}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator />
          ) : (
            <EmptyState
              preset="generic"
              style={$emptyState}
              buttonOnPress={manualRefresh}
              imageStyle={$emptyStateImage}
              ImageProps={{ resizeMode: "contain" }}
            />
          )
        }
        ListHeaderComponent={
          <View style={$heading}>
            <Text preset="heading" text="Reddit" />
            <View style={$toggle}>
              <SelectField
                label="Subreddits"
                helper="Select your subreddit(s)"
                placeholder="e.g. Tokyo"
                value={selectedSubreddit}
                onSelect={setSelectedSubreddit}
                options={subreddits}
                multiple={false}
                containerStyle={{ marginBottom: spacing.md }}
                style={$toggle}
              />
            </View>
            <View style={$toggle}>
              <Toggle
                value={sortByScore}
                onValueChange={() => setSortByScore(!sortByScore)}
                variant="switch"
                label="sort by score"
                labelPosition="left"
                labelStyle={$labelStyle}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => <RedditPostCard post={item} />}
      />
    </Screen>
  )
})

const RedditPostCard = observer(({ post }: { post: RedditPost }) => {
  const handlePressCard = async () => {
    const url = `https://www.reddit.com${post.permalink}`
    openLinkInBrowser(url)
  }

  return (
    <Card
      style={$item}
      verticalAlignment="force-footer-bottom"
      onPress={handlePressCard}
      HeadingComponent={
        <View style={$metadata}>
          <Text style={$metadataText} size="xxs">
            {post.subreddit}
          </Text>
          <Text style={$metadataText} size="xxs">
            {post.score}
          </Text>
          <Text style={$metadataText} size="xxs">
            {post.createdAt}
          </Text>
        </View>
      }
      content={post.text}
    ></Card>
  )
})

// #region Styles
const $screenContentContainer: ViewStyle = {
  flex: 1,
}

const $listContentContainer: ContentStyle = {
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg + spacing.xl,
  paddingBottom: spacing.lg,
}

const $heading: ViewStyle = {
  marginBottom: spacing.md,
}

const $item: ViewStyle = {
  padding: spacing.md,
  marginTop: spacing.md,
  minHeight: 120,
}

/*
const $itemThumbnail: ImageStyle = {
  marginTop: spacing.sm,
  borderRadius: 50,
  alignSelf: "flex-start",
}
*/

const $toggle: ViewStyle = {
  marginTop: spacing.md,
}

const $labelStyle: TextStyle = {
  textAlign: "left",
}

/*
const $iconContainer: ViewStyle = {
  height: ICON_SIZE,
  width: ICON_SIZE,
  flexDirection: "row",
  marginEnd: spacing.sm,
}
*/

const $metadata: TextStyle = {
  color: colors.textDim,
  marginTop: spacing.xs,
  flexDirection: "row",
}

const $metadataText: TextStyle = {
  color: colors.textDim,
  marginEnd: spacing.md,
  marginBottom: spacing.xs,
}

/*
const $favoriteButton: ViewStyle = {
  borderRadius: 17,
  marginTop: spacing.md,
  justifyContent: "flex-start",
  backgroundColor: colors.palette.neutral300,
  borderColor: colors.palette.neutral300,
  paddingHorizontal: spacing.md,
  paddingTop: spacing.xxxs,
  paddingBottom: 0,
  minHeight: 32,
  alignSelf: "flex-start",
}

const $unFavoriteButton: ViewStyle = {
  borderColor: colors.palette.primary100,
  backgroundColor: colors.palette.primary100,
}
*/

const $emptyState: ViewStyle = {
  marginTop: spacing.xxl,
}

const $emptyStateImage: ImageStyle = {
  transform: [{ scaleX: isRTL ? -1 : 1 }],
}
// #endregion
