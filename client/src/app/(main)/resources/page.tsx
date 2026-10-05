'use client';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';

import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Filter, AlertTriangle, CheckCircle2, ShieldAlert, Wrench, Send, RefreshCw, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Resource } from '@/types';
import { getAllResources, createResource, updateResource, deleteResource, allocateResource, releaseResource } from '@/lib/resources';
import { getAllIncidents } from '@/lib/incidents';
import { RESOURCE_CATEGORIES, RESOURCE_STATUSES } from '@/lib/constants';

export default function ResourcesPage() {
  const { user } = useAuth();
  const isAuthorityOrAdmin = user?.role === 'authority' || user?.role === 'admin';

  const [resources, setResources] = useState<Resource[]>([]);
  const [incidents, setIncidents] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState<Resource | null>(null);
  const [showEditModal, setShowEditModal] = useState<Resource | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: RESOURCE_CATEGORIES[0],
    quantity: 100,
    unit: 'units',
    locationAddress: '',
  });

  const [allocateData, setAllocateData] = useState({
    incidentId: '',
    quantity: 10,
    notes: '',
  });

  const [editData, setEditData] = useState({
    name: '',
    category: '',
    quantity: 0,
    unit: '',
    status: 'AVAILABLE',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchResources = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAllResources({
        category: selectedCategory || undefined,
        status: selectedStatus || undefined,
      });
      setResources(data.resources || []);
      if (isAuthorityOrAdmin) {
        const data = await getAllIncidents();
        setIncidents(data.incidents.filter(i => i.approvalStatus === 'APPROVED' && ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'].includes(i.status)).map(i => ({ id: i.id, title: i.title })));
      }
    } catch (err) {
      console.error('Failed to fetch resources', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, isAuthorityOrAdmin]);

  useLiveRefresh(() => fetchResources(true), Boolean(user));

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);


  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await createResource({
        name: formData.name,
        category: formData.category,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        location: formData.locationAddress ? { address: formData.locationAddress } : undefined,
      });
      setShowCreateModal(false);
      setFormData({ name: '', category: RESOURCE_CATEGORIES[0], quantity: 100, unit: 'units', locationAddress: '' });
      await fetchResources();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAllocateModal) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      await allocateResource(showAllocateModal.id, {
        incidentId: allocateData.incidentId,
        quantity: Number(allocateData.quantity),
        notes: allocateData.notes,
      });
      setShowAllocateModal(null);
      setAllocateData({ incidentId: '', quantity: 10, notes: '' });
      await fetchResources();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to allocate resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      await updateResource(showEditModal.id, {
        name: editData.name,
        category: editData.category,
        quantity: Number(editData.quantity),
        unit: editData.unit,
        status: editData.status as any,
      });
      setShowEditModal(null);
      await fetchResources();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async (resourceId: string, incidentId: string) => {
    if (!confirm('Are you sure you want to release this resource allocation?')) return;
    try {
      await releaseResource(resourceId, { incidentId });
      await fetchResources();
    } catch (err) {
      console.error('Failed to release allocation', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteResource(id);
      await fetchResources();
    } catch (err) {
      console.error('Failed to delete resource', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 size={12} /> Available</Badge>;
      case 'LOW_STOCK':
        return <Badge variant="warning" className="flex items-center gap-1"><AlertTriangle size={12} /> Low Stock</Badge>;
      case 'DEPLETED':
        return <Badge variant="danger" className="flex items-center gap-1"><ShieldAlert size={12} /> Depleted</Badge>;
      case 'MAINTENANCE':
        return <Badge className="bg-slate-700 text-slate-300 flex items-center gap-1"><Wrench size={12} /> Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Package className="text-orange-500" size={26} />
            Emergency Resource Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track disaster supplies, emergency equipment, and allocation dispatches.
          </p>
        </div>

        {isAuthorityOrAdmin && (
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600">
            <Plus size={16} /> Add Resource
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4 bg-slate-900/80 border-slate-800 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Filter size={16} />
          <span>Filter by:</span>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-orange-500"
        >
          <option value="">All Categories</option>
          {RESOURCE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-orange-500"
        >
          <option value="">All Statuses</option>
          {RESOURCE_STATUSES.map((st) => (
            <option key={st} value={st}>{st.replace('_', ' ')}</option>
          ))}
        </select>

        <Button variant="ghost" size="sm" onClick={() => fetchResources()} className="ml-auto text-slate-400 hover:text-white">
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
      </Card>

      {/* Resource Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading resources inventory…</div>
      ) : resources.length === 0 ? (
        <Card className="text-center py-16 text-slate-400 bg-slate-900/50">
          <Package className="mx-auto text-slate-600 mb-3" size={36} />
          <p className="text-sm font-medium">No resources found matching filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((item) => {
            const isAvailable = item.status === 'AVAILABLE' || item.status === 'LOW_STOCK';
            return (
              <Card key={item.id} className="bg-slate-900 border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs text-orange-400 font-semibold uppercase tracking-wider block mb-0.5">
                        {item.category}
                      </span>
                      <h3 className="text-lg font-bold text-white">{item.name}</h3>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Stock bar */}
                  <div className="my-4 space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">Available / Total</span>
                      <span className="text-white font-mono">
                        {item.availableQuantity} / {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.status === 'AVAILABLE'
                            ? 'bg-emerald-500'
                            : item.status === 'LOW_STOCK'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, (item.availableQuantity / item.quantity) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {item.location?.address && (
                    <p className="text-xs text-slate-400 mb-3">
                      📍 <span className="text-slate-300">{item.location.address}</span>
                    </p>
                  )}

                  {/* Allocations list */}
                  {item.allocations && item.allocations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                      <p className="text-xs text-slate-400 font-semibold">Active Incident Allocations:</p>
                      {item.allocations.map((alloc, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-slate-800/60 p-2 rounded border border-slate-800">
                          <div>
                            <p className="text-slate-200 font-medium truncate max-w-[170px]">
                              {alloc.incidentTitle || `Incident #${alloc.incidentId.slice(-6)}`}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Qty: {alloc.quantity} {item.unit}
                            </p>
                          </div>
                          {isAuthorityOrAdmin && (
                            <button
                              onClick={() => handleRelease(item.id, alloc.incidentId)}
                              className="text-slate-400 hover:text-amber-400 text-[10px] underline ml-2"
                              title="Release allocation"
                            >
                              Release
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isAuthorityOrAdmin && (
                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      disabled={!isAvailable || item.availableQuantity <= 0}
                      onClick={() => {
                        setShowAllocateModal(item);
                        setAllocateData({ incidentId: incidents[0]?.id || '', quantity: Math.min(10, item.availableQuantity), notes: '' });
                      }}
                      className="flex-1 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 text-xs"
                    >
                      <Send size={12} className="mr-1.5" /> Allocate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowEditModal(item);
                        setEditData({
                          name: item.name,
                          category: item.category,
                          quantity: item.quantity,
                          unit: item.unit,
                          status: item.status,
                        });
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Create Resource */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700 p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="text-orange-500" size={20} /> Add New Emergency Resource
            </h2>

            {errorMsg && <p className="text-xs text-rose-400 bg-rose-950/50 p-2 rounded border border-rose-800">{errorMsg}</p>}

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resource Item Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. High-Capacity Water Pumps"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    {RESOURCE_CATEGORIES.map((c: any) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Type</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="units, liters, boxes"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Total Quantity</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Storage Depot Location</label>
                <input
                  type="text"
                  value={formData.locationAddress}
                  onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                  placeholder="e.g. Central Warehouse Depot #3"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-600">
                  {submitting ? 'Creating…' : 'Create Resource'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Allocate Resource */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700 p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Send className="text-orange-500" size={20} /> Allocate "{showAllocateModal.name}"
            </h2>

            <p className="text-xs text-slate-400">
              Available Inventory: <strong className="text-emerald-400 font-mono">{showAllocateModal.availableQuantity} {showAllocateModal.unit}</strong>
            </p>

            {errorMsg && <p className="text-xs text-rose-400 bg-rose-950/50 p-2 rounded border border-rose-800">{errorMsg}</p>}

            <form onSubmit={handleAllocateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Active Incident</label>
                <select
                  required
                  value={allocateData.incidentId}
                  onChange={(e) => setAllocateData({ ...allocateData, incidentId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Select an incident…</option>
                  {incidents.map((inc) => (
                    <option key={inc.id} value={inc.id}>{inc.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Allocation Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={showAllocateModal.availableQuantity}
                  required
                  value={allocateData.quantity}
                  onChange={(e) => setAllocateData({ ...allocateData, quantity: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dispatch Notes</label>
                <input
                  type="text"
                  value={allocateData.notes}
                  onChange={(e) => setAllocateData({ ...allocateData, notes: e.target.value })}
                  placeholder="e.g. Dispatched with Response Team Alpha"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button type="button" variant="ghost" onClick={() => setShowAllocateModal(null)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-600">
                  {submitting ? 'Allocating…' : 'Dispatch Allocation'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Edit Resource */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700 p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Edit className="text-orange-500" size={20} /> Edit Resource Details
            </h2>

            {errorMsg && <p className="text-xs text-rose-400 bg-rose-950/50 p-2 rounded border border-rose-800">{errorMsg}</p>}

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editData.quantity}
                    onChange={(e) => setEditData({ ...editData, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status Override</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    {RESOURCE_STATUSES.map((st) => (
                      <option key={st} value={st}>{st.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button type="button" variant="ghost" onClick={() => setShowEditModal(null)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-600">
                  {submitting ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
