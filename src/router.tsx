import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LibraryPage } from '@/features/library/LibraryPage';
import { BuilderPage } from '@/features/builder/BuilderPage';
import { SheetPage } from '@/features/sheet/SheetPage';

export const router = createBrowserRouter([
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
