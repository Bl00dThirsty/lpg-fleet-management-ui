# Guide de nomenclature et de conception d'interface — Vite / Next.js

> Objectif : garantir un code lisible, cohérent et compréhensible par n'importe quel développeur, francophone ou non. **Toute la nomenclature du code (variables, fonctions, composants, fichiers, types, props, événements, routes API, etc.) doit être en anglais.** Le français reste réservé aux commentaires métier, à la documentation interne et au contenu affiché à l'utilisateur (i18n).

---

## 1. Principe fondamental

| Élément | Langue | Exemple correct | Exemple à proscrire |
|---|---|---|---|
| Variables, fonctions, composants | Anglais | `userProfile`, `fetchOrders()` | `profilUtilisateur`, `recupererCommandes()` |
| Fichiers et dossiers | Anglais | `user-card.tsx`, `services/` | `carte-utilisateur.tsx`, `services/` (ok mais éviter `services-fr/`) |
| Commentaires techniques | Anglais (recommandé en équipe mixte) ou français | `// retry on network failure` | — |
| Contenu utilisateur (UI text) | Français si le produit est francophone | `"Se connecter"` | — |
| Clés i18n | Anglais en clé, traduction en valeur | `t("auth.loginButton")` | `t("connexion.boutonConnexion")` |

Règle simple : **si ça apparaît dans le code source (nom d'identifiant), c'est en anglais. Si ça apparaît à l'écran pour l'utilisateur final, ça peut être en français.**

---

## 2. Nommage des fichiers et dossiers

### 2.1 Casse à utiliser

| Type | Convention | Exemple |
|---|---|---|
| Composants React | `PascalCase.tsx` ou `kebab-case.tsx` (choisir une seule convention et s'y tenir) | `UserCard.tsx` / `user-card.tsx` |
| Hooks | `camelCase.ts` préfixé `use` | `useAuth.ts`, `useDebounce.ts` |
| Utilitaires / helpers | `kebab-case.ts` | `format-date.ts`, `slugify.ts` |
| Types / interfaces | `kebab-case.types.ts` | `user.types.ts` |
| Constantes | `kebab-case.constants.ts` | `api.constants.ts` |
| Tests | même nom que le fichier testé + `.test.ts(x)` ou `.spec.ts(x)` | `user-card.test.tsx` |
| Styles (CSS modules) | même nom que le composant | `UserCard.module.css` |
| Dossiers | `kebab-case`, toujours au pluriel pour les collections | `components/`, `hooks/`, `services/`, `user-profile/` |

> **Recommandation** : dans un projet React/Next.js, la convention la plus répandue est `PascalCase` pour les fichiers de composants (`UserCard.tsx`) et `kebab-case` pour tout le reste. Choisissez-en une et documentez-la dans le `README.md`.

### 2.2 Structure de dossiers — Next.js (App Router)

```
src/
├── app/                        # routes (App Router)
│   ├── (auth)/                 # route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   └── users/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                     # composants génériques réutilisables
│   │   ├── Button.tsx
│   │   └── Modal.tsx
│   └── features/                # composants liés à une fonctionnalité métier
│       └── user-profile/
│           ├── UserProfileCard.tsx
│           └── UserProfileForm.tsx
├── hooks/
│   └── useCurrentUser.ts
├── services/                     # appels API / logique externe
│   └── user.service.ts
├── lib/                          # config, clients (axios, prisma, etc.)
│   └── api-client.ts
├── types/
│   └── user.types.ts
├── constants/
│   └── routes.constants.ts
├── utils/
│   └── format-date.ts
└── store/                        # état global (Zustand, Redux...)
    └── user.store.ts
```

### 2.3 Structure de dossiers — Vite (React)

```
src/
├── assets/
├── components/
│   ├── ui/
│   └── features/
├── pages/                        # si react-router
│   ├── HomePage.tsx
│   └── UserProfilePage.tsx
├── hooks/
├── services/
├── lib/
├── types/
├── constants/
├── utils/
├── store/
├── App.tsx
└── main.tsx
```

> **Organisation par fonctionnalité (feature-based)** recommandée dès que le projet grossit : regrouper composants, hooks et services propres à une fonctionnalité dans un même dossier (`features/user-profile/`) plutôt que de tout séparer par type technique.

---

## 3. Nommage des variables

### 3.1 Règles générales

- `camelCase` pour toute variable locale ou propriété d'objet.
- `UPPER_SNAKE_CASE` pour les constantes globales/immuables.
- Noms **explicites**, jamais d'abréviations obscures (`usr`, `btn`, `tmp` à éviter sauf convention d'équipe claire).

```ts
// ✅ Bon
const userEmail = "john@doe.com";
const maxRetryCount = 3;
const API_BASE_URL = "https://api.example.com";

// ❌ À éviter
const ue = "john@doe.com";
const nombreMaxTentatives = 3;
const apiBaseUrl_prod = "https://api.example.com";
```

### 3.2 Booléens

Toujours préfixer par un auxiliaire qui indique un état vrai/faux : `is`, `has`, `can`, `should`, `did`.

```ts
const isLoading = true;
const hasError = false;
const canEditProfile = true;
const shouldRedirect = false;
const didFetchData = true;
```

### 3.3 Collections (tableaux)

Toujours au **pluriel**, sans préfixe superflu.

```ts
const users = [];
const orderItems = [];
const selectedIds = [];
```

### 3.4 Objets et structures

```ts
const userProfile = { id: 1, name: "John" };
const formErrors = { email: "Invalid email" };
```

### 3.5 Constantes de configuration

```ts
export const DEFAULT_PAGE_SIZE = 20;
export const SUPPORTED_LOCALES = ["en", "fr"] as const;
```

---

## 4. Nommage des fonctions

### 4.1 Verbes d'action standard

| Préfixe | Usage | Exemple |
|---|---|---|
| `get` | récupérer une valeur en mémoire (synchrone) | `getUserInitials()` |
| `fetch` | récupérer des données depuis une API | `fetchUserOrders()` |
| `create` | créer une ressource | `createInvoice()` |
| `update` | mettre à jour une ressource | `updateUserProfile()` |
| `delete` / `remove` | supprimer une ressource | `deleteAccount()`, `removeItemFromCart()` |
| `set` | assigner une valeur | `setActiveTab()` |
| `toggle` | inverser un booléen | `toggleSidebar()` |
| `handle` | gérer un événement (fonction interne) | `handleSubmit()`, `handleInputChange()` |
| `on` | prop qui expose un callback vers le parent | `onSubmit`, `onClose` |
| `validate` | valider une donnée | `validateEmail()` |
| `format` | transformer une donnée pour l'affichage | `formatCurrency()` |
| `parse` | transformer une donnée brute en objet exploitable | `parseApiResponse()` |
| `is` / `has` / `can` | fonction retournant un booléen | `isValidEmail()`, `hasPermission()` |

### 4.2 Convention `handle` vs `on`

C'est LA distinction la plus importante en React :

- **`on...`** → nom de la **prop** exposée par un composant enfant vers le parent.
- **`handle...`** → nom de la **fonction interne** qui implémente ce comportement.

```tsx
// Composant enfant
type ButtonProps = {
  onClick: () => void;
};

// Composant parent
function UserForm() {
  const handleSubmit = () => {
    // logique de soumission
  };

  return <Button onClick={handleSubmit}>Save</Button>;
}
```

### 4.3 Fonctions asynchrones

```ts
async function fetchUserById(id: string): Promise<User> {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
}
```

---

## 5. Nommage des composants React

### 5.1 Règles

- `PascalCase` obligatoire.
- Le nom doit décrire **ce qu'est** le composant, pas ce qu'il fait techniquement.
- Éviter les noms génériques type `Component1`, `Wrapper`, `MyComponent`.

```tsx
// ✅ Bon
function UserCard() {}
function OrderSummaryTable() {}
function ConfirmDeleteModal() {}

// ❌ À éviter
function Card1() {}
function Comp() {}
function Data() {}
```

### 5.2 Suffixes utiles pour la lisibilité

| Suffixe | Usage | Exemple |
|---|---|---|
| `Page` | composant racine d'une route | `UserProfilePage` |
| `Layout` | structure englobante | `DashboardLayout` |
| `Provider` | fournisseur de contexte React | `AuthProvider` |
| `Context` | objet de contexte | `AuthContext` |
| `Modal` / `Dialog` | fenêtre modale | `ConfirmDeleteModal` |
| `List` | affichage de collection | `UserList` |
| `Item` | élément unique d'une liste | `UserListItem` |
| `Card` | bloc visuel autonome | `ProductCard` |
| `Form` | formulaire | `LoginForm` |
| `Icon` | icône | `SearchIcon` |

### 5.3 Props des composants

```tsx
type UserCardProps = {
  user: User;
  isSelected?: boolean;
  onSelect?: (userId: string) => void;
};

function UserCard({ user, isSelected = false, onSelect }: UserCardProps) {
  return (
    <div onClick={() => onSelect?.(user.id)}>
      {user.name}
    </div>
  );
}
```

> Le type de props d'un composant `XxxYyy` s'appelle systématiquement `XxxYyyProps`.

---

## 6. Nommage des hooks personnalisés

- Préfixe `use` **obligatoire** (contrainte React elle-même).
- `camelCase` après le préfixe.
- Le nom doit décrire ce que le hook retourne ou fait.

```ts
function useCurrentUser() { /* ... */ }
function useDebounce<T>(value: T, delay: number) { /* ... */ }
function useLocalStorage<T>(key: string, initialValue: T) { /* ... */ }
function useFetchOrders(userId: string) { /* ... */ }
```

Convention de retour recommandée (cohérence avec les hooks natifs React) :

```ts
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = () => setValue((prev) => !prev);
  return [value, toggle] as const;
}
```

---

## 7. Nommage TypeScript (types & interfaces)

### 7.1 Casse

`PascalCase` pour tous les types, interfaces et enums.

### 7.2 Type vs Interface

| Cas d'usage | Recommandation |
|---|---|
| Props de composant, objets à étendre | `interface` |
| Union, intersection, alias, primitives | `type` |

```ts
interface User {
  id: string;
  name: string;
  email: string;
}

type UserRole = "admin" | "editor" | "viewer";

type ApiResponse<T> = {
  data: T;
  error: string | null;
};
```

### 7.3 Convention de suffixe

- Pas de préfixe `I` (`IUser` ❌) — convention TypeScript moderne, contrairement à C#.
- Suffixe `Props` pour les props de composant : `ButtonProps`.
- Suffixe `Payload` pour les données envoyées à une API : `CreateUserPayload`.
- Suffixe `Response` pour les données reçues : `GetUserResponse`.
- Suffixe `State` pour un état local ou global : `AuthState`.

```ts
type CreateUserPayload = {
  name: string;
  email: string;
};

type GetUserResponse = {
  user: User;
};
```

### 7.4 Enums

```ts
enum OrderStatus {
  Pending = "PENDING",
  Shipped = "SHIPPED",
  Delivered = "DELIVERED",
  Cancelled = "CANCELLED",
}
```

---

## 8. Nommage CSS / Tailwind / classes

### 8.1 Avec Tailwind CSS

Pas de convention de nommage à gérer pour les classes utilitaires natives. Pour les classes custom (rares), utiliser `kebab-case` en respectant BEM si besoin :

```css
.card {}
.card__title {}
.card--highlighted {}
```

### 8.2 Avec CSS Modules

```css
/* UserCard.module.css */
.container {}
.title {}
.avatarImage {}
```

```tsx
import styles from "./UserCard.module.css";
<div className={styles.container}>
```

---

## 9. Nommage de la couche API / services

```ts
// services/user.service.ts
export async function getUser(id: string): Promise<User> { /* ... */ }
export async function createUser(payload: CreateUserPayload): Promise<User> { /* ... */ }
export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> { /* ... */ }
export async function deleteUser(id: string): Promise<void> { /* ... */ }
```

### 9.1 Routes API (Next.js App Router)

```
app/api/users/route.ts          → GET /api/users, POST /api/users
app/api/users/[id]/route.ts     → GET /api/users/:id, PATCH, DELETE
```

```ts
// app/api/users/route.ts
export async function GET(request: Request) { /* ... */ }
export async function POST(request: Request) { /* ... */ }
```

---

## 10. Gestion d'état global (Zustand / Redux / Context)

```ts
// store/user.store.ts
type UserState = {
  currentUser: User | null;
  isAuthenticated: boolean;
  setCurrentUser: (user: User) => void;
  clearCurrentUser: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: true }),
  clearCurrentUser: () => set({ currentUser: null, isAuthenticated: false }),
}));
```

Convention Redux Toolkit :

```ts
// features/user/userSlice.ts
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrentUser: (state, action) => { /* ... */ },
    clearCurrentUser: (state) => { /* ... */ },
  },
});
```

---

## 11. Constantes et configuration

```ts
// constants/routes.constants.ts
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  USER_PROFILE: (id: string) => `/users/${id}`,
} as const;
```

```ts
// constants/api.constants.ts
export const API_ENDPOINTS = {
  USERS: "/api/users",
  ORDERS: "/api/orders",
} as const;
```

---

## 12. Tests

```ts
describe("UserCard", () => {
  it("should display the user name", () => { /* ... */ });
  it("should call onSelect when clicked", () => { /* ... */ });
});
```

Convention : `describe` = nom du composant/fonction testée, `it("should ...")` = comportement attendu, toujours en anglais.

---

## 13. Git — branches et commits (bonus)

| Type | Format | Exemple |
|---|---|---|
| Branche feature | `feature/short-description` | `feature/user-authentication` |
| Branche fix | `fix/short-description` | `fix/login-redirect-loop` |
| Commit (Conventional Commits) | `type(scope): message` | `feat(auth): add password reset flow` |

Types de commit courants : `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`.

---

## 14. Mise en application avec ESLint

Exemple de configuration pour **imposer** ces conventions automatiquement (`eslint-plugin-@typescript-eslint`) :

```js
// eslint.config.js (extrait)
rules: {
  "@typescript-eslint/naming-convention": [
    "error",
    { selector: "variable", format: ["camelCase", "UPPER_CASE"] },
    { selector: "function", format: ["camelCase"] },
    { selector: "typeLike", format: ["PascalCase"] },
    { selector: "interface", format: ["PascalCase"] },
    {
      selector: "variable",
      types: ["boolean"],
      format: ["PascalCase"],
      prefix: ["is", "has", "can", "should", "did"],
    },
  ],
}
```

---

## 15. Cheat sheet récapitulative

| Élément | Convention | Exemple |
|---|---|---|
| Variable | `camelCase` | `userEmail` |
| Constante globale | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Booléen | `camelCase` + préfixe `is/has/can/should` | `isLoading` |
| Fonction | `camelCase` + verbe d'action | `fetchUserOrders()` |
| Event handler interne | `handleXxx` | `handleSubmit` |
| Prop callback | `onXxx` | `onSubmit` |
| Composant React | `PascalCase` | `UserProfileCard` |
| Props de composant | `XxxProps` | `UserProfileCardProps` |
| Hook custom | `useXxx` | `useCurrentUser` |
| Type / Interface | `PascalCase` | `User`, `UserRole` |
| Enum | `PascalCase` (clés en `PascalCase`) | `OrderStatus.Pending` |
| Fichier composant | `PascalCase.tsx` | `UserCard.tsx` |
| Fichier utilitaire | `kebab-case.ts` | `format-date.ts` |
| Dossier | `kebab-case`, pluriel si collection | `components/`, `user-profile/` |
| Route API | `kebab-case` dans l'URL | `/api/user-orders` |

---

## 16. Résumé exécutif

1. **Anglais partout dans le code**, français uniquement pour le contenu affiché et éventuellement les commentaires métier.
2. Une **convention par catégorie** (variable, fonction, composant, fichier) appliquée sans exception.
3. `handle` = fonction interne, `on` = prop exposée : ne jamais confondre.
4. Les noms sont **descriptifs**, pas des abréviations : le code doit se lire comme une phrase.
5. Automatiser le contrôle via **ESLint** pour ne pas dépendre de la discipline individuelle.
