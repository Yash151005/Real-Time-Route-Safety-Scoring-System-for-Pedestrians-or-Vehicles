import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { User, Edit3, Save, X, Shield, Car, Bike, Footprints, Bus } from 'lucide-react';
import { toast } from 'sonner';

export function ProfileSection() {
  const { userProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || '',
    gender: userProfile?.gender || 'prefer_not_to_say' as const,
    age: userProfile?.age || 18,
    modeOfTransport: userProfile?.modeOfTransport || 'car' as const,
    emergencyContact: userProfile?.emergencyContact || '',
    preferences: userProfile?.preferences || {
      avoidDarkAreas: true,
      preferWellLitRoutes: true,
      avoidHighCrimeAreas: true,
      preferMainRoads: false,
    },
  });

  const updateProfile = useMutation(api.userProfiles.updateUserProfile);

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: userProfile?.fullName || '',
      gender: userProfile?.gender || 'prefer_not_to_say',
      age: userProfile?.age || 18,
      modeOfTransport: userProfile?.modeOfTransport || 'car',
      emergencyContact: userProfile?.emergencyContact || '',
      preferences: userProfile?.preferences || {
        avoidDarkAreas: true,
        preferWellLitRoutes: true,
        avoidHighCrimeAreas: true,
        preferMainRoads: false,
      },
    });
    setIsEditing(false);
  };

  const transportIcons = {
    walking: Footprints,
    cycling: Bike,
    car: Car,
    public_transport: Bus,
  };

  if (!userProfile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              {userProfile.fullName}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {userProfile.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
        >
          {isEditing ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Age
              </label>
              <input
                type="number"
                min="13"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 18 })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            >
              <option value="prefer_not_to_say">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Mode of Transport
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['walking', 'cycling', 'car', 'public_transport'] as const).map((mode) => {
                const Icon = transportIcons[mode];
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFormData({ ...formData, modeOfTransport: mode })}
                    className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center ${
                      formData.modeOfTransport === mode
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-slate-300 dark:border-slate-600 hover:border-green-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1 text-slate-600 dark:text-slate-400" />
                    <span className="text-xs font-medium capitalize">
                      {mode.replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Emergency Contact
            </label>
            <input
              type="tel"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            />
          </div>

          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Gender</p>
                <p className="font-medium capitalize">{userProfile.gender.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Age</p>
                <p className="font-medium">{userProfile.age} years old</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {React.createElement(transportIcons[userProfile.modeOfTransport], { className: "w-5 h-5 text-slate-400" })}
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Transport Mode</p>
              <p className="font-medium capitalize">{userProfile.modeOfTransport.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Emergency Contact</p>
              <p className="font-medium">{userProfile.emergencyContact}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Safety Preferences</p>
            <div className="space-y-1">
              {Object.entries(userProfile.preferences).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

