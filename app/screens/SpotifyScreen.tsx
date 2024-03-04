import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useState } from "react"
import { ActivityIndicator, ViewStyle, ImageStyle, TextStyle, View } from "react-native"
import { DemoTabScreenProps } from "../navigators/DemoNavigator"
import { Card, EmptyState, ListView, Text, SelectField, Screen } from "app/components"
import { useStores } from "app/models"
import { colors, spacing } from "../theme"
import { SpotifyArtist } from "app/models/Spotify"
import { delay } from "../utils/delay"
import { isRTL } from "app/i18n"

export const SpotifyScreen: FC<DemoTabScreenProps<"Spotify">> = observer((_props) => {
  const {
    authenticationStore: { authWillExpire, refresh },
    spotifyStore,
  } = useStores()

  // TODO(zeke): need to also store if generating per-week, or per-month, etc.
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [period, setPeriod] = useState<Period>(Period.daily)

  useEffect(() => {
    if (authWillExpire) refresh()
  }, [authWillExpire])

  useEffect(() => {
    ;(async function load() {
      setIsLoading(true)
      await spotifyStore.fetchArtists(periodAgo(period))
      setIsLoading(false)
    })()
  }, [spotifyStore, period])

  async function manualRefresh() {
    setRefreshing(true)
    await Promise.all([delay(750), spotifyStore.fetchArtists(periodAgo(period))])
    setRefreshing(false)
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={$screenContentContainer}>
      <ListView<SpotifyArtist>
        contentContainerStyle={$listContentContainer}
        data={spotifyStore.artistsSorted()}
        refreshing={refreshing}
        onRefresh={manualRefresh}
        estimatedItemSize={50}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator />
          ) : (
            <EmptyState
              preset="generic"
              style={$emptyState}
              imageStyle={$emptyStateImage}
              ImageProps={{ resizeMode: "contain" }}
            />
          )
        }
        ListHeaderComponent={
          <View style={$heading}>
            <Text preset="heading" text="Spotify Artists" />
            <View style={$toggle}>
              <SelectField
                label="Period"
                helper="Select aggregation period"
                placeholder="e.g. weekly"
                value={[period]}
                onSelect={(updated: string[]) => setPeriod(periodFrom(updated[0]) || Period.daily)}
                options={periods.map((p) => ({
                  label: p,
                  value: p,
                }))}
                multiple={false}
                containerStyle={{ marginBottom: spacing.md }}
                style={$toggle}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => <SpotifyArtistCard artist={item} />}
      ></ListView>
    </Screen>
  )
})

const SpotifyArtistCard = observer(({ artist }: { artist: SpotifyArtist }) => {
  return (
    <Card
      style={$item}
      verticalAlignment="force-footer-bottom"
      HeadingComponent={
        <View style={$metadata}>
          <Text style={$metadataText} size="xxs">
            {artist.plays}
          </Text>
        </View>
      }
      content={artist.name}
    />
  )
})

enum Period {
  daily = "daily",
  weekly = "weekly",
  monthly = "monthly",
}

const periods = [Period.daily, Period.weekly, Period.monthly]

const periodFrom = (s: string): Period | undefined => {
  return Period[s as keyof typeof Period]
}

const periodAgo = (p: Period): Date => {
  const now = new Date()
  let numDays = 0
  switch (p) {
    case Period.daily:
      numDays = 1
      break
    case Period.weekly:
      numDays = 7
      break
    case Period.monthly:
      numDays = 30
      break
  }
  return new Date(now.setDate(now.getDate() - numDays))
}

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

const $toggle: ViewStyle = {
  marginTop: spacing.md,
}

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

const $emptyState: ViewStyle = {
  marginTop: spacing.xxl,
}

const $emptyStateImage: ImageStyle = {
  transform: [{ scaleX: isRTL ? -1 : 1 }],
}

// #endregion
