import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      setRole: (role) => {
        set((state) => {
          if (!state.user) return { user: null };
          
          // Inject demo IDs if they don't exist for the target role
          const updates = { role };
          if (role === 'society_admin' && !state.user.societyId) {
            updates.societyId = '69dddcc05c9abc1a0db69550'; // Real Seeded Society ID
          }
          if (role === 'builder_admin' && !state.user.builderId) {
            updates.builderId = { _id: '65f1a2b3c4d5e6f7a8b9c0d2', name: 'Ampere Portfolio' }; // Demo Builder
          }
          
          return { user: { ...state.user, ...updates } };
        });
      },
      switchRole: async (role) => {
        try {
          const res = await api.post('/auth/switch-role', { role });
          const { token, user: updatedUser } = res.data;
          
          set({ 
            token, 
            user: updatedUser,
            isAuthenticated: true 
          });
          
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return true;
        } catch (err) {
          return false;
        }
      },
    }),
    {
      name: 'gridwise-auth-storage', // key in localStorage
    }
  )
);

export default useAuthStore;
