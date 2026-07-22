import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CityName } from '../types';
import { useAuth } from './AuthContext';

interface CityContextType {
  selectedCity: CityName;
  setSelectedCity: (city: CityName) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export function CityProvider({ children }: { children: ReactNode }) {
  const [selectedCity, setSelectedCity] = useState<CityName>('Mumbai');
  const { user } = useAuth();

  // Lock city authority to their assigned city
  useEffect(() => {
    if (user?.role === 'city_authority' && user.city) {
      const validCities: CityName[] = ['Mumbai', 'Delhi', 'Bengaluru'];
      if (validCities.includes(user.city as CityName)) {
        setSelectedCity(user.city as CityName);
      }
    }
  }, [user]);

  // If city authority, override any setSelectedCity calls to keep them locked
  const handleSetSelectedCity = (city: CityName) => {
    if (user?.role === 'city_authority') return; // Locked — ignore external changes
    setSelectedCity(city);
  };

  return (
    <CityContext.Provider value={{ selectedCity, setSelectedCity: handleSetSelectedCity }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
}
