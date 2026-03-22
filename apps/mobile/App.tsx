import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { apiModules, designTokens } from "@health-tracker/design-tokens";

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.badge}>Mobile shell</Text>
          <Text style={styles.title}>Same product system, smaller screen.</Text>
          <Text style={styles.body}>
            This app shell shares design tokens, API access, and domain types with the web app so
            logging, chat, meals, voice notes, and goals can evolve together.
          </Text>
        </View>

        <View style={styles.grid}>
          {apiModules.map((module) => (
            <View key={module.title} style={styles.card}>
              <Text style={styles.cardTitle}>{module.title}</Text>
              <Text style={styles.cardBody}>{module.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: designTokens.colors.background,
  },
  container: {
    padding: 20,
    gap: 18,
  },
  hero: {
    padding: 20,
    borderRadius: designTokens.radius.hero,
    backgroundColor: designTokens.colors.surface,
    gap: 12,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: designTokens.colors.accentSoft,
    color: designTokens.colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    lineHeight: 34,
    color: designTokens.colors.text,
    fontWeight: "700",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: designTokens.colors.muted,
  },
  grid: {
    gap: 14,
  },
  card: {
    padding: 18,
    borderRadius: designTokens.radius.card,
    backgroundColor: designTokens.colors.surface,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: designTokens.colors.text,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 21,
    color: designTokens.colors.muted,
  },
});
