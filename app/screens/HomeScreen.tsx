import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { spacing } from "../theme"
import { Screen, Text } from "../components"
import { DemoTabScreenProps } from "../navigators/DemoNavigator"

export const HomeScreen: FC<DemoTabScreenProps<"Home">> = observer((_props) => {
  return (
    <Screen preset="scroll" contentContainerStyle={$container} safeAreaEdges={["top"]}>
      <Text preset="heading" text={"Welcome"} style={$title} />
      <Text style={$description}>Zeke's saved reddit posts and (better) metacritic await.</Text>
      <Text style={$description}>
        Visit the <Text preset="bold">Metacritic</Text> tab to view metacritic with an improved UX.
        No more wack year scrolling.
      </Text>
      <Text style={$description}>
        Visit the <Text preset="bold">Reddit</Text> tab to view Zeke's saved reddit posts with
        subreddit filtering and date/popularity sorting.
      </Text>
    </Screen>
  )
})

const $container: ViewStyle = {
  paddingTop: spacing.lg + spacing.xl,
  paddingHorizontal: spacing.lg,
}

const $title: TextStyle = {
  marginBottom: spacing.sm,
}

const $description: TextStyle = {
  marginBottom: spacing.lg,
}
