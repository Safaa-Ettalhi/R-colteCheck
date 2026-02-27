import React, { useState } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Link ,useRouter} from 'expo-router';
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();
  const [nomComplet, setNomComplet] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateNaissanceDate, setDateNaissanceDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const ouvrirDatePicker = () => {
    setShowDatePicker(true);
  };

  const onChangeDateNaissance = (_: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setDateNaissanceDate(selectedDate);
      const d = selectedDate;
      const formatted = `${String(d.getDate()).padStart(2, '0')}/${String(
        d.getMonth() + 1,
      ).padStart(2, '0')}/${d.getFullYear()}`;
      setDateNaissance(formatted);
    }
  };
  const handleRegister = async () => {
    if (!nomComplet.trim() || !dateNaissance.trim() || !email.trim() || !motDePasse.trim()) {
      Alert.alert(
        'Création de compte',
        'Nom complet, date de naissance, email et mot de passe sont obligatoires.',
      );
      return;
    }

    if (motDePasse.length < 6) {
      Alert.alert(
        'Création de compte',
        'Le mot de passe doit contenir au moins 6 caractères.',
      );
      return;
    }

    if (motDePasse !== confirmationMotDePasse) {
      Alert.alert(
        'Création de compte',
        'La confirmation du mot de passe ne correspond pas.',
      );
      return;
    }

    try {
      setLoading(true);
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        motDePasse.trim()
      );

      const user = userCred.user;
      await setDoc(doc(db, 'users', user.uid), {
        fullName: nomComplet.trim(),
        birthDate: dateNaissance.trim(),
        email: email.trim(),
        createdAt: new Date(),
      });

      setNomComplet('');
      setDateNaissance('');
      setEmail('');
      setMotDePasse('');
      setConfirmationMotDePasse('');

      router.push('/(tabs)');
    } catch (e: any) {
      console.error('Erreur Register', e);

      if (e?.code === 'auth/email-already-in-use') {
        Alert.alert(
          'Création de compte',
          'Cet email est déjà utilisé. Utilise un autre email ou connecte-toi.',
        );
      } else if (e?.code === 'auth/network-request-failed') {
        Alert.alert(
          'Création de compte',
          'Problème de connexion internet. Vérifie ta connexion et réessaie.',
        );
      } else {
        Alert.alert('Création de compte', e?.message ?? 'Erreur lors de la création du compte');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar backgroundColor="#166534" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.appTitle}>RécolteCheck</Text>
        <Text style={styles.appSubtitle}>Créez votre compte agriculteur</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Créer un compte</Text>
          <Text style={styles.cardSubtitle}>
            Vos parcelles et récoltes seront sauvegardées dans le cloud.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Ahmed Ben Ali"
              placeholderTextColor="#9CA3AF"
              value={nomComplet}
              onChangeText={setNomComplet}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date de naissance</Text>
            <Pressable style={styles.input} onPress={ouvrirDatePicker}>
              <Text style={dateNaissance ? styles.dateText : styles.datePlaceholder}>
                {dateNaissance || 'JJ/MM/AAAA'}
              </Text>
            </Pressable>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dateNaissanceDate || new Date(1990, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeDateNaissance}
              maximumDate={new Date()} // pas de date dans le futur
            />
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="vous@exemple.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={motDePasse}
                onChangeText={setMotDePasse}
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={confirmationMotDePasse}
                onChangeText={setConfirmationMotDePasse}
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ECFDF5" />
            ) : (
              <Text style={styles.primaryButtonText}>Créer le compte</Text>
            )}
          </Pressable>

          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.switchMode}>
              <Text style={styles.switchModeText}>Déjà un compte ? Se connecter</Text>
            </Pressable>
          </Link>
        </View>
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
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  appSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#BBF7D0',
  },
  content: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 14,
  },
  cardTitle: {
    fontSize: 20,
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
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    fontSize: 14,
    color: '#111827',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  passwordToggle: {
    marginLeft: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#111827',
  },
  datePlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  primaryButton: {
    marginTop: 14,
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
  switchMode: {
    marginTop: 10,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 13,
    color: '#374151',
  },
});