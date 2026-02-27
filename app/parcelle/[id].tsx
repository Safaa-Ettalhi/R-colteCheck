import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import LoadingScreen from '@/components/LoadingScreen';

type ParcelleDetails = {
  nom: string;
  surface: string;
  culture: string;
  periodeDebut: string;
  periodeFin: string;
};

export default function ParcelleDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const id = params.id as string | undefined;

  const [details, setDetails] = useState<ParcelleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalRecoltes, setTotalRecoltes] = useState(0);
  const [totalPoids, setTotalPoids] = useState(0);

  useEffect(() => {
    const chargerDetails = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, 'parcelles', id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          Alert.alert('Parcelle', "Cette parcelle n'existe plus.");
          router.back();
          return;
        }

        const data = snap.data();
        const nom = (data.nom as string) ?? '';

        let surfaceDisplay = 'N/C';
        const rawSurface = data.surface;
        if (typeof rawSurface === 'number') {
          surfaceDisplay = rawSurface.toString();
        } else if (typeof rawSurface === 'string' && rawSurface.trim() !== '') {
          surfaceDisplay = rawSurface;
        }

        const culture = (data.culture as string) ?? '';
        const periodeDebut = (data.periodeDebut as string) ?? '';
        const periodeFin = (data.periodeFin as string) ?? '';

        setDetails({
          nom,
          surface: surfaceDisplay,
          culture,
          periodeDebut,
          periodeFin,
        });
               
        const recoltesRef = collection(db, 'recoltes');
        const q = query(recoltesRef, where('parcelleId', '==', id));
        const recoltesSnap = await getDocs(q);
        
        let total = 0;
        recoltesSnap.forEach((docSnap) => {
            const d = docSnap.data();
            const poids = typeof d.poids === 'number' ? d.poids : Number(d.poids) || 0;
            total += poids;
        });
        
        setTotalRecoltes(recoltesSnap.size);
        setTotalPoids(total);
      } catch (e) {
        console.error('Erreur chargement détails parcelle', e);
        Alert.alert(
          'Parcelle',
          'Impossible de charger les détails de la parcelle.',
        );
        router.back();
      } finally {
        setLoading(false);
      }
    };

    chargerDetails();
  }, [id]);

  if (loading) {
    return <LoadingScreen message="Chargement de la parcelle..." />;
  }

  if (!details) {
    return null;
  }
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar backgroundColor="#166534" barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Détails de la parcelle</Text>
        <Text style={styles.headerSubtitle}>
          {details.nom || 'Nom inconnu'}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {details.nom || 'Nom inconnu'}
              </Text>
              <Text style={styles.cardSubtitle}>Parcelle enregistrée dans RécolteCheck</Text>
            </View>
            <Text style={styles.surfaceBadge}>
              {details.surface ? `${details.surface} ha` : 'Surface N/C'}
            </Text>
          </View>

          {totalRecoltes > 0 ? (
            <View style={styles.recolteSummaryRow}>
              <View style={styles.recolteSummaryChip}>
                <Text style={styles.recolteSummaryLabel}>Récoltes</Text>
                <Text style={styles.recolteSummaryValue}>
                  {totalRecoltes}
                </Text>
              </View>
              <View style={styles.recolteSummaryChip}>
                <Text style={styles.recolteSummaryLabel}>Total récolté</Text>
                <Text style={styles.recolteSummaryValue}>
                  {totalPoids.toFixed(1)} kg
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.recolteSummaryEmpty}>
              Aucune récolte enregistrée pour cette parcelle.
            </Text>
          )}

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Surface</Text>
              <Text style={styles.statValue}>
                {details.surface ? `${details.surface} ha` : 'N/C'}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Culture</Text>
              <Text style={styles.statValue}>
                {details.culture && details.culture.trim() !== ''
                  ? details.culture
                  : 'Non renseignée'}
              </Text>
            </View>
          </View>

          <View style={[styles.statsRow, { marginTop: 8 }]}>
            <View style={[styles.statCard, { flex: 1 }]}>
              <Text style={styles.statLabel}>Période de récolte</Text>
              <Text style={styles.statValue}>
                {details.periodeDebut || details.periodeFin
                  ? `${details.periodeDebut || '?'} - ${details.periodeFin || '?'}`
                  : 'Non renseignée'}
              </Text>
            </View>
          </View>

          <Text style={styles.helperText}>
            Depuis cette fiche, vous pouvez consulter l&apos;historique des récoltes
            et ajuster les informations de la parcelle.
          </Text>
        </View>
        <View style={styles.actions}>
          {id && (
            <View style={styles.mainActionsRow}>
              <Link
                href={{ pathname: '/parcelle/[id]/recoltes', params: { id } }}
                asChild
              >
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Voir les récoltes</Text>
                </Pressable>
              </Link>

              <Link
                href={{ pathname: '/parcelle/[id]/edit', params: { id } }}
                asChild
              >
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Modifier</Text>
                </Pressable>
              </Link>
            </View>
          )}

          <Pressable style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>← Retour à la liste des parcelles</Text>
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
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
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
    marginTop: 10,
    marginBottom: 6,
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
  tertiaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  statValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  mainActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
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
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#166534',
    backgroundColor: '#ECFDF5',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 13,
    color: '#4B5563',
  },
  recolteSummaryRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  recolteSummaryChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recolteSummaryLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  recolteSummaryValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  recolteSummaryEmpty: {
    marginTop: 10,
    fontSize: 12,
    color: '#6B7280',
  },
});