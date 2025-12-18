import { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });

    // setTimeout(() => setToast(null), 3000);
  }, []);

  const closeToast = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);