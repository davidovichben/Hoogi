import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import BrandProvider from '@/branding/BrandProvider'

createRoot(document.getElementById("root")!).render(
  <BrandProvider>
    <App />
  </BrandProvider>
);
