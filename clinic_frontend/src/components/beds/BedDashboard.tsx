import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bedService, Ward, Bed } from '@/services/bedService';
import { Plus, Users, BedDouble, Activity, CheckCircle, AlertCircle, LayoutGrid, List } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ButtonLoader } from '@/components/common/Loader';
import { WardList } from './WardList';
import { BedList } from './BedList';
import { BedRequestList } from './BedRequestList';

export const BedDashboard = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'wards' | 'beds' | 'requests'>('overview');

    const { data: wards, isLoading: wardsLoading } = useQuery({
        queryKey: ['wards'],
        queryFn: bedService.getWards,
    });

    const { data: beds, isLoading: bedsLoading } = useQuery({
        queryKey: ['beds'],
        queryFn: () => bedService.getBeds(),
    });

    const { data: requests } = useQuery({
        queryKey: ['bed-requests'],
        queryFn: bedService.getBedRequests,
    });

    const pendingRequestsCount = requests?.filter((r: any) => r.status === 'PENDING').length || 0;

    // Calculate stats
    const totalBeds = beds?.length || 0;
    const occupiedBeds = beds?.filter((b: Bed) => b.status === 'OCCUPIED').length || 0;
    const availableBeds = beds?.filter((b: Bed) => b.status === 'AVAILABLE').length || 0;
    const maintenanceBeds = beds?.filter((b: Bed) => b.status === 'MAINTENANCE').length || 0;

    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    if (wardsLoading || bedsLoading) {
        return <div className="flex justify-center p-8"><ButtonLoader className="text-primary" /></div>;
    }

    return (
        <div className="space-y-6 p-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Bed Management</h1>
                    <p className="text-muted-foreground">Manage hospital wards, beds, and patient allocations.</p>
                </div>
                <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('wards')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'wards' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Wards
                    </button>
                    <button
                        onClick={() => setActiveTab('beds')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'beds' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Beds
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Requests
                        {pendingRequestsCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {pendingRequestsCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {
                activeTab === 'overview' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-xl border shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Total Capacity</span>
                                    <BedDouble className="h-4 w-4 text-blue-500" />
                                </div>
                                <div className="text-2xl font-bold">{totalBeds}</div>
                                <p className="text-xs text-muted-foreground mt-1">Across {wards?.length || 0} wards</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Available</span>
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                </div>
                                <div className="text-2xl font-bold text-emerald-600">{availableBeds}</div>
                                <p className="text-xs text-muted-foreground mt-1">Ready for admission</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Occupied</span>
                                    <Users className="h-4 w-4 text-amber-500" />
                                </div>
                                <div className="text-2xl font-bold text-amber-600">{occupiedBeds}</div>
                                <div className="w-full bg-secondary h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${occupancyRate}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{occupancyRate}% Occupancy</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">Maintenance</span>
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                </div>
                                <div className="text-2xl font-bold text-slate-600">{maintenanceBeds}</div>
                                <p className="text-xs text-muted-foreground mt-1">Inaccessible beds</p>
                            </div>
                        </div>



                        {/* Ward Visual Overview */}
                        <div className="grid grid-cols-1 gap-6">
                            <h2 className="text-lg font-semibold">Ward Status</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {wards?.map((ward: Ward) => (
                                    <div key={ward.id} className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col">
                                        <div className="p-4 border-b bg-slate-50/50">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-semibold text-lg">{ward.name}</h3>
                                                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                                    {ward.ward_type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">Floor {ward.floor_number}</p>
                                        </div>
                                        <div className="p-4 flex-1">
                                            <div className="flex justify-between text-sm mb-4">
                                                <span className="text-muted-foreground">Capacity: {ward.total_beds}</span>
                                                <span className="text-emerald-600 font-medium">Available: {ward.available_beds}</span>
                                            </div>
                                            {/* Mini grid visualization */}
                                            <div className="grid grid-cols-5 gap-2">
                                                {beds?.filter((b: Bed) => b.ward === ward.id).map((bed: Bed) => (
                                                    <div
                                                        key={bed.id}
                                                        className={`
                                                        aspect-square rounded-md flex items-center justify-center text-xs font-bold border cursor-help transition-all hover:scale-105
                                                        ${bed.status === 'AVAILABLE' ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : ''}
                                                        ${bed.status === 'OCCUPIED' ? 'bg-amber-100 border-amber-200 text-amber-700' : ''}
                                                        ${bed.status === 'MAINTENANCE' ? 'bg-slate-100 border-slate-200 text-slate-500' : ''}
                                                        ${bed.status === 'CLEANING' ? 'bg-blue-100 border-blue-200 text-blue-600' : ''}
                                                    `}
                                                        title={`Bed ${bed.bed_number} - ${bed.status}\nType: ${bed.bed_type}`}
                                                    >
                                                        {bed.bed_number}
                                                    </div>
                                                ))}
                                                {(!beds || beds.filter((b: Bed) => b.ward === ward.id).length === 0) && (
                                                    <div className="col-span-5 text-center text-sm text-muted-foreground py-4 italic">No beds configured</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )
            }

            {activeTab === 'wards' && <WardList />}

            {activeTab === 'beds' && <BedList />}
            {activeTab === 'requests' && <BedRequestList />}
        </div >
    );
};


