import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';

export default function ParcelleDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const id = params.id as string | undefined;
  const nom = params.nom as string | undefined;
  const surface = params.surface as string | undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#166534" barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Détails de la parcelle</Text>
        <Text style={styles.headerSubtitle}>{nom ?? 'Nom inconnu'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{nom ?? 'Nom inconnu'}</Text>
            <Text style={styles.surfaceBadge}>
              {surface ? `${surface} ha` : 'Surface N/C'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.block}>
            <Text style={styles.label}>Nom de la parcelle</Text>
            <Text style={styles.value}>{nom ?? 'Nom inconnu'}</Text>
          </View>

          <View style={styles.block}>
            <Text style={styles.label}>Surface (ha)</Text>
            <Text style={styles.value}>{surface ?? 'N/C'}</Text>
          </View>

          <Text style={styles.helperText}>
            Ces informations vous permettent de suivre facilement vos surfaces pour la
            préparation de vos récoltes.
          </Text>
        </View>

        <View style={styles.actions}>
          {id && (
            <Link
              href={{ pathname: '/parcelle/[id]/edit', params: { id } }}
              asChild
            >
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Modifier cette parcelle</Text>
              </Pressable>
            </Link>
          )}

          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Retour à la liste</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const STATUS_BAR_HEIGHT = StatusBar.currentHeight ?? 0;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#166534',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT + 12,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 15,
    color: '#BBF7D0',
  },
  content: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
    marginRight: 12,
  },
  surfaceBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  block: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  value: {
    fontSize: 16,
    color: '#111827',
  },
  helperText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  actions: {
    marginTop: 24,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#166534',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ECFDF5',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});