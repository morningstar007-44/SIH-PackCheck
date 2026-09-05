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

const LS_KEY = 'packcheck_inspections';

function loadLocalInspections(): Inspection[] {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveLocalInspections(inspections: Inspection[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(inspections));
  } catch {}
}

export const InspectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [currentInspection, setCurrentInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshInspections = async () => {
    setLoading(true);

    // Always start with localStorage data so nothing is ever lost
    const localData = loadLocalInspections();
    let mergedInspections = [...localData];

    // Try to fetch from Supabase if configured and user is authenticated
    if (isSupabaseConfigured() && user) {
      try {
        const { data, error } = await supabase
          .from('inspections')
          .select('*')
          .order('inspection_date', { ascending: false });

        if (!error && data && data.length > 0) {
          // Merge: Supabase data takes priority, add any local-only records
          const supabaseIds = new Set(data.map((d: any) => d.id));
          const localOnly = localData.filter((item) => !supabaseIds.has(item.id));
          mergedInspections = [...(data as Inspection[]), ...localOnly];
        }
      } catch (err) {
        console.warn('Supabase inspections fetch error (using local data):', err);
      }
    }

    // Sort by date descending
    mergedInspections.sort((a, b) => 
      new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime()
    );

    setInspections(mergedInspections);
    saveLocalInspections(mergedInspections);
    setLoading(false);
  };

  useEffect(() => {
    refreshInspections();
  }, [user]);

  const addInspection = async (newInspection: Inspection) => {
    const updated = [newInspection, ...inspections];
    setInspections(updated);
    setCurrentInspection(newInspection);

    // Always save to localStorage first — this is the safety net
    saveLocalInspections(updated);

    // Then try Supabase
    if (isSupabaseConfigured() && user) {
      try {
        const { error } = await supabase.from('inspections').insert([newInspection]);
        if (error) {
          console.warn('Supabase inspection insert error (saved locally):', error.message);
        }
      } catch (err) {
        console.warn('Supabase inspection insert exception (saved locally):', err);
      }
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
