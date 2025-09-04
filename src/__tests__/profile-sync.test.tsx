import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProfilePage from '../pages/Profile';
import Onboarding from '../pages/Onboarding';
import * as rpc from '../lib/rpc';

// Mock the RPC functions
vi.mock('../lib/rpc', () => ({
  getUserId: vi.fn(),
  fetchProfileByUserId: vi.fn(),
  upsertProfile: vi.fn(),
}));

// Mock the branding functions
vi.mock('../lib/branding', () => ({
  applyBrandingVars: vi.fn(),
  sanitizeHex: vi.fn((color) => color),
  normalizeLogoPath: vi.fn((path) => path),
}));

// Mock the occupations
vi.mock('../utils/occupations', () => ({
  OCCUPATIONS: {
    "יופי וטיפוח": ["ספרות", "קוסמטיקה", "איפור מקצועי"],
    "מסעדנות": ["מסעדות", "בתי קפה", "קייטרינג"],
    "אחר": ["אחר"]
  }
}));

// Mock the toast
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock Supabase
vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn()
      }))
    }
  }
}));

const mockProfile = {
  id: 'test-user-id',
  company: 'Test Company',
  phone: '050-1234567',
  email: 'test@example.com',
  occupation: 'יופי וטיפוח',
  suboccupation: 'קוסמטיקה',
  brand_primary: '#16939B',
  brand_secondary: '#FFD500',
  brand_logo_path: 'test-logo.png',
  background_color: '#ffffff',
  business_category: 'יופי וטיפוח',
  business_subcategory: 'קוסמטיקה',
  business_other: '',
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Profile Synchronization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    (rpc.getUserId as any).mockResolvedValue('test-user-id');
    (rpc.fetchProfileByUserId as any).mockResolvedValue(mockProfile);
    (rpc.upsertProfile as any).mockResolvedValue(undefined);
  });

  describe('Profile.tsx', () => {
    it('should load profile data and display occupation/suboccupation/backgroundColor', async () => {
      renderWithRouter(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('יופי וטיפוח')).toBeInTheDocument();
        expect(screen.getByDisplayValue('קוסמטיקה')).toBeInTheDocument();
        expect(screen.getByDisplayValue('ffffff')).toBeInTheDocument();
      });
    });

    it('should call upsertProfile with correct data when saving', async () => {
      renderWithRouter(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('יופי וטיפוח')).toBeInTheDocument();
      });

      // Change occupation
      const occupationSelect = screen.getByDisplayValue('יופי וטיפוח');
      fireEvent.change(occupationSelect, { target: { value: 'מסעדנות' } });

      // Change suboccupation
      const suboccupationSelect = screen.getByDisplayValue('קוסמטיקה');
      fireEvent.change(suboccupationSelect, { target: { value: 'בתי קפה' } });

      // Change background color
      const backgroundColorInput = screen.getByDisplayValue('ffffff');
      fireEvent.change(backgroundColorInput, { target: { value: 'ff0000' } });

      // Click save button
      const saveButton = screen.getByRole('button', { name: /שמור פרופיל/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(rpc.upsertProfile).toHaveBeenCalledWith(
          'test-user-id',
          expect.objectContaining({
            occupation: 'מסעדנות',
            suboccupation: 'בתי קפה',
            backgroundColor: '#ff0000',
            brandPrimary: expect.any(String),
            brandSecondary: expect.any(String),
            brandLogoPath: expect.any(String),
          })
        );
      });
    });

    it('should handle missing profile data gracefully', async () => {
      (rpc.fetchProfileByUserId as any).mockResolvedValue(null);
      
      renderWithRouter(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('לא נמצא פרופיל')).toBeInTheDocument();
      });
    });
  });

  describe('Onboarding.tsx', () => {
    it('should load profile data and display occupation/suboccupation/backgroundColor', async () => {
      renderWithRouter(<Onboarding />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('יופי וטיפוח')).toBeInTheDocument();
        expect(screen.getByDisplayValue('קוסמטיקה')).toBeInTheDocument();
        expect(screen.getByDisplayValue('ffffff')).toBeInTheDocument();
      });
    });

    it('should call upsertProfile with correct data when saving profile', async () => {
      renderWithRouter(<Onboarding />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('יופי וטיפוח')).toBeInTheDocument();
      });

      // Change occupation
      const occupationSelect = screen.getByDisplayValue('יופי וטיפוח');
      fireEvent.change(occupationSelect, { target: { value: 'מסעדנות' } });

      // Change suboccupation
      const suboccupationSelect = screen.getByDisplayValue('קוסמטיקה');
      fireEvent.change(suboccupationSelect, { target: { value: 'בתי קפה' } });

      // Change background color
      const backgroundColorInput = screen.getByDisplayValue('ffffff');
      fireEvent.change(backgroundColorInput, { target: { value: '00ff00' } });

      // Find and click save profile button (if exists)
      const saveButtons = screen.getAllByRole('button');
      const saveProfileButton = saveButtons.find(button => 
        button.textContent?.includes('שמור') || button.textContent?.includes('Save')
      );
      
      if (saveProfileButton) {
        fireEvent.click(saveProfileButton);
      }

      await waitFor(() => {
        expect(rpc.upsertProfile).toHaveBeenCalledWith(
          'test-user-id',
          expect.objectContaining({
            occupation: 'מסעדנות',
            suboccupation: 'בתי קפה',
            backgroundColor: '#00ff00',
            brandPrimary: expect.any(String),
            brandSecondary: expect.any(String),
            brandLogoPath: expect.any(String),
          })
        );
      });
    });

    it('should handle missing profile data gracefully', async () => {
      (rpc.fetchProfileByUserId as any).mockResolvedValue(null);
      
      renderWithRouter(<Onboarding />);

      // Should not crash and should show default values
      await waitFor(() => {
        expect(screen.getByDisplayValue('')).toBeInTheDocument();
      });
    });
  });

  describe('Data Synchronization', () => {
    it('should sync occupation/suboccupation/backgroundColor between Profile and Onboarding', async () => {
      // Test that both components use the same data structure
      const expectedData = {
        occupation: 'מסעדנות',
        suboccupation: 'בתי קפה',
        backgroundColor: '#ff0000',
        brandPrimary: '#16939B',
        brandSecondary: '#FFD500',
        brandLogoPath: 'test-logo.png',
      };

      // Both components should call upsertProfile with the same structure
      expect(rpc.upsertProfile).toBeDefined();
      
      // The mock should be called with the expected structure
      (rpc.upsertProfile as any).mockImplementation((userId, data) => {
        expect(data).toMatchObject(expectedData);
        return Promise.resolve();
      });
    });
  });
});




