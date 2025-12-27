import { useToast as useToastContext } from '../contexts/ToastContext';
import type { ToastType } from '../contexts/ToastContext';

export function useToast() {
  const { showToast } = useToastContext();

  const success = (message: string, duration?: number) => {
    showToast(message, 'success', duration);
  };

  const error = (message: string, duration?: number) => {
    showToast(message, 'error', duration);
  };

  const warning = (message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  };

  const info = (message: string, duration?: number) => {
    showToast(message, 'info', duration);
  };

  return {
    success,
    error,
    warning,
    info,
    showToast: (message: string, type?: ToastType, duration?: number) => {
      showToast(message, type, duration);
    },
  };
}

