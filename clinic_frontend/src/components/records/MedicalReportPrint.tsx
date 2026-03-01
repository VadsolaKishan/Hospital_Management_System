import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { recordService, Prescription } from '@/services/recordService';
import { formatDate } from '@/utils/helpers';
import { Loader2 } from 'lucide-react';

export const MedicalReportPrint = () => {
    const { id } = useParams();
    const [report, setReport] = useState<Prescription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReport = async () => {
            if (!id) return;
            try {
                const data = await recordService.getById(parseInt(id));
                setReport(data);
                setTimeout(() => {
                    window.print();
                }, 1000);
            } catch (err) {
                console.error(err);
                setError('Failed to load medical report');
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [id]);

    if (loading) return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (error || !report) return (
        <div className="flex h-screen w-full items-center justify-center text-destructive">
            {error || 'Report not found'}
        </div>
    );

    return (
        <div className="bg-white min-h-screen text-black p-8 max-w-[210mm] mx-auto font-sans">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-primary/20 pb-6 mb-8">
                <div className="flex items-center gap-4">
                    {/* Logo Placeholder */}
                    <div className="bg-primary text-white h-16 w-16 flex items-center justify-center rounded-lg text-2xl font-bold">
                        H
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">HealthCare Pro</h1>
                        <p className="text-sm text-gray-500">123 Health Street, Medicity</p>
                        <p className="text-sm text-gray-500">Phone: +1 234 567 890</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-primary">PRESCRIPTION</h2>
                    <p className="text-sm text-gray-600 mt-1">Date: {formatDate(report.created_at)}</p>
                    <p className="text-sm text-gray-600">ID: #{report.id}</p>
                </div>
            </div>

            {/* Patient & Doctor Info Block */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
                <div className="flex justify-between">
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Patient Details</h3>
                        <p className="font-semibold text-lg text-gray-900">{report.patient_name}</p>
                        <div className="flex gap-4 text-sm text-gray-600">
                            <span>ID: {report.patient}</span>
                            <span>Age: {report.patient_age || 'N/A'} Yrs</span>
                            <span>Gender: {report.patient_gender === 'M' ? 'Male' : report.patient_gender === 'F' ? 'Female' : 'Other'}</span>
                        </div>
                    </div>
                    <div className="text-right space-y-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Consultant</h3>
                        <p className="font-semibold text-lg text-gray-900">{report.doctor_name}</p>
                        <p className="text-sm text-gray-600">General Physician</p>
                    </div>
                </div>
            </div>

            {/* Vitals (Static for layout but ready for data) */}
            <div className="grid grid-cols-4 gap-4 mb-8 text-center py-4 border-y border-gray-100">
                <div>
                    <span className="block text-xs text-gray-400 uppercase">BP</span>
                    <span className="font-medium text-gray-700">--/--</span>
                </div>
                <div>
                    <span className="block text-xs text-gray-400 uppercase">Pulse</span>
                    <span className="font-medium text-gray-700">-- bpm</span>
                </div>
                <div>
                    <span className="block text-xs text-gray-400 uppercase">Temp</span>
                    <span className="font-medium text-gray-700">-- °F</span>
                </div>
                <div>
                    <span className="block text-xs text-gray-400 uppercase">Weight</span>
                    <span className="font-medium text-gray-700">-- kg</span>
                </div>
            </div>

            <div className="space-y-8">
                {/* Diagnosis */}
                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-primary rounded-full"></span>
                        Diagnosis & Clinical Findings
                    </h3>
                    <div className="text-gray-700 leading-relaxed p-4 bg-gray-50/50 rounded-lg whitespace-pre-wrap">
                        {report.diagnosis}
                    </div>
                </section>

                {/* Medications (Rx) */}
                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-2xl font-serif italic text-primary mr-1">Rx</span>
                        Medications
                    </h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="p-4 bg-white whitespace-pre-wrap font-medium text-gray-800">
                            {report.medications}
                        </div>
                    </div>
                </section>

                {/* Instructions */}
                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-orange-400 rounded-full"></span>
                        Advice / Instructions
                    </h3>
                    <div className="text-gray-700 leading-relaxed p-4 bg-gray-50/50 rounded-lg whitespace-pre-wrap">
                        {report.instructions}
                    </div>
                </section>

                {/* Follow Up */}
                {report.follow_up_date && (
                    <div className="mt-6 p-4 border border-blue-100 bg-blue-50/50 rounded-lg flex items-center gap-3 text-blue-800">
                        <span className="font-bold">Next Visit:</span>
                        <span>{formatDate(report.follow_up_date)}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-24 pt-8 border-t border-gray-200 flex justify-between items-end">
                <div className="text-xs text-gray-400">
                    <p>This is a computer generated prescription.</p>
                    <p>Generated on {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-center">
                    <div className="h-16 w-48 mb-2"></div> {/* Space for sign */}
                    <div className="h-px bg-gray-300 w-48 mb-2"></div>
                    <p className="font-bold text-gray-900">{report.doctor_name}</p>
                    <p className="text-xs text-gray-500">Authorized Signature</p>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
};
