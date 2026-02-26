import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  Pressable,
  FlatList,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db, auth } from '../../../firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from 'firebase/firestore';

type Recolte = {
  id: string;
  date: string;
  zone: string;
  poids: number;
  remarques: string;
};

export default function RecoltesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [date, setDate] = useState('');
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [zone, setZone] = useState('');
  const [poids, setPoids] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [remarques, setRemarques] = useState('');
  const [recoltes, setRecoltes] = useState<Recolte[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    const chargerRecoltes = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'recoltes'),
          where('parcelleId', '==', id),
          where('ownerUid', '==', user.uid)
        );
        const snap = await getDocs(q);
        const liste: Recolte[] = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            date: d.date ?? '',
            zone: d.zone ?? '',
            poids: typeof d.poids === 'number' ? d.poids : Number(d.poids) || 0,
            remarques: d.remarques ?? '',
          };
        });
        setRecoltes(liste);
      } catch (e) {
        console.warn('Erreur chargement récoltes', e);
      } finally {
        setLoading(false);
      }
    };
    chargerRecoltes();
  }, [id]);

  const ouvrirDatePicker = () => {
    setShowDatePicker(true);
  };

  const onChangeDate = (_: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateValue(selectedDate);
      const d = selectedDate;
      const formatted = `${String(d.getDate()).padStart(2, '0')}/${String(
        d.getMonth() + 1,
      ).padStart(2, '0')}/${d.getFullYear()}`;
      setDate(formatted);
    }
  };
  const ajouterRecolte = async () => {
    if (!date.trim()) {
      alert('La date est obligatoire.');
      return;
    }

    const poidsTrim = poids.trim();
    const parsedPoids = parseFloat(poidsTrim.replace(',', '.'));
    if (Number.isNaN(parsedPoids) || parsedPoids <= 0) {
      alert('Le poids doit être un nombre strictement supérieur à 0.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert('Vous devez être connecté pour enregistrer une récolte.');
      return;
    }

    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'recoltes'), {
        parcelleId: id,
        ownerUid: user.uid,
        date: date.trim(),
        zone: zone.trim(),
        poids: parsedPoids,
        remarques: remarques.trim(),
      });
      const nouvelle: Recolte = {
        id: docRef.id,
        date: date.trim(),
        zone: zone.trim(),
        poids: parsedPoids,
        remarques: remarques.trim(),
      };
      setRecoltes((prev) => [...prev, nouvelle]);
      setDate('');
      setDateValue(null);
      setZone('');
      setPoids('');
      setRemarques('');
    } catch (e) {
      console.warn(e);
      alert('Erreur lors de l\'enregistrement. Réessayez.');
    } finally {
      setSaving(false);
    }
  };
  const totalPoids = recoltes.reduce((sum, r) => sum + r.poids, 0);
  
  const supprimerRecolte = async (recolteId: string) => {
    const user = auth.currentUser;
    if (!user) {
      alert('Vous devez être connecté pour supprimer une récolte.');
      return;
    }

    try {
      await deleteDoc(doc(db, 'recoltes', recolteId));
      setRecoltes((prev) => prev.filter((r) => r.id !== recolteId));
    } catch (e) {
      console.warn(e);
      alert('Erreur lors de la suppression. Réessayez.');
    }
  };
  const confirmerSuppressionRecolte = (recolteId: string) => {
    Alert.alert(
      'Supprimer la récolte',
      'Es-tu sûr de vouloir supprimer cette récolte ? Cette action est définitive.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => supprimerRecolte(recolteId),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#166534" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Récoltes de la parcelle</Text>
        <Text style={styles.subtitle}>ID : {id}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ajouter une récolte</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date</Text>
            <Pressable style={styles.input} onPress={ouvrirDatePicker}>
              <Text style={date ? styles.dateText : styles.datePlaceholder}>
                {date || 'JJ/MM/AAAA'}
              </Text>
            </Pressable>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dateValue || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeDate}
              maximumDate={new Date()}
            />
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Zone </Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Zone Nord"
              placeholderTextColor="#9CA3AF"
              value={zone}
              onChangeText={setZone}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Poids (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : 1200"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={poids}
              onChangeText={setPoids}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Remarques</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="Notes libres"
              placeholderTextColor="#9CA3AF"
              multiline
              value={remarques}
              onChangeText={setRemarques}
            />
          </View>

          <Pressable
            style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
            onPress={ajouterRecolte}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ECFDF5" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Enregistrer la récolte</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.card, { marginTop: 16, flex: 1 }]}>
          <View style={styles.historyHeaderRow}>
            <Text style={styles.cardTitle}>Historique des récoltes</Text>
            <Text style={styles.totalText}>{totalPoids.toFixed(1)} kg</Text>
          </View>
          <Text style={styles.historySubtitle}>
            Liste des récoltes saisies pour cette parcelle.
          </Text>

          {loading ? (
            <View style={styles.historyEmpty}>
              <ActivityIndicator size="large" color="#166534" />
              <Text style={[styles.historyEmptyText, { marginTop: 8 }]}>
                Chargement des récoltes…
              </Text>
            </View>
          ) : recoltes.length === 0 ? (
            <View style={styles.historyEmpty}>
              <Text style={styles.historyEmptyTitle}>Aucune récolte enregistrée</Text>
              <Text style={styles.historyEmptyText}>
                Ajoutez une première récolte avec le formulaire ci-dessus.
              </Text>
            </View>
          ) : (
            <FlatList
              data={recoltes}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 8, paddingTop: 8 }}
              renderItem={({ item }) => (
                <View style={styles.recolteItem}>
                  <View style={styles.recolteHeaderRow}>
                    <Text style={styles.recolteDate}>{item.date}</Text>
                    <View style={styles.recolteHeaderRight}>
                      <Text style={styles.recoltePoids}>
                        {item.poids.toFixed(1)} kg
                      </Text>
                      <Pressable
                        onPress={() => confirmerSuppressionRecolte(item.id)}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteButtonText}>Supprimer</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.recolteChipsRow}>
                    {item.zone ? (
                      <View style={styles.recolteChip}>
                        <Text style={styles.recolteChipLabel}>Zone : </Text>
                        <Text style={styles.recolteChipText}>{item.zone}</Text>
                      </View>
                    ) : null}

                    {item.remarques ? (
                      <View style={styles.recolteChipSecondary}>
                        <Text style={styles.recolteChipLabel}>Remarque : </Text>
                        <Text style={styles.recolteChipSecondaryText}>
                          {item.remarques}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              )}
            />
          )}
        </View>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour à la parcelle</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#166534',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#BBF7D0',
  },
  content: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  formGroup: {
    marginTop: 6,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    fontSize: 14,
    color: '#111827',
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: '#166534',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ECFDF5',
    fontSize: 15,
    fontWeight: '600',
  },
  recolteInfo: {
    fontSize: 13,
    color: '#374151',
  },
  backButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 14,
    color: '#111827',
  },
  datePlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historySubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  historyEmpty: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyEmptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  historyEmptyText: {
    fontSize: 12,
    color: '#4B5563',
  },
  totalText: {
    marginTop: 0,
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  recolteItem: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 2,
  },
  recolteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recolteDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  recoltePoids: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  recolteZone: {
    fontSize: 12,
    color: '#374151',
  },
  recolteNotes: {
    fontSize: 12,
    color: '#6B7280',
  },
  recolteChipsRow: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recolteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E5F3FF',
  },
  recolteChipSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  recolteChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  recolteChipText: {
    fontSize: 12,
    color: '#1D4ED8',
  },
  recolteChipSecondaryText: {
    fontSize: 12,
    color: '#4B5563',
  },
  recolteHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B91C1C',
  },
});