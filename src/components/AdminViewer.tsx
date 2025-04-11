import React, { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { ClipboardList, LogOut, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { signOut } from 'firebase/auth';

interface Shift {
  id: string;
  employeeId: string;
  checkIn: { seconds: number };
  checkOut?: { seconds: number };
  isActive: boolean;
}

interface Click {
  id: string;
  timestamp: { seconds: number };
  shiftId: string;
}

interface ClicksByShift {
  [key: string]: Click[];
}

const AdminViewer = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [clicksByShift, setClicksByShift] = useState<ClicksByShift>({});
  const [loading, setLoading] = useState(true);
  const [expandedShift, setExpandedShift] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    // Convert selected date to start and end timestamps
    const selectedDateObj = new Date(selectedDate);
    const startOfDay = new Date(selectedDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    // Query shifts for selected date
    const shiftsQuery = query(
      collection(db, 'shifts'),
      where('checkIn', '>=', Timestamp.fromDate(startOfDay)),
      where('checkIn', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('checkIn', 'desc')
    );

    const unsubShifts = onSnapshot(shiftsQuery, (snapshot) => {
      const shiftsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shift[];
      setShifts(shiftsData);
      setLoading(false);
    });

    // Listen for clicks
    const clicksQuery = query(collection(db, 'clicks'), orderBy('timestamp', 'asc'));
    
    const unsubClicks = onSnapshot(clicksQuery, (snapshot) => {
      const grouped: ClicksByShift = {};
      snapshot.docs.forEach(doc => {
        const click = { id: doc.id, ...doc.data() } as Click;
        if (!grouped[click.shiftId]) {
          grouped[click.shiftId] = [];
        }
        grouped[click.shiftId].push(click);
      });
      setClicksByShift(grouped);
    });

    return () => {
      unsubShifts();
      unsubClicks();
    };
  }, [selectedDate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatDuration = (start: number, end: number) => {
    const duration = Math.floor(end - start);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const calculateClickDurations = (clicks: Click[]) => {
    return clicks.map((click, index) => ({
      ...click,
      duration: index > 0 
        ? formatDuration(clicks[index - 1].timestamp.seconds, click.timestamp.seconds)
        : '—'
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Employee ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Check-In</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Check-Out</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Clicks</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {shifts.map((shift) => (
              <React.Fragment key={shift.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{shift.employeeId}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {shift.checkIn?.seconds ? new Date(shift.checkIn.seconds * 1000).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {shift.checkOut?.seconds ? new Date(shift.checkOut.seconds * 1000).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      shift.isActive 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {shift.isActive ? 'Active' : 'Closed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {clicksByShift[shift.id]?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => setExpandedShift(expandedShift === shift.id ? null : shift.id)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      {expandedShift === shift.id ? (
                        <>
                          Hide Details
                          <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          View Details
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </td>
                </tr>
                {expandedShift === shift.id && clicksByShift[shift.id]?.length > 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-3 bg-gray-50">
                      <div className="overflow-x-auto">
                        <table className="w-full table-auto border-collapse">
                          <thead>
                            <tr className="text-xs text-gray-500">
                              <th className="px-4 py-2 text-left">Click Time</th>
                              <th className="px-4 py-2 text-left">Time Since Last Click</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {calculateClickDurations(clicksByShift[shift.id]).map((click, index) => (
                              <tr key={click.id} className="text-sm">
                                <td className="px-4 py-2 text-gray-600">
                                  {new Date(click.timestamp.seconds * 1000).toLocaleString()}
                                </td>
                                <td className="px-4 py-2 text-gray-600">{click.duration}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminViewer;