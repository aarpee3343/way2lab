import { toast as sonnerToast } from 'sonner';

// This wrapper delays the toast by 0ms, preventing the render error globally
export const toast = {
  ...sonnerToast,
  success: (message: string | React.ReactNode, data?: any) => {
    setTimeout(() => sonnerToast.success(message, data), 0);
  },
  error: (message: string | React.ReactNode, data?: any) => {
    setTimeout(() => sonnerToast.error(message, data), 0);
  },
  warning: (message: string | React.ReactNode, data?: any) => {
    setTimeout(() => sonnerToast.warning(message, data), 0);
  },
  info: (message: string | React.ReactNode, data?: any) => {
    setTimeout(() => sonnerToast.info(message, data), 0);
  },
};