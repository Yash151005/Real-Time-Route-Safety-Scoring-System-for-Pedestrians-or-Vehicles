import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Shield, Car, Bike, Footprints, Bus } from 'lucide-react';
import { api } from '../../../convex/_generated/api';

export function SimpleAuth() {
  const { signIn } = useAuthActions();
  const createUserProfile = useMutation(api.userProfiles.createUserProfile);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState(1);
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [profileData, setProfileData] = useState({
    fullName: '',
    gender: 'prefer_not_to_say' as 'male' | 'female' | 'other' | 'prefer_not_to_say',
    age: 18,
    modeOfTransport: 'car' as 'walking' | 'cycling' | 'car' | 'public_transport',
    emergencyContact: '',
    preferences: {
      avoidDarkAreas: true,
      preferWellLitRoutes: true,
      avoidHighCrimeAreas: true,
      preferMainRoads: false,
    },
  });

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'signup') {
      // Validate passwords match
      if (authData.password !== authData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      
      // Validate password length
      if (authData.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }
    }
    
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        // Sign up flow
        await signIn('password', { 
          email: authData.email, 
          password: authData.password, 
          flow: 'signUp' 
        });
        toast.success('Account created! Please complete your profile.');
        setStep(2);
      } else {
        // Sign in flow
        await signIn('password', authData);
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (mode === 'signup') {
        if (error.message?.includes('already exists')) {
          toast.error('An account with this email already exists. Please sign in instead.');
        } else {
          toast.error(error.message || 'Failed to create account');
        }
      } else {
        if (error.message?.includes('Invalid password')) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else if (error.message?.includes('not found')) {
          toast.error('No account found with this email. Please sign up first.');
        } else {
          toast.error(error.message || 'Failed to sign in');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!profileData.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    
    if (!profileData.emergencyContact.trim()) {
      toast.error('Emergency contact is required');
      return;
    }
    
    if (profileData.age < 13 || profileData.age > 120) {
      toast.error('Please enter a valid age (13-120)');
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await createUserProfile({
        fullName: profileData.fullName.trim(),
        email: authData.email,
        gender: profileData.gender,
        age: profileData.age,
        modeOfTransport: profileData.modeOfTransport,
        emergencyContact: profileData.emergencyContact.trim(),
        preferences: profileData.preferences,
      });
      
      console.log('Profile created successfully:', result);
      toast.success('Profile completed! Welcome to SafeRoute AI!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Profile creation error:', error);
      if (error.message?.includes('Not authenticated')) {
        toast.error('Authentication expired. Please sign in again.');
        setStep(1);
      } else {
        toast.error('Failed to save profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const transportIcons = {
    walking: Footprints,
    cycling: Bike,
    car: Car,
    public_transport: Bus,
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {mode === 'signin' 
                  ? 'Sign in to continue to SafeRoute AI' 
                  : 'Join SafeRoute AI for personalized safety'
                }
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mb-6">
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  mode === 'signin'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="email"
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={authData.password}
                    onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder={mode === 'signup' ? 'Create a password (min 6 characters)' : 'Enter your password'}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={authData.confirmPassword}
                      onChange={(e) => setAuthData({ ...authData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="Confirm your password"
                      required
                      minLength={6}
                    />
                  </div>
                  {authData.password && authData.confirmPassword && authData.password !== authData.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                  )}
                  {authData.password && authData.confirmPassword && authData.password === authData.confirmPassword && (
                    <p className="text-green-500 text-sm mt-1">Passwords match ✓</p>
                  )}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-400 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Anonymous Sign In */}
            <div className="mt-6">
              <div className="flex items-center my-3">
                <hr className="flex-1 border-slate-300 dark:border-slate-600" />
                <span className="px-4 text-slate-500 dark:text-slate-400 text-sm">or</span>
                <hr className="flex-1 border-slate-300 dark:border-slate-600" />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signIn('anonymous')}
                disabled={isLoading}
                className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Shield className="w-5 h-5" />
                <span>Continue as Guest</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Profile completion step
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Complete Your Profile
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Help us personalize your safety recommendations
            </p>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Gender
                </label>
                <select
                  value={profileData.gender}
                  onChange={(e) => setProfileData({ ...profileData, gender: e.target.value as any })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value="prefer_not_to_say">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  min="13"
                  max="120"
                  value={profileData.age}
                  onChange={(e) => setProfileData({ ...profileData, age: parseInt(e.target.value) || 18 })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Primary Mode of Transport
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['walking', 'cycling', 'car', 'public_transport'] as const).map((transport) => {
                  const Icon = transportIcons[transport];
                  return (
                    <motion.button
                      key={transport}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setProfileData({ ...profileData, modeOfTransport: transport })}
                      className={`p-4 rounded-xl border-2 transition-colors ${
                        profileData.modeOfTransport === transport
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-slate-300 dark:border-slate-600 hover:border-green-300'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2 text-slate-600 dark:text-slate-400" />
                      <span className="text-sm font-medium capitalize">
                        {transport.replace('_', ' ')}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Emergency Contact Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="tel"
                  value={profileData.emergencyContact}
                  onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Enter emergency contact number"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-400 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Complete Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
