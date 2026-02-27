import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    StatusBar,
    Pressable,
    ActivityIndicator,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import LoadingScreen from '@/components/LoadingScreen';
import { parsePositiveNumber, formatDateFr } from '@/utils/validation';

export default function ParcelleEditScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const id = params.id as string | undefined;

    const [nom, setNom] = useState('');
    const [surface, setSurface] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [culture, setCulture] = useState('');
    const [periodeDebut, setPeriodeDebut] = useState('');
    const [periodeFin, setPeriodeFin] = useState('');
    const [periodeDebutValue, setPeriodeDebutValue] = useState<Date | null>(null);
    const [periodeFinValue, setPeriodeFinValue] = useState<Date | null>(null);
    const [showDebutPicker, setShowDebutPicker] = useState(false);
    const [showFinPicker, setShowFinPicker] = useState(false);

    useEffect(() => {
        const chargerParcelle = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                const ref = doc(db, 'parcelles', id);
                const snap = await getDoc(ref);

                if (snap.exists()) {
                    const data = snap.data();
                    setNom((data.nom as string) ?? '');

                    const rawSurface = data.surface;
                    if (typeof rawSurface === 'number') {
                        setSurface(rawSurface.toString().replace('.', ','));
                    } else if (typeof rawSurface === 'string') {
                        setSurface(rawSurface);
                    } else {
                        setSurface('');
                    }
                    const dataCulture = (data.culture as string) ?? '';
                    const dataPeriodeDebut = (data.periodeDebut as string) ?? '';
                    const dataPeriodeFin = (data.periodeFin as string) ?? '';

                    setCulture(dataCulture);
                    setPeriodeDebut(dataPeriodeDebut);
                    setPeriodeFin(dataPeriodeFin);
                } else {
                    alert("Cette parcelle n'existe plus.");
                    router.back();
                }
            } catch (e) {
                console.error('Erreur chargement parcelle', e);
                alert('Impossible de charger la parcelle.');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        chargerParcelle();
    }, [id]);

    const ouvrirDebutPicker = () => {
        setShowDebutPicker(true);
    };

    const ouvrirFinPicker = () => {
        setShowFinPicker(true);
    };

    const onChangeDebut = (_: any, selectedDate?: Date) => {
        if (Platform.OS !== 'ios') {
            setShowDebutPicker(false);
        }
        if (selectedDate) {
            setPeriodeDebutValue(selectedDate);
            setPeriodeDebut(formatDateFr(selectedDate));
        }
    };

    const onChangeFin = (_: any, selectedDate?: Date) => {
        if (Platform.OS !== 'ios') {
            setShowFinPicker(false);
        }
        if (selectedDate) {
            setPeriodeFinValue(selectedDate);
            setPeriodeFin(formatDateFr(selectedDate));
        }
    };

    const enregistrer = async () => {
        if (!id) return;
        if (!nom.trim()) {
            alert('Le nom de la parcelle est obligatoire.');
            return;
        }

        const parsedSurface = parsePositiveNumber(surface);
        if (parsedSurface === null) {
            alert('La surface doit être un nombre strictement supérieur à 0.');
            return;
        }

        try {
            setSaving(true);
            const ref = doc(db, 'parcelles', id);
            await updateDoc(ref, {
                nom: nom.trim(),
                surface: parsedSurface,
                culture: culture.trim(),
                periodeDebut: periodeDebut.trim(),
                periodeFin: periodeFin.trim(),
            });
            Alert.alert(
              "Succès ", 
              "La parcelle a été mise à jour avec succès.", 
              [
                {
                  text: "OK",
                  onPress: () => router.back()
                }
              ]
            );
            router.back();
        } catch (e) {
            console.error('Erreur mise à jour parcelle', e);
            alert("Impossible d'enregistrer les modifications.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingScreen message="Chargement de la parcelle..." />;
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar backgroundColor="#166534" barStyle="light-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Modifier la parcelle</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Informations de la parcelle</Text>
                        <Text style={styles.cardSubtitle}>
                            Mettez à jour le nom, la surface, la culture et la période de récolte.
                        </Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Nom de la parcelle</Text>
                        <TextInput
                            style={styles.input}
                            value={nom}
                            onChangeText={setNom}
                            placeholder="Ex : Champ Nord"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Surface (en hectares)</Text>
                        <TextInput
                            style={styles.input}
                            value={surface}
                            onChangeText={setSurface}
                            placeholder="Ex : 2.5"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Culture</Text>
                        <TextInput
                            style={styles.input}
                            value={culture}
                            onChangeText={setCulture}
                            placeholder="Ex : Blé dur"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Période de récolte</Text>
                        <View style={styles.formRowTwo}>
                            <Pressable
                                style={[styles.input, styles.inputHalf]}
                                onPress={ouvrirDebutPicker}
                            >
                                <Text
                                    style={
                                        periodeDebut ? styles.dateText : styles.datePlaceholder
                                    }
                                >
                                    {periodeDebut || 'Début (JJ/MM/AAAA)'}
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[styles.input, styles.inputHalf]}
                                onPress={ouvrirFinPicker}
                            >
                                <Text
                                    style={periodeFin ? styles.dateText : styles.datePlaceholder}
                                >
                                    {periodeFin || 'Fin (JJ/MM/AAAA)'}
                                </Text>
                            </Pressable>
                        </View>

                        {showDebutPicker && (
                            <DateTimePicker
                                value={periodeDebutValue || new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onChangeDebut}
                            />
                        )}

                        {showFinPicker && (
                            <DateTimePicker
                                value={periodeFinValue || new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onChangeFin}
                            />
                        )}
                    </View>
                </View>

                <View style={styles.actions}>
                    <Pressable
                        style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
                        onPress={enregistrer}
                        disabled={saving}
                    >
                        <Text style={styles.primaryButtonText}>
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </Text>
                    </Pressable>

                    <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
                        <Text style={styles.secondaryButtonText}>Annuler</Text>
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
    cardHeader: {
        gap: 4,
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
        gap: 6,
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
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        fontSize: 15,
        color: '#111827',
    },
    actions: {
        marginTop: 20,
        gap: 10,
    },
    primaryButton: {
        marginTop: 0,
        backgroundColor: '#166534',
        borderRadius: 999,
        paddingVertical: 14,
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
    secondaryButton: {
        marginTop: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    dateText: {
        fontSize: 15,
        color: '#111827',
    },
    datePlaceholder: {
        fontSize: 15,
        color: '#9CA3AF',
    },
    formRowTwo: {
        flexDirection: 'row',
        gap: 8,
    },
    inputHalf: {
        flex: 1,
    },
});