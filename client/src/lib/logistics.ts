import api from './api';
export interface Storage { _id: string; name: string; kind: 'WAREHOUSE' | 'SHELTER'; shelterId?: string; address: string; latitude: number; longitude: number; }
export interface Need { _id: string; shelterId: string; item: string; category: string; unit: string; requested: number; committed: number; fulfilled: number; shortage: number; urgency: string; }
export interface Transfer { _id: string; needId: string; resourceId: string; shelterId: string; quantity: number; status: 'RESERVED' | 'DISPATCHED' | 'RECEIVED' | 'CANCELLED' | 'SETTLED'; receivedQuantity?: number; returnedQuantity?: number; damagedQuantity?: number; createdAt: string; }
export interface Stock { _id: string; shelterId: string; resourceId: string; quantity: number; consumed: number; }
export interface Movement { _id: string; action: string; resourceId: string; shelterId: string; quantity: number; notes?: string; createdAt: string; }
export interface LogisticsData { storage: Storage[]; needs: Need[]; transfers: Transfer[]; stock: Stock[]; ledger: Movement[]; }
export interface Suggestions { need: Need; shelter: { id: string; name: string; address?: string; status: string }; shortage: number; uncovered: number; calculatedAt: string; distanceNote: string; suggestions: { resourceId: string; name: string; unit: string; available: number; storageName: string; address: string; distanceKm: number; suggestedQuantity: number }[]; }
export const getLogistics = async (shelterId?: string): Promise<LogisticsData> => (await api.get('/logistics', { params: shelterId ? { shelterId } : undefined })).data;
export const getSuggestions = async (id: string): Promise<Suggestions> => (await api.get('/logistics/needs/' + id + '/suggestions')).data;
export const postLogistics = async (path: string, body: unknown) => (await api.post('/logistics/' + path, body)).data;
export const changeTransfer = async (id: string, status: string, details: { quantity?: number; requestKey?: string; notes?: string } = {}) => (await api.patch('/logistics/transfers/' + id, { status, ...details })).data;
