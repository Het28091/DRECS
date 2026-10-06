import api from './api';
export interface Storage { _id: string; name: string; kind: 'WAREHOUSE' | 'SHELTER'; shelterId?: string; address: string; latitude: number; longitude: number; }
export interface Need { _id: string; shelterId: string; item: string; category: string; unit: string; requested: number; committed: number; fulfilled: number; shortage: number; urgency: string; }
export interface Transfer { _id: string; needId: string; resourceId: string; shelterId: string; quantity: number; status: 'RESERVED' | 'DISPATCHED' | 'RECEIVED' | 'CANCELLED'; createdAt: string; }
export interface Stock { _id: string; shelterId: string; resourceId: string; quantity: number; consumed: number; }
export interface Movement { _id: string; action: string; resourceId: string; shelterId: string; quantity: number; notes?: string; createdAt: string; }
export interface LogisticsData { storage: Storage[]; needs: Need[]; transfers: Transfer[]; stock: Stock[]; ledger: Movement[]; }
export interface Suggestions { need: Need; shelter: { id: string; name: string; address?: string; status: string }; shortage: number; uncovered: number; calculatedAt: string; distanceNote: string; suggestions: { resourceId: string; name: string; unit: string; available: number; storageName: string; address: string; distanceKm: number; suggestedQuantity: number }[]; }
export interface AssistantAnswer { answer: string; generatedAt: string; notice: string; records: { id: string; label: string; href: string }[]; selected: Suggestions | null; }
export const getLogistics = async (): Promise<LogisticsData> => (await api.get('/logistics')).data;
export const getSuggestions = async (id: string): Promise<Suggestions> => (await api.get('/logistics/needs/' + id + '/suggestions')).data;
export const postLogistics = async (path: string, body: unknown) => (await api.post('/logistics/' + path, body)).data;
export const changeTransfer = async (id: string, status: string) => (await api.patch('/logistics/transfers/' + id, { status })).data;
export const getAssistantStatus = async (): Promise<{ configured: boolean }> => (await api.get('/logistics/assistant')).data;
export const askAssistant = async (question: string, needId?: string): Promise<AssistantAnswer> => (await api.post('/logistics/assistant', { question, needId })).data;
