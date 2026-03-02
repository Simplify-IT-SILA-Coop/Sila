import { create } from 'zustand';
import { API_BASE_URL } from '../config/api';

export interface Task {
    id: number;
    cityFrom: string;
    cityTo: string;
    pickupAddress: string;
    deliveryAddress: string;
    weightKg: number;
    fragile: boolean;
    status: string;
    createdAt: string;
    driverId?: string;
    estimatedCost?: number;
}

interface TaskState {
    tasks: Task[];
    loading: boolean;
    fetchTasks: (driverId: string) => Promise<void>;
    acceptTask: (driverId: string, taskId: number) => Promise<{ success: boolean; error?: string }>;
    completeTask: (driverId: string, taskId: number) => Promise<{ success: boolean; error?: string }>;
    pendingCount: () => number;
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    loading: false,
    fetchTasks: async (driverId: string) => {
        set({ loading: true });
        try {
            const response = await fetch(`${API_BASE_URL}/api/drivers/${driverId}/tasks`);
            if (response.ok) {
                const data = await response.json();
                set({ tasks: Array.isArray(data) ? data : [], loading: false });
            } else {
                set({ loading: false });
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            set({ loading: false });
        }
    },
    acceptTask: async (driverId: string, taskId: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/drivers/${driverId}/tasks/${taskId}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            
            if (response.ok) {
                // Refresh tasks after acceptance
                await get().fetchTasks(driverId);
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error: error.detail || 'Failed to accept task' };
            }
        } catch (error) {
            return { success: false, error: 'Network error. Please try again.' };
        }
    },
    completeTask: async (driverId: string, taskId: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/drivers/${driverId}/tasks/${taskId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            
            if (response.ok) {
                // Refresh tasks after completion
                await get().fetchTasks(driverId);
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error: error.detail || 'Failed to complete task' };
            }
        } catch (error) {
            return { success: false, error: 'Network error. Please try again.' };
        }
    },
    pendingCount: () => get().tasks.filter(t => t.status !== 'DELIVERED').length,
}));
