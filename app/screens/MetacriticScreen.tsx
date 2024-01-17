import React, { FC, useEffect, useState } from "react"
import { DemoTabScreenProps } from "../navigators/DemoNavigator"
import { observer } from "mobx-react-lite"
import { Card, EmptyState, ListView, Screen, SelectField, Text, Toggle } from "../components"
import { MetacriticPost } from "../models/Metacritic"
import { openLinkInBrowser } from "app/utils/openLinkInBrowser"
import {
  ActivityIndicator,
  Alert,
  ImageStyle,
  Modal,
  Pressable,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { type ContentStyle } from "@shopify/flash-list"
import { colors, spacing } from "../theme"
import { useStores } from "../models"
import { delay } from "../utils/delay"
import { isRTL } from "app/i18n"

const minYear = 1990
const defaultStartYear = 2022
const maxYear = 2024
const defaultEndYear: number = maxYear

export const MetacriticScreen: FC<DemoTabScreenProps<"Metacritic">> = observer((_props) => {
  const { authenticationStore: { authWillExpire, refresh }, metacriticStore } = useStores()

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const [medium, setMedium] = useState<string>("switch")
  const [startYear, setStartYear] = useState<number>(defaultStartYear)
  const [endYear, setEndYear] = useState<number>(defaultEndYear)

  const [sortByDate, setSortByDate] = useState<boolean>(false)

  useEffect(() => {
    if (authWillExpire) refresh()
  }, [authWillExpire])

  useEffect(() => {
    // TODO(zeke): grey out options instead!
    if (startYear > endYear) {
      Alert.alert("invalid year parameters; overwriting with defaults")
      setStartYear(defaultStartYear)
      setEndYear(defaultEndYear)
      return
    }
    ; (async function load() {
      setIsLoading(true)
      await metacriticStore.fetchPosts(medium, startYear, endYear)
      setIsLoading(false)
    })()
  }, [metacriticStore, medium, startYear, endYear])

  async function manualRefresh() {
    setRefreshing(true)
    await Promise.all([metacriticStore.fetchPosts(medium, startYear, endYear), delay(750)])
    setRefreshing(false)
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={$screenContentContainer}>
      <ListView<MetacriticPost>
        contentContainerStyle={$listContentContainer}
        data={metacriticStore.postsForDisplay(sortByDate)}
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
            <Text preset="heading" text="Metacritic" />
            <SelectHeader
              label="Medium"
              helper="Select your medium"
              placeholder="e.g. switch"
              value={medium}
              setter={setMedium}
              options={mediums}
              spacing={spacing.xs}
            />
            <SelectHeader
              label="Start Year"
              helper="Select your start year"
              placeholder="e.g. 2021"
              value={startYear}
              setter={setStartYear}
              options={years}
              spacing={spacing.xs}
            />
            <SelectHeader
              label="End Year"
              helper="Select your end year"
              placeholder="e.g. 2024"
              value={endYear}
              setter={setEndYear}
              options={years}
              spacing={spacing.md}
            />
            <View style={$toggle}>
              <Toggle
                value={sortByDate}
                onValueChange={() => setSortByDate(!sortByDate)}
                variant="switch"
                label="sort by date"
                labelPosition="left"
                labelStyle={$labelStyle}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => <MetacriticPostCard post={item} />}
      />
    </Screen>
  )
})

const mediums = ["switch", "tv", "pc", "movie"].map((s: string) => ({ label: s, value: s }))

const range = (start: number, end: number) =>
  Array.from({ length: end - start }, (v, k) => k + start)

const years = range(minYear, maxYear + 1).map((y: number) => ({
  label: y.toString(),
  value: y.toString(),
}))

const MetacriticPostCard = observer(({ post }: { post: MetacriticPost }) => {
  const handlePressCard = () => {
    openLinkInBrowser(`https://www.metacritic.com${post.href}`)
  }

  const [modalVisible, setModalVisible] = useState<boolean>(false)

  // <Pressable/> needs style={{ flex: 1 }}
  //  so that it can extend the full size of the modal
  //  it capturees all touches, excluding those of children
  //  (such as the <Card/>)

  return (
    <>
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable onPress={() => setModalVisible(false)} style={{ flex: 1 }}>
          <Card
            style={$item}
            onPress={handlePressCard}
            content={post.description}
            HeadingComponent={
              <View style={{ marginBottom: spacing.md }}>
                <Text weight="semiBold" size="md">
                  {post.title}
                </Text>
              </View>
            }
          />
        </Pressable>
      </Modal>
      <Card
        style={$item}
        verticalAlignment="force-footer-bottom"
        onPress={() => setModalVisible(true)}
        onLongPress={handlePressCard}
        HeadingComponent={
          <View style={$metadata}>
            <Text style={$metadataText} size="xxs">
              {post.score}
            </Text>
            <Text style={$metadataText} size="xxs">
              {post.release_date.toDateString()}
            </Text>
          </View>
        }
        content={post.title}
      />
    </>
  )
})

type Setter<T> = React.Dispatch<React.SetStateAction<T>>

interface SelectHeaderProps {
  label: string
  helper: string
  placeholder: string
  value: string | number
  setter: Setter<string> | Setter<number>
  options: { label: string; value: string }[]
  spacing: number
}

const SelectHeader = observer((props: SelectHeaderProps) => {
  const { label, helper, placeholder, value, setter, options, spacing } = props
  const handleSelect =
    typeof value === "number"
      ? (newValue: string[]) => (setter as Setter<number>)(parseInt(newValue[0]))
      : (newValue: string[]) => (setter as Setter<string>)(newValue[0])

  return (
    <View style={$toggle}>
      <SelectField
        label={label}
        helper={helper}
        placeholder={placeholder}
        value={[`${value}`]}
        onSelect={handleSelect}
        options={options}
        multiple={false}
        containerStyle={{ marginBottom: spacing }}
        style={$toggle}
      />
    </View>
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

const $toggle: ViewStyle = {
  marginTop: spacing.md,
}

const $labelStyle: TextStyle = {
  textAlign: "left",
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
