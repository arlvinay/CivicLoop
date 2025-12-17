import { CollectionRecord, BreakdownRecord } from '../types';
import { db } from '../services/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

const BOX_NAME = 'civicloop_waste_box';
const BREAKDOWN_BOX_NAME = 'civicloop_breakdown_box';
const FIRESTORE_COLLECTION = 'waste_collections';

export class WasteRepository {
  
  // --- Waste Collection Box ---
  private get _box(): CollectionRecord[] {
    try {
      const data = localStorage.getItem(BOX_NAME);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Hive Box Read Error", e);
      return [];
    }
  }

  private set _box(data: CollectionRecord[]) {
    try {
      localStorage.setItem(BOX_NAME, JSON.stringify(data));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error("Hive Box Write Error", e);
    }
  }

  // --- Breakdown Box ---
  private get _breakdownBox(): BreakdownRecord[] {
    try {
      const data = localStorage.getItem(BREAKDOWN_BOX_NAME);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  private set _breakdownBox(data: BreakdownRecord[]) {
    localStorage.setItem(BREAKDOWN_BOX_NAME, JSON.stringify(data));
    window.dispatchEvent(new Event('storage'));
  }

  /**
   * Saves a collection record locally (Hive).
   */
  async saveCollection(record: CollectionRecord): Promise<void> {
    const currentBox = this._box;
    currentBox.push(record);
    this._box = currentBox;
    console.log(`Saved record ${record.collection_id} to local box.`);
  }

  /**
   * Saves a breakdown report locally.
   */
  async saveBreakdown(record: BreakdownRecord): Promise<void> {
    const current = this._breakdownBox;
    current.push(record);
    this._breakdownBox = current;
    console.log(`Saved breakdown ${record.id} locally.`);
  }

  /**
   * Pushes all unsynced data (waste + breakdowns) to Firestore.
   */
  async syncPending(): Promise<number> {
    const allRecords = this._box;
    const pendingRecords = allRecords.filter(r => !r.is_synced);

    const allBreakdowns = this._breakdownBox;
    const pendingBreakdowns = allBreakdowns.filter(r => !r.is_synced);

    if (pendingRecords.length === 0 && pendingBreakdowns.length === 0) {
      return 0;
    }

    try {
      // SIMULATION FOR DEMO
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update local records to synced
      if (pendingRecords.length > 0) {
        const updatedRecords = allRecords.map(r => {
          if (!r.is_synced) return { ...r, is_synced: true };
          return r;
        });
        this._box = updatedRecords;
      }

      // Update breakdowns to synced
      if (pendingBreakdowns.length > 0) {
        const updatedBreakdowns = allBreakdowns.map(r => {
          if (!r.is_synced) return { ...r, is_synced: true };
          return r;
        });
        this._breakdownBox = updatedBreakdowns;
      }

      return pendingRecords.length + pendingBreakdowns.length;

    } catch (error) {
      console.error("Sync failed:", error);
      throw error;
    }
  }

  getUnsyncedCount(): number {
    const wasteCount = this._box.filter(r => !r.is_synced).length;
    const breakdownCount = this._breakdownBox.filter(r => !r.is_synced).length;
    return wasteCount + breakdownCount;
  }

  getAllRecords(): CollectionRecord[] {
    return this._box;
  }

  clearSyncedRecords(): void {
    const unsynced = this._box.filter(r => !r.is_synced);
    this._box = unsynced;
    
    // Also clear synced breakdowns to save space
    const unsyncedBreakdowns = this._breakdownBox.filter(r => !r.is_synced);
    this._breakdownBox = unsyncedBreakdowns;
  }
}

export const wasteRepository = new WasteRepository();