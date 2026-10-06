'use client';
import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ErrorNotice } from '@/components/ui/ErrorNotice';
import { getAllResources } from '@/lib/resources';
import { fetchShelters } from '@/lib/shelters';
import { RESOURCE_CATEGORIES } from '@/lib/constants';
import { Resource, Shelter } from '@/types';
import { LogisticsData, Suggestions, AssistantAnswer, getLogistics, getSuggestions, postLogistics, changeTransfer, askAssistant, getAssistantStatus } from '@/lib/logistics';
const Picker = dynamic(() => import('@/components/map/LocationPicker'), { ssr: false });
const input = 'w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm';
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block space-y-1 text-sm text-slate-300"><span>{label}</span>{children}</label>; }
const empty: LogisticsData = { storage: [], needs: [], transfers: [], stock: [], ledger: [] };
const tabs = ['Needs', 'Storage', 'Transfers', 'Shelter stock', 'Assistant'] as const;
type Tab = typeof tabs[number];
type Confirmation = { title: string; detail: string; path?: string; body?: Record<string, unknown>; transferId?: string; status?: string; quantity?: number; maximum?: number; consumption?: boolean };
function errorMessage(error: unknown) { const e = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }; return Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || 'Request failed. Check your connection and retry.'; }
export default function SuppliesPage() {
  const { user, isLoading: authLoading } = useAuth(); const router = useRouter();
  const allowed = user?.role === 'authority' || user?.role === 'admin';
  const [tab, setTab] = useState<Tab>('Needs'); const [data, setData] = useState(empty);
  const [resources, setResources] = useState<(Resource & { storageId?: string })[]>([]); const [shelters, setShelters] = useState<Shelter[]>([]);
  const loadSequence = useRef(0);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null); const [quantity, setQuantity] = useState(1); const [note, setNote] = useState('');
  const [storage, setStorage] = useState({ name: '', kind: 'WAREHOUSE', shelterId: '', address: '' }); const [point, setPoint] = useState<[number,number] | null>(null);
  const [binding, setBinding] = useState({ resourceId: '', storageId: '' });
  const [need, setNeed] = useState({ shelterId: '', item: '', category: 'Water', unit: 'bottles', requested: 100, urgency: 'NORMAL', notes: '' });
  const [configured, setConfigured] = useState(false); const [question, setQuestion] = useState(''); const [contextNeed, setContextNeed] = useState(''); const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const load = useCallback(async () => {
    if (!allowed) return;
    const sequence = ++loadSequence.current;
    try { const [logistics, inventory, locations, ai] = await Promise.all([getLogistics(), getAllResources(), fetchShelters(), getAssistantStatus()]); if (sequence !== loadSequence.current) return; setData(logistics); setResources(inventory.resources); setShelters(locations); setConfigured(ai.configured); }
    catch (e) { if (sequence === loadSequence.current) setError(errorMessage(e)); } finally { if (sequence === loadSequence.current) setLoading(false); }
  }, [allowed]);
  useEffect(() => { if (!authLoading && !allowed) router.replace('/dashboard'); if (allowed) void load(); }, [authLoading, allowed, load, router]);
  useLiveRefresh(load, allowed);
  const shelterName = (id: string) => shelters.find(s => s.id === id)?.name || id;
  const resourceName = (id: string) => { const r = resources.find(r => r.id === id); return r ? r.name + ' (' + r.unit + ')' : id; };
  const activeShelters = shelters.filter(s => s.status !== 'INACTIVE');
  async function act(work: () => Promise<unknown>, message: string) {
    if (lock.current) return; lock.current = true; setBusy(true); setError(''); setSuccess('');
    try { await work(); setConfirmation(null); setSuccess(message); setSuggestions(null); await load(); }
    catch (e) { setError(errorMessage(e)); } finally { lock.current = false; setBusy(false); }
  }
  function confirm(value: Confirmation) { setError(''); setNote(''); setQuantity(value.quantity || 1); setConfirmation(value); }
  async function showSuggestions(id: string) { if (lock.current) return; lock.current = true; setBusy(true); setError(''); setSuggestions(null); try { setSuggestions(await getSuggestions(id)); } catch(e) { setError(errorMessage(e)); } finally { lock.current = false; setBusy(false); } }
  async function submitStorage(e: FormEvent) {
    e.preventDefault(); const selected = shelters.find(s => s.id === storage.shelterId); const location = storage.kind === 'SHELTER' && selected ? [selected.location.latitude, selected.location.longitude] : point;
    if (!location) { setError('Select the storage location on the map.'); return; }
    await act(async () => { await postLogistics('storage', { ...storage, shelterId: storage.kind === 'SHELTER' ? storage.shelterId : undefined, latitude: location[0], longitude: location[1] }); setStorage({ name: '', kind: 'WAREHOUSE', shelterId: '', address: '' }); setPoint(null); }, 'Storage location created. Link inventory below.');
  }
  async function sendQuestion(e: FormEvent) {
    e.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setError(''); setAnswer(null);
    try { setAnswer(await askAssistant(question, contextNeed || undefined)); } catch(e) { setError(errorMessage(e)); } finally { lock.current = false; setBusy(false); }
  }
  if (!allowed || loading) return <p role="status" className="text-slate-400">Loading supply coordination…</p>;
  return <div className="max-w-6xl mx-auto space-y-5">
    <div><h1 className="text-2xl font-bold">Shelter supply coordination</h1><p className="mt-1 text-sm text-slate-400">Record demand, reserve inventory, confirm deliveries and track consumption.</p></div>
    {error && !confirmation && <ErrorNotice message={error} onRetry={() => { setError(''); void load(); }} />}
    {success && <p role="status" className="rounded-lg bg-emerald-950/40 border border-emerald-800 p-3 text-emerald-300">{success}</p>}
    <nav aria-label="Supply sections" className="flex flex-wrap gap-2">{tabs.map(t => <Button key={t} variant={tab === t ? 'primary' : 'outline'} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</Button>)}</nav>
    {tab === 'Needs' && <>
      <Card><h2 className="font-semibold mb-3">Record a shelter request</h2><p className="text-sm text-slate-400 mb-4">Use the exact inventory item name and unit for matching. Each request is additional demand; account for existing shelter stock first.</p>
      <form onSubmit={e => { e.preventDefault(); void act(async () => { await postLogistics('needs', need); setNeed({ ...need, item: '', notes: '' }); }, 'Shelter need recorded.'); }} className="grid sm:grid-cols-2 gap-3">
        <Field label="Destination shelter"><select required className={input} value={need.shelterId} onChange={e => setNeed({...need,shelterId:e.target.value})}><option value="">Select shelter</option>{activeShelters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Item"><input required minLength={2} maxLength={120} list="supply-items" className={input} value={need.item} onChange={e => setNeed({...need,item:e.target.value})}/><datalist id="supply-items">{resources.map(r => <option key={r.id} value={r.name}/>)}</datalist></Field>
        <Field label="Category"><select className={input} value={need.category} onChange={e => setNeed({...need,category:e.target.value})}>{RESOURCE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Unit (exactly as inventory)"><input required maxLength={40} className={input} value={need.unit} onChange={e => setNeed({...need,unit:e.target.value})}/></Field>
        <Field label="Requested quantity"><input type="number" required min={1} max={1000000000} step={1} className={input} value={need.requested} onChange={e => setNeed({...need,requested:Number(e.target.value)})}/></Field>
        <Field label="Urgency"><select className={input} value={need.urgency} onChange={e => setNeed({...need,urgency:e.target.value})}>{['NORMAL','HIGH','CRITICAL'].map(u => <option key={u}>{u}</option>)}</select></Field>
        <Field label="Request notes"><input maxLength={500} className={input} value={need.notes} onChange={e => setNeed({...need,notes:e.target.value})}/></Field><Button type="submit" loading={busy}>Record need</Button>
      </form></Card>
      {!data.needs.length && <Card>No shelter requests yet.</Card>}
      <div className="grid md:grid-cols-2 gap-3">{data.needs.map(n => <Card key={n._id}><h3 className="font-semibold">{shelterName(n.shelterId)} · {n.item}</h3><p className="text-sm text-slate-300 my-2">Requested {n.requested} · Received {n.fulfilled} · Committed {n.committed} {n.unit}</p><p className="text-amber-300 mb-3">Uncommitted shortage: {n.shortage} {n.unit} · {n.urgency}</p><Button disabled={busy || !n.shortage} onClick={() => void showSuggestions(n._id)}>Find nearby stock</Button><p className="text-xs text-slate-500 mt-2">Request {n._id}</p></Card>)}</div>
      {suggestions && <Card><h2 className="font-semibold">Suggestions for {suggestions.shelter.name}</h2><p className="text-sm text-slate-400">{suggestions.distanceNote}</p><p className="my-2">Shortage: {suggestions.shortage}; still uncovered after suggested reservations: {suggestions.uncovered} {suggestions.need.unit}</p>
        {!suggestions.suggestions.length && <p>No matching stock at a different active storage location. Check item name, category, unit and storage links.</p>}
        {suggestions.suggestions.map(s => <div key={s.resourceId} className="border-t border-slate-700 py-3 flex flex-wrap justify-between gap-3"><div><p>{s.storageName} — {s.distanceKm} km</p><p className="text-sm text-slate-400">{s.address} · Available {s.available} {s.unit} · Suggested {s.suggestedQuantity}</p></div><Button disabled={busy || !s.suggestedQuantity} onClick={() => confirm({ title:'Confirm stock reservation', detail: s.name + ' from ' + s.storageName + ' to ' + suggestions.shelter.name + '. This reserves stock; it does not dispatch it.', path:'transfers', body:{needId:suggestions.need._id,resourceId:s.resourceId,requestKey:crypto.randomUUID()}, quantity:s.suggestedQuantity, maximum:Math.min(s.available,suggestions.shortage) })}>Review reservation</Button></div>)}
      </Card>}
    </>}
    {tab === 'Storage' && <>
      <Card><h2 className="font-semibold mb-3">Create storage location</h2><form onSubmit={submitStorage} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3"><Field label="Storage name"><input required minLength={2} maxLength={120} className={input} value={storage.name} onChange={e => setStorage({...storage,name:e.target.value})}/></Field><Field label="Storage type"><select className={input} value={storage.kind} onChange={e => setStorage({...storage,kind:e.target.value,shelterId:''})}><option value="WAREHOUSE">Warehouse</option><option value="SHELTER">Shelter storage</option></select></Field>
        {storage.kind === 'SHELTER' && <Field label="Linked shelter"><select required className={input} value={storage.shelterId} onChange={e => { const s=shelters.find(s=>s.id===e.target.value);setStorage({...storage,shelterId:e.target.value,address:s?.location.address||storage.address}); }}><option value="">Select shelter</option>{activeShelters.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>}
        <Field label="Storage address"><input required minLength={3} maxLength={300} className={input} value={storage.address} onChange={e=>setStorage({...storage,address:e.target.value})}/></Field></div>
        {storage.kind === 'WAREHOUSE' ? <Picker value={point} onChange={value => { setPoint(value); setError(''); }}/> : <p className="text-sm text-slate-400">Coordinates come from the selected shelter.</p>}
        <Button type="submit" loading={busy}>Create storage</Button>
      </form></Card>
      <Card><h2 className="font-semibold mb-3">Link existing inventory</h2><p className="text-sm text-slate-400 mb-3">Create inventory in Resources first. Each inventory lot has one fixed source location; linking preserves its current quantity.</p><form className="grid sm:grid-cols-3 gap-3" onSubmit={e=>{e.preventDefault();void act(()=>postLogistics('storage/link',binding),'Inventory linked to storage.');}}>
        <Field label="Unlinked resource"><select required className={input} value={binding.resourceId} onChange={e=>setBinding({...binding,resourceId:e.target.value})}><option value="">Select resource</option>{resources.filter(r=>!r.storageId).map(r=><option key={r.id} value={r.id}>{r.name} ({r.unit})</option>)}</select></Field><Field label="Source storage"><select required className={input} value={binding.storageId} onChange={e=>setBinding({...binding,storageId:e.target.value})}><option value="">Select storage</option>{data.storage.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}</select></Field><Button type="submit" loading={busy}>Link inventory</Button>
      </form><Link href="/resources" className="inline-block text-orange-300 underline mt-3">Open resource inventory</Link></Card>
      {data.storage.map(s=><Card key={s._id}><h3 className="font-semibold">{s.name} · {s.kind}</h3><p className="text-sm text-slate-400">{s.address}</p><ul className="mt-2 text-sm">{resources.filter(r=>r.storageId===s._id).map(r=><li key={r.id}>{r.name}: {r.availableQuantity} available / {r.quantity} {r.unit}</li>)}</ul></Card>)}
    </>}
    {tab === 'Transfers' && <><p className="text-sm text-slate-400">Reserve first, dispatch when goods leave storage, then confirm receipt only when delivered. Cancellation is available before dispatch.</p>{!data.transfers.length && <Card>No transfers yet. Find stock from a shelter request to begin.</Card>}{data.transfers.map(t=><Card key={t._id} className="space-y-3"><h2 className="font-semibold">{resourceName(t.resourceId)} → {shelterName(t.shelterId)}</h2><p>{t.quantity} · {t.status}</p><div className="flex gap-2">{(t.status==='RESERVED'?['DISPATCHED','CANCELLED']:t.status==='DISPATCHED'?['RECEIVED']:[]).map(status=><Button key={status} disabled={busy} variant={status==='CANCELLED'?'danger':'outline'} onClick={()=>confirm({title:'Confirm '+status.toLowerCase(),detail:'Transfer '+t._id+': '+t.quantity+' '+resourceName(t.resourceId)+'. '+(status==='RECEIVED'?'Confirm physical delivery to the shelter.':status==='DISPATCHED'?'This removes the shipment from source inventory.':'This releases the stock reservation.'),transferId:t._id,status})}>{status==='DISPATCHED'?'Confirm dispatch':status==='RECEIVED'?'Confirm receipt':'Cancel reservation'}</Button>)}</div><p className="text-xs text-slate-500">{t._id}</p></Card>)}</>}
    {tab === 'Shelter stock' && <>
      <p className="text-sm text-slate-400">These balances represent received goods. Consumption reduces on-hand stock; it does not reopen a fulfilled request.</p>
      {!data.stock.length && <Card>No deliveries have been received yet.</Card>}{data.stock.map(s=><Card key={s._id} className="space-y-2"><h2 className="font-semibold">{shelterName(s.shelterId)} · {resourceName(s.resourceId)}</h2><p>On hand: {s.quantity} · Consumed: {s.consumed}</p><Button disabled={busy||s.quantity===0} onClick={()=>confirm({title:'Record consumption',detail:'Record goods actually used at '+shelterName(s.shelterId)+'. This action creates a permanent ledger entry.',path:'consume',body:{stockId:s._id,requestKey:crypto.randomUUID()},quantity:1,maximum:s.quantity,consumption:true})}>Record consumption</Button></Card>)}
      <Card><h2 className="font-semibold mb-3">Latest 100 stock movements</h2><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr><th className="p-2">Date</th><th className="p-2">Action</th><th className="p-2">Shelter / Item</th><th className="p-2">Quantity / notes</th></tr></thead><tbody>{data.ledger.map(l=><tr key={l._id} className="border-t border-slate-800"><td className="p-2 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td><td className="p-2">{l.action}</td><td className="p-2">{shelterName(l.shelterId)} / {resourceName(l.resourceId)}</td><td className="p-2">{l.quantity} {l.notes}</td></tr>)}</tbody></table></div></Card>
    </>}
    {tab === 'Assistant' && <Card className="space-y-4"><h2 className="font-semibold">Contextual planning assistant</h2><p className="text-sm text-slate-400">Uses approved incidents, shelter capacity, demand, aggregate assignment counts and selected stock suggestions. Questions and a limited operational snapshot are sent to OpenAI. No volunteer phone numbers or email addresses are sent. It cannot change stock or statuses.</p>
      {!configured && <p role="status" className="text-amber-300">AI is not configured. Set OPENAI_API_KEY and OPENAI_MODEL on the server. Deterministic shortage suggestions remain available in Needs.</p>}
      <form onSubmit={sendQuestion} className="space-y-3"><Field label="Shelter request context (optional)"><select className={input} value={contextNeed} onChange={e=>setContextNeed(e.target.value)}><option value="">General overview</option>{data.needs.map(n=><option key={n._id} value={n._id}>{shelterName(n.shelterId)} — {n.item}</option>)}</select></Field><Field label="Your question"><textarea required minLength={3} maxLength={1200} rows={3} className={input} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Which recorded water shortage can we help with using nearby stock?"/></Field><Button type="submit" loading={busy} disabled={!configured}>Ask assistant</Button><p className="text-xs text-slate-400">20 questions per day; at least 10 seconds between requests.</p></form>
      {answer && <div className="space-y-3"><p className="whitespace-pre-wrap text-sm leading-relaxed">{answer.answer}</p><p className="text-xs text-amber-300">{answer.notice} Snapshot: {new Date(answer.generatedAt).toLocaleString()}</p>{answer.selected && <Button onClick={()=>{setTab('Needs');void showSuggestions(answer.selected!.need._id);}}>Review current stock suggestions</Button>}<details><summary className="cursor-pointer text-orange-300">Records included in this answer's context</summary><ul className="text-sm space-y-1 mt-2">{answer.records.map(r=><li key={r.id}><Link className="underline" href={r.href}>{r.label}</Link> <span className="text-slate-500">{r.id}</span></li>)}</ul></details></div>}
    </Card>}
    <Modal isOpen={!!confirmation} onClose={()=>setConfirmation(null)} title={confirmation?.title} busy={busy}>
      {confirmation && <form className="space-y-4" onSubmit={e=>{e.preventDefault();void act(()=>confirmation.transferId?changeTransfer(confirmation.transferId,confirmation.status!):postLogistics(confirmation.path!,{...confirmation.body,quantity,...(confirmation.consumption?{notes:note}:{})}), 'Supply record updated.');}}><p className="text-sm text-slate-300">{confirmation.detail}</p>{error&&<ErrorNotice message={error}/>}{confirmation.maximum!==undefined&&<Field label="Quantity"><input type="number" required min={1} max={confirmation.maximum} step={1} className={input} value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></Field>}{confirmation.consumption&&<Field label="Consumption reason"><textarea required minLength={3} maxLength={500} className={input} value={note} onChange={e=>setNote(e.target.value)}/></Field>}<div className="flex gap-3"><Button type="submit" loading={busy}>Confirm</Button><Button disabled={busy} onClick={()=>setConfirmation(null)} variant="outline">Cancel</Button></div></form>}
    </Modal>
  </div>;
}
