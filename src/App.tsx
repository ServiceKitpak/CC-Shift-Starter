import React, { useEffect, useState } from 'react';
import Interface1 from './components/Interface1';
import AdminViewer from './components/AdminViewer';
import AdminLogin from './components/AdminLogin';
import { auth } from './lib/firebase';
import { User } from 'firebase/auth';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">HR Management System</h1>
        {user ? (
          <AdminViewer />
        ) : (
          <>
            <Interface1 />
            <AdminLogin />
          </>
        )}
      </div>
    </div>
  );
}

export default App;