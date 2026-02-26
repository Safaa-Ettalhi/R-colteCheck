import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import {
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { useRouter } from 'expo-router';

type UserProfile = {
  fullName: string;
  birthDate: string;
  city: string;
  gender: string;
  zone: string;
  email: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');
  const [zone, setZone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const chargerProfil = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data() as any;
          const profil: UserProfile = {
            fullName: data.fullName ?? '',
            birthDate: data.birthDate ?? '',
            city: data.city ?? '',
            gender: data.gender ?? '',
            zone: data.zone ?? '',
            email: data.email ?? user.email ?? '',
          };
          setProfile(profil);
          setFullName(profil.fullName);
          setBirthDate(profil.birthDate);
          setCity(profil.city);
          setGender(profil.gender);
          setZone(profil.zone);
        } else {
          const profil: UserProfile = {
            fullName: '',
            birthDate: '',
            city: '',
            gender: '',
            zone: '',
            email: user.email ?? '',
          };
          // si pas de doc on le crée vide
          await setDoc(ref, {
            fullName: '',
            birthDate: '',
            city: '',
            gender: '',
            zone: '',
            email: profil.email,
            createdAt: new Date(),
          });
          setProfile(profil);
        }
      } catch (e) {
        console.error('Erreur chargement profil', e);
        alert('Impossible de charger le profil.');
      } finally {
        setLoading(false);
      }
    };

    chargerProfil();
  }, []);

  const enregistrerProfil = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!fullName.trim()) {
      alert('Le nom complet est obligatoire.');
      return;
    }

    try {
      setSaving(true);
      const ref = doc(db, 'users', user.uid);
      await updateDoc(ref, {
        fullName: fullName.trim(),
        birthDate: birthDate.trim(),
        city: city.trim(),
        gender: gender.trim(),
        zone: zone.trim(),
      });
      alert('Profil mis à jour.');
    } catch (e) {
      console.error('Erreur mise à jour profil', e);
      alert('Impossible de mettre à jour le profil.');
    } finally {
      setSaving(false);
    }
  };

  const changerMotDePasse = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      alert('Utilisateur non disponible.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert('Tous les champs mot de passe sont obligatoires.');
      return;
    }

    if (newPassword.length < 6) {
      alert('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert('La confirmation du nouveau mot de passe ne correspond pas.');
      return;
    }

    try {
      setChangingPassword(true);

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      alert('Mot de passe mis à jour.');
    } catch (e: any) {
      console.error('Erreur changement mot de passe', e);
      if (e?.code === 'auth/wrong-password') {
        alert('Mot de passe actuel incorrect.');
      } else if (e?.code === 'auth/too-many-requests') {
        alert('Trop de tentatives. Réessaie plus tard.');
      } else if (e?.code === 'auth/requires-recent-login') {
        alert('Merci de vous reconnecter puis réessayer de changer le mot de passe.');
      } else {
        alert('Impossible de changer le mot de passe.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const seDeconnecter = async () => {
    try {
      await signOut(auth);
      router.replace('/(auth)/login');
    } catch (e) {
      console.error('Erreur déconnexion', e);
      alert('Impossible de se déconnecter.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar backgroundColor="#166534" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#166534" />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar backgroundColor="#166534" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Aucun utilisateur connecté.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar backgroundColor="#166534" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.appTitle}>Mon profil</Text>
        <Text style={styles.appSubtitle}>{profile.email}</Text>
      </View>

      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations personnelles</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Votre nom complet"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date de naissance</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="JJ/MM/AAAA"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ville</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Ex : Marrakech"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Sexe</Text>
            <View style={styles.genderOptionsRow}>
              {[
                { label: 'Homme', value: 'homme' },
                { label: 'Femme', value: 'femme' },
                { label: 'Autre', value: 'autre' },
              ].map((option) => {
                const selected = gender === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.genderOption,
                      selected && styles.genderOptionSelected,
                    ]}
                    onPress={() => setGender(option.value)}
                  >
                    <View
                      style={[
                        styles.genderRadioOuter,
                        selected && styles.genderRadioOuterSelected,
                      ]}
                    >
                      {selected && <View style={styles.genderRadioInner} />}
                    </View>
                    <Text
                      style={[
                        styles.genderOptionText,
                        selected && styles.genderOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Zone</Text>
            <TextInput
              style={styles.input}
              value={zone}
              onChangeText={setZone}
              placeholder="Ex : Plaine, Montagne..."
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Pressable
            style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
            onPress={enregistrerProfil}
            disabled={saving}
          >
            <Text style={styles.primaryButtonText}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Sécurité</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mot de passe actuel</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Mot de passe actuel"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nouveau mot de passe"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              placeholder="Confirmer le nouveau mot de passe"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
          </View>

          <Pressable
            style={[
              styles.secondaryButton,
              changingPassword && styles.primaryButtonDisabled,
            ]}
            onPress={changerMotDePasse}
            disabled={changingPassword}
          >
            <Text style={styles.secondaryButtonText}>
              {changingPassword ? 'Modification...' : 'Modifier le mot de passe'}
            </Text>
          </Pressable>
        </View>

        <Pressable style={styles.logoutButton} onPress={seDeconnecter}>
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </Pressable>
        </ScrollView>
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
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
  secondaryButton: {
    marginTop: 10,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
  },
  scrollContent: {
    paddingBottom: 32,
    gap: 16,
  },
  genderOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  genderOptionSelected: {
    borderColor: '#166534',
    backgroundColor: '#DCFCE7',
  },
  genderRadioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  genderRadioOuterSelected: {
    borderColor: '#166534',
  },
  genderRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#166534',
  },
  genderOptionText: {
    fontSize: 13,
    color: '#374151',
  },
  genderOptionTextSelected: {
    fontWeight: '600',
    color: '#166534',
  },
});