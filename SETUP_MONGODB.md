# 🚀 Configuración MongoDB para MyCompaXML

## ⚡ Configuración Rápida

### 1. Crear archivo `.env.local`

Crea el archivo `.env.local` en la raíz del proyecto con:

```bash
# MongoDB Configuration - Reemplaza con tus datos reales
MONGODB_URI=mongodb+srv://tu-usuario:tu-contraseña@cluster0.xxxxx.mongodb.net/myCompaXML?retryWrites=true&w=majority

# Next.js Configuration
NEXTAUTH_SECRET=tu-secreto-super-seguro-aqui
NEXTAUTH_URL=http://localhost:3000
```

### 2. Configurar MongoDB Atlas

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea una cuenta y un cluster gratuito
3. Crea un usuario de base de datos
4. Configura Network Access (permite tu IP o 0.0.0.0/0 para desarrollo)
5. Obtén la cadena de conexión y reemplaza los valores en `.env.local`

### 3. Probar la conexión

```bash
npm run dev
```

Luego ve a: `http://localhost:3000/api/test-connection`

### 4. Poblar con datos de ejemplo (opcional)

```bash
npm run seed
```

## 📊 APIs Disponibles

- **GET** `/api/users` - Obtener usuarios de la colección Users
- **POST** `/api/users` - Crear nuevo usuario
- **GET** `/api/test-connection` - Probar conexión a MongoDB

## 🔧 Scripts Útiles

```bash
npm run seed          # Poblar base de datos con usuarios de ejemplo
npm run seed:clear    # Limpiar y poblar base de datos
npm run db:test       # Probar conexión (requiere servidor corriendo)
```

## 📁 Estructura Creada

```
lib/
├── mongodb.ts        # Conexión a MongoDB
├── dbUtils.ts        # Utilidades de BD
└── models/
    └── User.ts       # Modelo Users para colección myCompaXML.Users

app/
└── api/
    ├── users/
    │   └── route.ts  # CRUD usuarios
    └── test-connection/
        └── route.ts  # Test conexión

scripts/
└── seed-users.ts     # Script para poblar datos
```

## ✅ Verificación

1. El archivo `app/page.tsx` ya está configurado para mostrar usuarios
2. La conexión apunta específicamente a la base de datos `myCompaXML`
3. La colección se llama `Users`
4. Los usuarios tienen hash de contraseñas automático
