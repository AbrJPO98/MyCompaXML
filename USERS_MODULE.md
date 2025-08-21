# 👥 Módulo de Gestión de Usuarios

## 🚀 Descripción General

El módulo de gestión de usuarios permite administrar usuarios dentro del mismo canal de la organización. Cada usuario solo puede ver y gestionar usuarios que pertenezcan al mismo canal (`channelId`) que el usuario autenticado.

## 📍 Acceso al Módulo

- **URL**: `/users`
- **Autenticación**: Requerida (redirige a `/login` si no está autenticado)
- **Protección**: Solo usuarios del mismo canal pueden acceder

## ✨ Funcionalidades Implementadas

### 📋 Vista Principal - Tabla de Usuarios

La página principal muestra una tabla con todos los usuarios del mismo canal:

**Columnas mostradas:**

1. **Cédula**: Número de identificación (`ident`)
2. **Tipo de Cédula**: Convertido a texto legible
   - `01` → "Física"
   - `02` → "Jurídica"
   - `03` → "DIMEX"
   - `04` → "NITE"
   - `##` → "Pasaporte"
3. **Nombre**: Combinación de `first_name` + `last_name`
4. **Correo**: Email del usuario (`email`)
5. **Teléfono**: Combinación de `phone_code` + `phone` (ej: +506 88888888)
6. **Acciones**: Botones para editar (✏️) y eliminar (🗑️)

### 🔍 Búsqueda y Filtrado

- **Búsqueda en tiempo real** por:
  - Nombre (first_name + last_name)
  - Email
  - Número de cédula
- **Paginación automática** (10 usuarios por página)
- **Contador de resultados** en tiempo real

### ➕ Crear Nuevo Usuario

**Modal de creación con campos:**

- **Primer Nombre** (requerido)
- **Apellidos** (requerido)
- **Cédula** (requerido, único)
- **Tipo de Cédula** (select con opciones)
- **Correo** (requerido, único, validación de formato)
- **Teléfono** (requerido)
  - Select con códigos de país (emoji + código)
  - Carga automática desde `public/phone_codes.json`
- **Contraseña** (requerido, mínimo 6 caracteres)
  - Botón mostrar/ocultar (👁️/🙈)
  - Campo de confirmación
  - Validación de coincidencia

### ✏️ Editar Usuario Existente

**Modal de edición:**

- Todos los campos del formulario de creación
- **Sin campos de contraseña** (seguridad)
- Datos pre-poblados del usuario seleccionado
- Validación de unicidad (excluye al usuario actual)

### 🗑️ Eliminar Usuario

**Modal de confirmación:**

- Mensaje de advertencia
- Acción irreversible
- Confirmación explícita requerida

## 🔐 Seguridad Implementada

### Filtrado por Canal

- **API Level**: Todas las consultas filtran por `channelId`
- **Frontend**: Solo usuarios del mismo canal son visibles
- **Validación**: Canal debe estar activo (`isActive: true`)

### Validaciones de Datos

- **Email único** por toda la base de datos
- **Cédula única** por toda la base de datos
- **Contraseñas hasheadas** con bcrypt (12 salt rounds)
- **Sanitización** de todos los inputs
- **Validación de formato** de email

### Autenticación y Autorización

- **Rutas protegidas** - require autenticación
- **Verificación de canal** en cada request
- **Tokens de sesión** persistentes

## 🛠️ APIs Disponibles

### GET `/api/users`

- **Parámetros**: `page`, `limit`, `search`, `channelId`
- **Response**: Lista paginada de usuarios del canal
- **Filtros**: Por nombre, email, cédula

### POST `/api/users`

- **Body**: Datos del nuevo usuario + `channel_id`
- **Validaciones**: Email único, cédula única, canal activo
- **Security**: Password hasheado automáticamente

### GET `/api/users/[id]`

- **Parámetros**: `channelId` (query parameter)
- **Response**: Usuario específico del canal
- **Security**: Solo usuarios del mismo canal

### PUT `/api/users/[id]`

- **Body**: Datos actualizados (sin password)
- **Validaciones**: Unicidad excluye usuario actual
- **Security**: No permite cambio de canal

### DELETE `/api/users/[id]`

- **Parámetros**: `channelId` (query parameter)
- **Response**: Confirmación de eliminación
- **Security**: Solo usuarios del mismo canal

## 📱 Responsive Design

- **Mobile-first**: Optimizado para dispositivos móviles
- **Breakpoints**: 768px y 480px
- **Adaptaciones**:
  - Formularios en columna única en móvil
  - Botones de acción apilados
  - Modal responsivo
  - Tabla scrolleable horizontal

## 🧪 Testing

### Crear Datos de Prueba

```bash
npm run test:users
```

**Este script:**

- Verifica conexión a MongoDB
- Crea canal activo si no existe
- Crea 3 usuarios de prueba
- Valida consultas filtradas por canal
- Muestra estadísticas del módulo

### Credenciales de Prueba

- **Email**: `maria.gonzalez@test.com`
- **Password**: `password123`

## 🚀 Cómo Usar

### 1. Acceder al Módulo

1. Inicia sesión en `/login`
2. Ve al dashboard
3. Haz clic en "👥 Gestión de Usuarios"

### 2. Crear Usuario

1. Haz clic en "+ Nuevo Usuario"
2. Completa el formulario
3. La contraseña se hashea automáticamente
4. El `channelId` se asigna automáticamente

### 3. Editar Usuario

1. Haz clic en el botón ✏️ en la tabla
2. Modifica los campos necesarios
3. No se puede cambiar la contraseña desde aquí

### 4. Eliminar Usuario

1. Haz clic en el botón 🗑️ en la tabla
2. Confirma la eliminación
3. **Acción irreversible**

### 5. Buscar Usuarios

1. Usa la barra de búsqueda superior
2. Busca por nombre, email o cédula
3. Los resultados se filtran en tiempo real

## 📊 Características Técnicas

- **Framework**: Next.js 14 con App Router
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: Contexto React persistente
- **Styling**: CSS Modules con diseño moderno
- **Validación**: Frontend + Backend
- **Security**: bcrypt, sanitización, filtrado por canal
- **UX**: Loading states, error handling, confirmaciones

## 🎯 Estado del Proyecto

✅ **Completado al 100%**

- Tabla de usuarios con filtrado por canal
- CRUD completo (Create, Read, Update, Delete)
- Modal responsive para formularios
- Validaciones comprehensivas
- Security por canal implementada
- Búsqueda y paginación
- Testing y datos de prueba
- Documentación completa

El módulo está listo para producción y cumple con todos los requerimientos especificados.
