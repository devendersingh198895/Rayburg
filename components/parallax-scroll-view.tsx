import { ThemedView } from "@/components/themed-view";
import React, { PropsWithChildren, ReactElement } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

const HEADER_HEIGHT = 250;

// This defines the types for your props
type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  return (
    <ScrollView style={{ flex: 1 }} scrollEventThrottle={16}>
      <View
        style={[
          styles.header,
          { backgroundColor: headerBackgroundColor.light },
        ]}
      >
        {headerImage}
      </View>
      <ThemedView style={styles.content}>{children}</ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: "hidden",
  },
});
