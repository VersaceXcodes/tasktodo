import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// Define TypeScript interfaces for the state
export interface AppUser {
  id: string;
  email: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "Low" | "Medium" | "High";
  is_completed: boolean;
  manual_order: number;
  created_at: string;
  updated_at: string;
}

export interface AppUiModals {
  show_new_task_modal: boolean;
  show_edit_task_modal: boolean;
  show_confirmation_modal: boolean;
  show_onboarding_overlay: boolean;
}

export interface AppTaskFilters {
  query: string;
  is_completed: boolean | null;
  priority: "Low" | "Medium" | "High" | null;
  sort_by: string;
  sort_order: "asc" | "desc";
  limit: number;
  offset: number;
}

export interface AppStoreState {
  auth_token: string | null;
  current_user: AppUser | null;
  task_list: AppTask[];
  ui_modals: AppUiModals;
  task_filters: AppTaskFilters;
  socket: Socket | null;

  // Actions to update global state
  set_auth_token: (token: string | null) => void;
  set_current_user: (user: AppUser | null) => void;
  update_task_list: (tasks: AppTask[]) => void;
  add_task: (task: AppTask) => void;
  update_task: (task: AppTask) => void;
  remove_task: (task_id: string) => void;
  set_ui_modal: (modal_name: keyof AppUiModals, value: boolean) => void;
  set_task_filters: (filters: Partial<AppTaskFilters>) => void;
  init_socket: () => Promise<void>;
  disconnect_socket: () => void;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      // Initial state values
      auth_token: null,
      current_user: null,
      task_list: [],
      ui_modals: {
        show_new_task_modal: false,
        show_edit_task_modal: false,
        show_confirmation_modal: false,
        show_onboarding_overlay: false,
      },
      task_filters: {
        query: "",
        is_completed: null,
        priority: null,
        sort_by: "manual_order",
        sort_order: "asc",
        limit: 20,
        offset: 0,
      },
      socket: null,

      // Action implementations
      set_auth_token: (token: string | null) => set({ auth_token: token }),
      set_current_user: (user: AppUser | null) => set({ current_user: user }),
      update_task_list: (tasks: AppTask[]) => set({ task_list: tasks }),
      add_task: (task: AppTask) =>
        set((state) => ({ task_list: [...state.task_list, task] })),
      update_task: (task: AppTask) =>
        set((state) => ({
          task_list: state.task_list.map((t) =>
            t.id === task.id ? task : t
          ),
        })),
      remove_task: (task_id: string) =>
        set((state) => ({
          task_list: state.task_list.filter((t) => t.id !== task_id),
        })),
      set_ui_modal: (modal_name: keyof AppUiModals, value: boolean) =>
        set((state) => ({
          ui_modals: { ...state.ui_modals, [modal_name]: value },
        })),
      set_task_filters: (filters: Partial<AppTaskFilters>) =>
        set((state) => ({
          task_filters: { ...state.task_filters, ...filters },
        })),
      init_socket: async () => {
        if (!get().socket) {
          const socket_url =
            import.meta.env.VITE_SOCKET_URL ||
            (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');
          const new_socket: Socket = io(socket_url, {
            autoConnect: true,
          });
          // Example: you can register general event handlers here if needed.
          // new_socket.on('connect', () => { console.log('Socket connected'); });
          set({ socket: new_socket });
        }
      },
      disconnect_socket: () => {
        if (get().socket) {
          get().socket!.disconnect();
          set({ socket: null });
        }
      },
    }),
    {
      name: 'app-store', // storage key name
      // Only persist serializable parts of state (exclude socket)
      partialize: (state) => ({
        auth_token: state.auth_token,
        current_user: state.current_user,
        task_list: state.task_list,
        ui_modals: state.ui_modals,
        task_filters: state.task_filters,
      }),
    }
  )
);
