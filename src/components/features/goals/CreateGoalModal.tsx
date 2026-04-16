import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Link as LinkIcon } from 'lucide-react';
import { useStore } from '../../../stores/useStore';
import toast from 'react-hot-toast';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGoalModal: React.FC<CreateGoalModalProps> = ({ isOpen, onClose }) => {
  const addGoal = useStore((state) => state.addGoal);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Programming',
    targetDate: '',
    links: [''],
  });

  const categories = ['Programming', 'Design', 'Business', 'Language', 'Music', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    if (!formData.targetDate) {
      toast.error('A precise target deadline is mandatory.');
      return;
    }

    const selectedTime = new Date(formData.targetDate).getTime();
    const nowTime = Date.now();
    const msIn24Hours = 24 * 60 * 60 * 1000;

    if (selectedTime <= nowTime) {
      toast.error('Deadline must be set in the future.');
      return;
    }

    if (selectedTime - nowTime > msIn24Hours) {
      toast.error('Strict Mode: Goals cannot exceed a 24-hour deadline.');
      return;
    }

    const newGoal = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      difficulty: 'Medium' as const,
      progress: 0,
      status: 'To Do' as const,
      timeSpent: '0 hours',
      targetDate: formData.targetDate,
      deadline: formData.targetDate || '',
      subTasks: [],
      notes: '',
      links: formData.links.filter(link => link.trim()),
    };

    addGoal(newGoal);
    toast.success('Goal created successfully!');
    onClose();
    setFormData({
      title: '',
      description: '',
      category: 'Programming',
      targetDate: '',
      links: [''],
    });
  };


  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, '']
    }));
  };

  const updateLink = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => i === index ? value : link)
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-premium-card rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/30 border border-transparent dark:border-premium-border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Goal</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-premium-secondary rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-premium-accent focus:border-transparent bg-white dark:bg-premium-secondary text-gray-900 dark:text-white transition-all"
                  placeholder="e.g., Learn React Fundamentals"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-premium-accent focus:border-transparent bg-white dark:bg-premium-secondary text-gray-900 dark:text-white transition-all"
                  rows={3}
                  placeholder="Describe your learning goal..."
                />
              </div>

              {/* Category and Target Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-premium-accent focus:border-transparent bg-white dark:bg-premium-secondary text-gray-900 dark:text-white transition-all"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.targetDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-premium-accent focus:border-transparent bg-white dark:bg-premium-secondary text-gray-900 dark:text-white transition-all"
                  />
                </div>
              </div>


              {/* Links */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Useful Links
                </label>
                <div className="space-y-2">
                  {formData.links.map((link, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <LinkIcon className="w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => updateLink(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-premium-accent focus:border-transparent bg-white dark:bg-premium-secondary text-gray-900 dark:text-white transition-all"
                        placeholder="https://..."
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addLink}
                  className="mt-2 flex items-center space-x-2 text-premium-accent hover:text-indigo-400 text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Link</span>
                </button>
              </div>


              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-premium-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-3"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateGoalModal;
