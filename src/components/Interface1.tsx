import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore';
import { UserPlus, AlertCircle, Loader2, Timer, XCircle, Plus } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  department: string;
}

interface ActiveShift {
  id: string;
  employeeId: string;
  checkIn: { seconds: number };
  clicks: number;
}

const EMPLOYEES: Employee[] = [
  { id: 'emp1', name: 'Muhammad Bilal', department: 'Development' },
  { id: 'emp2', name: 'Saif Akram', department: 'Development' },
  { id: 'emp3', name: 'Fizza Rehan', department: 'Development' },
  { id: 'emp4', name: 'Ali Hassan', department: 'Development' },
  { id: 'emp5', name: 'Muhammad Shoaib', department: 'Development' },
  { id: 'emp6', name: 'Muhammad Hamza', department: 'Development' },
  { id: 'emp7', name: 'Khubaib Akhter', department: 'Development' },
  { id: 'emp8', name: 'Muhammad Usama', department: 'Development' },
  { id: 'emp9', name: 'Mohsin Mehfooz', department: 'Development' },
  { id: 'emp10', name: 'Taimor Agha', department: 'Development' },
  { id: 'emp11', name: 'Ahsan Shahzad', department: 'Development' },
  { id: 'emp12', name: 'Muhammad Umer', department: 'Development' },
  { id: 'emp13', name: 'Shanzay', department: 'Development' },
  { id: 'emp14', name: 'Haroon Humayun', department: 'Development' },
  { id: 'emp15', name: 'Muhammad Shabir', department: 'Development' },
  { id: 'emp16', name: 'Hashim Ali', department: 'Development' },
  { id: 'emp17', name: 'Mutahir', department: 'Development' },
  { id: 'emp18', name: 'Umar Humayun', department: 'Development' }
];

const Interface1 = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [clicksCount, setClicksCount] = useState(0);

  useEffect(() => {
    if (employeeId) {
      fetchActiveShift(employeeId);
    }
  }, [employeeId]);

  const fetchActiveShift = async (empId: string) => {
    try {
      const q = query(
        collection(db, 'shifts'),
        where('employeeId', '==', empId),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const shiftData = snapshot.docs[0];
        setActiveShift({
          id: shiftData.id,
          ...shiftData.data() as Omit<ActiveShift, 'id'>
        });
        
        // Fetch clicks for this shift
        const clicksQuery = query(
          collection(db, 'clicks'),
          where('shiftId', '==', shiftData.id)
        );
        const clicksSnapshot = await getDocs(clicksQuery);
        setClicksCount(clicksSnapshot.size);
      } else {
        setActiveShift(null);
        setClicksCount(0);
      }
    } catch (err) {
      console.error('Error fetching active shift:', err);
    }
  };

  const handleCheckIn = async () => {
    if (!employeeId) {
      setError('Please select an employee');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const hasActiveShift = await checkExistingShift(employeeId);
      if (hasActiveShift) {
        setError('This employee already has an active shift');
        return;
      }

      const shiftRef = await addDoc(collection(db, 'shifts'), {
        employeeId,
        checkIn: serverTimestamp(),
        isActive: true,
        startedAt: new Date().toISOString(),
      });

      setSuccess(true);
      await fetchActiveShift(employeeId);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to start shift. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingShift = async (empId: string) => {
    const q = query(
      collection(db, 'shifts'),
      where('employeeId', '==', empId),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  const handleAddClick = async () => {
    if (!activeShift) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'clicks'), {
        employeeId,
        shiftId: activeShift.id,
        timestamp: serverTimestamp(),
      });
      setClicksCount(prev => prev + 1);
    } catch (err) {
      console.error('Error adding click:', err);
      setError('Failed to add click. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!activeShift) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'shifts', activeShift.id), {
        checkOut: serverTimestamp(),
        isActive: false,
      });
      setActiveShift(null);
      setClicksCount(0);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error ending shift:', err);
      setError('Failed to end shift. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getActiveEmployee = () => {
    return EMPLOYEES.find(emp => emp.id === employeeId);
  };

  const formatDuration = (startSeconds: number) => {
    const duration = Math.floor((Date.now() / 1000) - startSeconds);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-6">
        <UserPlus className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Shift Management</h2>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="employee" className="text-sm font-medium text-gray-700">
            Select Employee
          </label>
          <select
            id="employee"
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              setError(null);
            }}
            className="flex-1 border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            disabled={loading}
          >
            <option value="">Choose an employee...</option>
            {EMPLOYEES.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} - {emp.department}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
            <span className="text-sm">✓ Action completed successfully!</span>
          </div>
        )}

        {activeShift ? (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Active Shift</span>
              </div>
              <span className="text-sm text-gray-600">
                Duration: {formatDuration(activeShift.checkIn.seconds)}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-t border-gray-200">
              <div>
                <p className="font-medium">{getActiveEmployee()?.name}</p>
                <p className="text-sm text-gray-600">{getActiveEmployee()?.department}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">Clicks</p>
                <p className="text-2xl font-bold text-blue-600">{clicksCount}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddClick}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Click
              </button>
              <button
                onClick={handleEndShift}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="h-5 w-5" />
                End Shift
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleCheckIn}
            disabled={loading || !employeeId}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Start Shift
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Interface1;