import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { Link } from 'expo-router';
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
type Parcelle = {
  id: string;
  nom: string;
  surface: number | null;
};

export default function ParcellesScreen() {
  const [nom, setNom] = useState('');
  const [surface, setSurface] = useState('');
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  useEffect(() => {
    const chargerParcelles = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.warn('Aucun utilisateur connecté, impossible de charger les parcelles.');
          return;
        }

        const parcellesRef = collection(db, 'parcelles');
        const q = query(parcellesRef, where('ownerUid', '==', user.uid));
        const snapshot = await getDocs(q);

        const liste: Parcelle[] = snapshot.docs.map((parcelleDoc) => {
          const data = parcelleDoc.data();
          const rawSurface = data.surface;

          let numericSurface: number | null = null;
          if (typeof rawSurface === 'number') {
            numericSurface = rawSurface > 0 ? rawSurface : null;
          } else if (typeof rawSurface === 'string') {
            const parsed = parseFloat(rawSurface.replace(',', '.'));
            numericSurface = !Number.isNaN(parsed) && parsed > 0 ? parsed : null;
          }

          return {
            id: parcelleDoc.id,
            nom: (data.nom as string) ?? '',
            surface: numericSurface,
          };
        });

        setParcelles(liste);
      } catch (e) {
        console.error('Erreur lors du chargement des parcelles', e);
        alert('Impossible de charger les parcelles (voir console).');
      }
    };

    chargerParcelles();
  }, []);

  const totalParcelles = parcelles.length;

  const surfaceTotale = parcelles.reduce((sum, parcelle) => {
    if (parcelle.surface == null || parcelle.surface <= 0) {
      return sum;
    }
    return sum + parcelle.surface;
  }, 0);

  const surfaceTotaleDisplay =
    surfaceTotale > 0 ? surfaceTotale.toFixed(1).replace('.', ',') : '0';
    const ajouterParcelle = async () => {
      const nomTrim = nom.trim();
      const surfaceTrim = surface.trim();
  
      if (!nomTrim) {
        alert('Le nom de la parcelle est obligatoire.');
        return;
      }
  
      const parsedSurface = parseFloat(surfaceTrim.replace(',', '.'));
      if (Number.isNaN(parsedSurface) || parsedSurface <= 0) {
        alert('La surface doit être un nombre strictement supérieur à 0.');
        return;
      }
  
      const user = auth.currentUser;
      if (!user) {
        alert('Vous devez être connecté pour ajouter une parcelle.');
        return;
      }
  
      try {
        const surfaceNumber = parsedSurface;
        const docRef = await addDoc(collection(db, 'parcelles'), {
          nom: nomTrim,
          surface: surfaceNumber,
          ownerUid: user.uid,       
          createdAt: new Date(),
        });
        const nouvelleParcelle: Parcelle = {
          id: docRef.id,
          nom: nomTrim,
          surface: surfaceNumber,
        };
        setParcelles((prev) => [...prev, nouvelleParcelle]);
        setNom('');
        setSurface('');
      } catch (e) {
        console.error('Erreur lors de l’ajout de la parcelle', e);
        alert('Impossible d’ajouter la parcelle (voir console).');
      }
    };

  const supprimerParcelle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'parcelles', id));
      setParcelles((prev) => prev.filter((parcelle) => parcelle.id !== id));
    } catch (e) {
      console.error('Erreur lors de la suppression de la parcelle', e);
      alert('Impossible de supprimer la parcelle (voir console).');
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#166534" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.appTitle}>RécolteCheck</Text>
        <Text style={styles.appSubtitle}>Suivi simple de vos parcelles</Text>
      </View>

      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Parcelles</Text>
              <Text style={styles.statValue}>{totalParcelles}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Surface totale</Text>
              <Text style={styles.statValue}>
                {surfaceTotale > 0 ? `${surfaceTotaleDisplay} ha` : '0 '}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ajouter une parcelle</Text>
            <Text style={styles.cardSubtitle}>
              Renseignez rapidement vos parcelles pour mieux suivre vos récoltes.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom de la parcelle</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : Champ Nord"
                placeholderTextColor="#9CA3AF"
                value={nom}
                onChangeText={setNom}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Surface (en hectares)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : 2.5"
                placeholderTextColor="#9CA3AF"
                value={surface}
                onChangeText={setSurface}
                keyboardType="numeric"
              />
            </View>

            <Pressable style={styles.primaryButton} onPress={ajouterParcelle}>
              <Text style={styles.primaryButtonText}>Enregistrer la parcelle</Text>
            </Pressable>
          </View>

          <View style={styles.listHeaderRow}>
  <Text style={styles.sectionTitle}>Mes parcelles</Text>
  <Text style={styles.sectionCount}>
    {parcelles.length} {parcelles.length <= 1 ? 'parcelle' : 'parcelles'}
  </Text>
</View>

{parcelles.length === 0 ? (
  <View style={styles.emptyState}>
    <Text style={styles.emptyTitle}>Aucune parcelle pour le moment</Text>
    <Text style={styles.emptyText}>
      Ajoutez votre première parcelle avec le formulaire ci-dessus.
    </Text>
  </View>
) : (
  <FlatList
    data={parcelles}
    keyExtractor={(item) => item.id}
    scrollEnabled={false}
    contentContainerStyle={{ gap: 12 }}
    renderItem={({ item }) => (
      <View style={styles.parcelleCard}>
        <View style={styles.parcelleHeaderRow}>
          <Text style={styles.parcelleName}>{item.nom}</Text>
          <Text style={styles.parcelleBadge}>
            {item.surface != null && item.surface > 0
              ? `${item.surface} ha`
              : 'Surface N/C'}
          </Text>
        </View>

        <View style={styles.parcelleFooterRow}>
          <View style={styles.parcelleActionsRow}>
            <Link
              href={{
                pathname: '/parcelle/[id]',
                params: { id: item.id, nom: item.nom, surface: item.surface },
              }}
              asChild
            >
              <Pressable style={styles.detailButton}>
                <Text style={styles.detailButtonText}>Détails</Text>
              </Pressable>
            </Link>

            <Link
              href={{
                pathname: '/parcelle/[id]/edit',
                params: { id: item.id },
              }}
              asChild
            >
              <Pressable style={styles.editButton}>
                <Text style={styles.editButtonText}>Modifier</Text>
              </Pressable>
            </Link>
          </View>

          <Pressable
            style={styles.deleteButton}
            onPress={() => supprimerParcelle(item.id)}
          >
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </Pressable>
        </View>
      </View>
    )}
  />
)}
        </ScrollView>
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
    paddingBottom: 24,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ECFDF5',
  },
  appSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#BBF7D0',
  },
  content: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  formGroup: {
    marginTop: 8,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    fontSize: 14,
    color: '#111827',
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#16A34A',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ECFDF5',
    fontSize: 15,
    fontWeight: '600',
  },
  listHeaderRow: {
    marginTop: 8,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionCount: {
    fontSize: 13,
    color: '#6B7280',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  emptyState: {
    marginTop: 12,
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#4B5563',
  },
  parcelleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: 8,
  },
  parcelleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parcelleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  parcelleBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  parcelleFooterRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parcelleMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  parcelleActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    backgroundColor: '#EFF6FF',
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#16A34A',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ECFDF5',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
  },
});