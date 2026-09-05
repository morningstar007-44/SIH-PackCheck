import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Inspection } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface InspectionContextType {
  inspections: Inspection[];
  currentInspection: Inspection | null;
  loading: boolean;
  setCurrentInspection: (inspection: Inspection | null) => void;
  addInspection: (inspection: Inspection) => Promise<void>;
  getInspectionById: (id: string) => Inspection | undefined;
  refreshInspections: () => Promise<void>;
}

const InspectionContext = createContext<InspectionContextType | undefined>(undefined);

export const InspectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [currentInspection, setCurrentInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshInspections = async () => {
    setLoading(true);

    if (!isSupabaseConfigured() || !user) {
      const stored = localStorage.getItem('packcheck_local_inspections');
      if (stored) {
        setInspections(JSON.parse(stored));
      } else {
        setInspections([]);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .order('inspection_date', { ascending: false });

      if (error) {
        console.error('Supabase inspections fetch error:', error);
        setInspections([]);
      } else if (data) {
        setInspections(data as Inspection[]);
      } else {
        setInspections([]);
      }
    } catch (err) {
      console.error('Inspection fetch exception:', err);
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshInspections();
  }, [user]);

  const addInspection = async (newInspection: Inspection) => {
    const updated = [newInspection, ...inspections];
    setInspections(updated);
    setCurrentInspection(newInspection);

    if (!isSupabaseConfigured()) {
      localStorage.setItem('packcheck_local_inspections', JSON.stringify(updated));
      return;
    }

    try {
      const { error } = await supabase.from('inspections').insert([newInspection]);
      if (error) {
        console.error('Error inserting inspection into Supabase:', error);
        localStorage.setItem('packcheck_local_inspections', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Exception inserting inspection:', err);
    }
  };

  const getInspectionById = (id: string) => {
    return inspections.find((item) => item.id === id);
  };

  return (
    <InspectionContext.Provider
      value={{
        inspections,
        currentInspection,
        loading,
        setCurrentInspection,
        addInspection,
        getInspectionById,
        refreshInspections,
      }}
    >
      {children}
    </InspectionContext.Provider>
  );
};

export const useInspectionContext = () => {
  const context = useContext(InspectionContext);
  if (!context) {
    throw new Error('useInspectionContext must be used within an InspectionProvider');
  }
  return context;
};
