import { wasteRepository } from '../repositories/WasteRepository';
import { CollectionRecord } from '../types';

// Bridge to new Repository
export const saveRecord = (record: CollectionRecord) => wasteRepository.saveCollection(record);
export const getRecords = () => wasteRepository.getAllRecords();
export const getUnsyncedCount = () => wasteRepository.getUnsyncedCount();
export const markAllAsSynced = async () => { await wasteRepository.syncPending(); };
export const clearSyncedRecords = () => wasteRepository.clearSyncedRecords();