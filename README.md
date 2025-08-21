# MyCompaXML

Una aplicación Next.js moderna construida con TypeScript.

## Comenzar

Primero, instala las dependencias:

```bash
npm install
# o
yarn install
# o
pnpm install
```

Luego, ejecuta el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

Puedes comenzar a editar la página modificando `app/page.tsx`. La página se actualizará automáticamente mientras edites el archivo.

## Estructura del Proyecto

```
myCompaXML/
├── app/                    # App Router (Next.js 13+)
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página de inicio
│   └── page.module.css    # Estilos de la página
├── components/            # Componentes reutilizables
│   ├── Header.tsx
│   └── Header.module.css
├── public/                # Archivos estáticos
├── next.config.js         # Configuración de Next.js
├── package.json           # Dependencias y scripts
├── tsconfig.json          # Configuración de TypeScript
└── README.md              # Este archivo
```

## Scripts Disponibles

- `npm run dev` - Ejecuta el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Ejecuta el servidor de producción
- `npm run lint` - Ejecuta el linter de código

## Tecnologías Utilizadas

- [Next.js 14](https://nextjs.org/) - Framework de React
- [React 18](https://reactjs.org/) - Biblioteca de JavaScript para UI
- [TypeScript](https://www.typescriptlang.org/) - JavaScript con tipos
- [CSS Modules](https://github.com/css-modules/css-modules) - Estilos con scope local

## Aprende Más

Para aprender más sobre Next.js, revisa los siguientes recursos:

- [Documentación de Next.js](https://nextjs.org/docs) - aprende sobre las características y API de Next.js
- [Aprende Next.js](https://nextjs.org/learn) - tutorial interactivo de Next.js
- [Repositorio de Next.js en GitHub](https://github.com/vercel/next.js/) - ¡tus comentarios y contribuciones son bienvenidos!

## Deploy en Vercel

La manera más fácil de desplegar tu aplicación Next.js es usar la [Plataforma Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) de los creadores de Next.js.

Revisa la [documentación de deployment de Next.js](https://nextjs.org/docs/deployment) para más detalles.
