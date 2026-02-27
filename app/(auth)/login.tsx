import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link ,useRouter } from 'expo-router';
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !motDePasse.trim()) {
      Alert.alert('Connexion', 'Email et mot de passe sont obligatoires.');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), motDePasse.trim());
      setEmail('');
      setMotDePasse('');
      router.replace('/(tabs)');
    } catch (e: any) {
      console.error('Erreur Auth', e);
      if (e?.code === 'auth/invalid-credential') {
        Alert.alert('Connexion', 'Email ou mot de passe incorrect.');
      } else {
        Alert.alert('Connexion', e?.message ?? "Erreur d'authentification");
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
        <Text style={styles.appSubtitle}>Connectez-vous pour gérer vos parcelles</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>
          <Text style={styles.cardSubtitle}>
            Saisissez votre email et votre mot de passe pour accéder à vos parcelles.
          </Text>

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
                style={[styles.input, styles.passwordInput]}
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
                <Text style={styles.passwordToggleText}>
                  {showPassword ? 'Masquer' : 'Afficher'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ECFDF5" />
            ) : (
              <Text style={styles.primaryButtonText}>Se connecter</Text>
            )}
          </Pressable>

          <Link href="/(auth)/register" asChild>
            <Pressable style={styles.switchMode}>
              <Text style={styles.switchModeText}>
                Pas encore de compte ? Créer un compte
              </Text>
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
  },
  passwordInput: {
    flex: 1,
  },
  passwordToggle: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  passwordToggleText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
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