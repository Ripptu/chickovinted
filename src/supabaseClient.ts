/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  setDoc, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { Listing } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Export same configuration flag for real-time live database support notification in UI
export const isSupabaseConfigured = true;

// Custom info text matching our Firestore architecture
export const SQL_SCHEMA = `-- Firebase Cloud Firestore ist aktiv.
Alle Daten werden im Google Cloud-Rechenzentrum sicher und dauerhaft gespeichert.
Egal mit welchem Handy du die Seite aufrufst, du hast immer denselben aktuellen Datenbestand.`;

// Safe simple fallback UUID generator for secure/insecure iframe context
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Seed data to make the UI look rich and professional from the start if Firestore is empty
const SEED_LISTINGS: Omit<Listing, 'id'>[] = [
  {
    title: 'Vintage Nike Windbreaker Green',
    listing_price: 65.0,
    storage_location: 'Regal A-2',
    status: 'Sold',
    buying_cost: 15.0,
    sold_price: 58.0,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    sold_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    title: 'Carhartt Double Knee Pants Brown',
    listing_price: 85.0,
    storage_location: 'Kiste B',
    status: 'Sold',
    buying_cost: 22.0,
    sold_price: 75.0,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    sold_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    title: 'Stussy Champion Co-Branded Fleece',
    listing_price: 110.0,
    storage_location: 'Fach 4',
    status: 'Listed',
    buying_cost: null,
    sold_price: null,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    sold_at: null,
  },
  {
    title: 'Vintage Adidas Spellout Sweatshirt',
    listing_price: 45.0,
    storage_location: 'Regal B-1',
    status: 'Sold',
    buying_cost: 8.0,
    sold_price: 40.0,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    sold_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    title: 'Prada Sport Nylon Cap Black',
    listing_price: 150.0,
    storage_location: 'Schrank 1',
    status: 'Listed',
    buying_cost: null,
    sold_price: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    sold_at: null,
  },
];

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getListings = async (): Promise<Listing[]> => {
  try {
    const q = query(collection(db, 'listings'), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    // If the database has absolutely zero items, seed it with initial examples
    if (querySnapshot.empty) {
      const seeded: Listing[] = [];
      for (const rawSeed of SEED_LISTINGS) {
        const itemUuid = generateUUID();
        try {
          await setDoc(doc(db, 'listings', itemUuid), rawSeed);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `listings/${itemUuid}`);
        }
        seeded.push({
          id: itemUuid,
          ...rawSeed
        });
      }
      return seeded;
    }

    const result: Listing[] = [];
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      result.push({
        id: docSnapshot.id,
        title: data.title || '',
        listing_price: Number(data.listing_price) || 0,
        storage_location: data.storage_location || 'Unbekannt',
        status: data.status || 'Listed',
        buying_cost: data.buying_cost !== undefined && data.buying_cost !== null ? Number(data.buying_cost) : null,
        sold_price: data.sold_price !== undefined && data.sold_price !== null ? Number(data.sold_price) : null,
        created_at: data.created_at || new Date().toISOString(),
        sold_at: data.sold_at || null,
      });
    });
    return result;
  } catch (error) {
    // If we already handled in inner block, rethrow; otherwise route it
    if (error instanceof Error && error.message.startsWith('{') && error.message.endsWith('}')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.LIST, 'listings');
    return [];
  }
};

export const addListing = async (
  title: string,
  listingPrice: number,
  storageLocation: string
): Promise<Listing> => {
  const newId = generateUUID();
  const created_at = new Date().toISOString();
  const newListing: Omit<Listing, 'id'> = {
    title,
    listing_price: listingPrice,
    storage_location: storageLocation,
    status: 'Listed',
    buying_cost: null,
    sold_price: null,
    created_at,
    sold_at: null,
  };
  
  try {
    await setDoc(doc(db, 'listings', newId), newListing);
    return {
      id: newId,
      ...newListing
    };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, `listings/${newId}`);
    throw error;
  }
};

export const markAsSold = async (
  id: string,
  buyingCost: number,
  soldPrice: number
): Promise<Listing> => {
  const soldAt = new Date().toISOString();
  const docRef = doc(db, 'listings', id);
  
  try {
    await updateDoc(docRef, {
      status: 'Sold',
      buying_cost: buyingCost,
      sold_price: soldPrice,
      sold_at: soldAt,
    });
    
    return {
      id,
      title: '', 
      listing_price: 0,
      storage_location: '',
      status: 'Sold',
      buying_cost: buyingCost,
      sold_price: soldPrice,
      created_at: '',
      sold_at: soldAt,
    };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.UPDATE, `listings/${id}`);
    throw error;
  }
};

export const deleteListing = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'listings', id));
    return true;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.DELETE, `listings/${id}`);
    throw error;
  }
};
