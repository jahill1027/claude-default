import { createHashRouter } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LibraryPage } from '@/features/library/LibraryPage';
import { BuilderPage } from '@/features/builder/BuilderPage';
import { SheetPage } from '@/features/sheet/SheetPage';

// Hash routing so the app works from any static host and even a file:// —
// no server-side SPA fallback needed. Routes: #/ , #/build/:id , #/sheet/:id
export const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <LibraryPage /> },
      { path: 'build/:id', element: <BuilderPage /> },
      { path: 'sheet/:id', element: <SheetPage /> },
    ],
  },
]);
