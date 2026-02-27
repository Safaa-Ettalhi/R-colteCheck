## RécolteCheck – Documentation du projet mobile

### Architecture de l’application

- **Stack principale**
  - **Expo / React Native / React** pour une application mobile multiplateforme.
  - **expo-router** pour la navigation basée sur la structure de dossiers dans `app/`.
  - **Firebase** (Auth + Firestore) comme backend managé.

- **Organisation des dossiers**
  - `app/`
    - `_layout.tsx` : racine de la navigation, écoute Firebase Auth et envoie vers `(auth)` ou `(tabs)` selon que l’utilisateur est connecté.
    - `(auth)/` : écrans d’authentification.
      - `_layout.tsx` : Stack sans header.
      - `login.tsx` : connexion email / mot de passe.
      - `register.tsx` : création de compte et document `users/{uid}` minimal.
    - `(tabs)/` : navigation par onglets pour les utilisateurs connectés.
      - `_layout.tsx` : définition des onglets "Parcelles" et "Profil".
      - `index.tsx` : écran principal des parcelles (liste, création, statistiques globales).
      - `profile.tsx` : gestion du profil utilisateur (infos personnelles, mot de passe, déconnexion).
    - `parcelle/`
      - `[id].tsx` : détails d’une parcelle, lecture de `parcelles/{id}` + stats sur les récoltes associées.
      - `[id]/edit.tsx` : édition d’une parcelle existante (`updateDoc` sur Firestore).
      - `[id]/recoltes.tsx` : création, modification, suppression et listing des récoltes liées à une parcelle.
- `firebaseConfig.ts`
    - Initialisation de l’app Firebase avec `initializeApp`.
    - Exporte :
      - `db = getFirestore(app)` pour Firestore.
      - `auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })` pour l’authentification avec persistance locale.
  - `constants/theme.ts`, `components/`, `hooks/`
    - Regroupent le thème de couleur, les composants UI réutilisables (icônes, onglets haptiques) et le hook de thème (`use-color-scheme`).

### Architecture fonctionnelle et modèle de données

- **Application cliente** : Expo / React Native (RécolteCheck sur mobile)
- **Backend managé** : Firebase
  - **Auth** : gestion des comptes utilisateurs (email + mot de passe)
  - **Firestore** : base de données NoSQL

#### Modèle de données (Firestore)

- **users**
  - `users/{uid}`  
    - `fullName`, `birthDate`, `city`, `gender`, `zone`, `email`, `createdAt`

- **parcelles**
  - `parcelles/{parcelleId}`  
    - `nom`, `surface`, `culture`, `periodeDebut`, `periodeFin`, `ownerUid`, `createdAt`

- **recoltes**
  - `recoltes/{recolteId}`  
    - `parcelleId`, `ownerUid`, `date`, `zone`, `poids`, `remarques`

Relationnellement :

- Un **user** possède plusieurs **parcelles** (`parcelles.ownerUid = auth.uid`)
- Une **parcelle** possède plusieurs **récoltes** (`recoltes.parcelleId = parcelles.id`)

### Guide d’installation et de configuration

- **0. Cloner le projet **
  - Ouvrir un terminal (ou PowerShell) et se placer dans le dossier où tu veux mettre le projet, puis taper :
    ```bash
    git clone https://github.com/Safaa-Ettalhi/R-colteCheck.git
    cd R-colteCheck
    ```

- **1. Pré-requis**
  - Node.js (version LTS recommandée).
  - npm, yarn ou pnpm.
  - Optionnel : Expo CLI installé globalement.

- **2. Installation**
  - Depuis la racine du projet mobile :
    ```bash
    cd R-colteCheck
    npm install
    ```

- **3. Configuration Firebase**
  - Le fichier `firebaseConfig.ts` contient déjà une configuration fonctionnelle :
    - Clés `apiKey`, `authDomain`, `projectId`, etc.
  - Pour un autre projet Firebase :
    - Créer un projet sur la console Firebase.
    - Récupérer les valeurs de configuration Web.
    - Mettre à jour l’objet `firebaseConfig` dans `firebaseConfig.ts`.

- **4. Lancer l’application**
  - Démarrer le bundler Expo :
    ```bash
    npm run start
    ```
  - Depuis l’interface Expo :
    - scanner le QR code avec **Expo Go**, ou
    - lancer un émulateur Android, un simulateur iOS, ou le mode Web.

- **5. Lint et qualité**
  - Pour lancer ESLint :
    ```bash
    npm run lint
    ```

### Dépendances externes et rôle

- **Navigation / structure**
  - `expo-router` : gestion de la navigation par fichiers (`app/`).
  - `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/elements` : cœur du système de navigation et des onglets bas.

- **Expo / React Native**
  - `expo`, `react`, `react-native` : base de l’application mobile.
  - `react-native-web`, `react-dom` : support du mode Web.
  - `react-native-safe-area-context` : gestion des zones sûres (`SafeAreaView`).
  - `react-native-gesture-handler`, `react-native-screens` : navigation fluide et performante.
  - `react-native-reanimated`, `react-native-worklets` : animations avancées et logique en worklets.

- **UI, thème et expérience utilisateur**
  - `@expo/vector-icons` : icônes vectorielles.
  - `expo-status-bar` : gestion de la barre de statut.
  - `expo-system-ui`, `expo-constants`, `expo-font`, `expo-image`, `expo-web-browser`, `expo-linking`, `expo-splash-screen`, `expo-symbols` : fonctionnalités natives supplémentaires (thème, police, images, liens externes, splash screen, etc.).

- **Dates, formulaires, stockage**
  - `@react-native-community/datetimepicker` : sélection de dates (périodes de récolte, dates de récolte, date de naissance).
  - `@react-native-async-storage/async-storage` : stockage local pour la persistance de la session Firebase Auth.

- **Backend / données**
  - `firebase` : SDK Firebase pour :
    - Authentification (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signOut`, `updatePassword`…).
    - Firestore (`collection`, `doc`, `getDoc`, `getDocs`, `addDoc`, `updateDoc`, `deleteDoc`, `query`, `where`).

- **Outils de développement**
  - `typescript` : typage statique.
  - `eslint`, `eslint-config-expo` : linting et règles de code.
  - `@types/react` : types TypeScript pour React.
