'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ArrowLeft, TrendingUp, DollarSign, ShoppingCart, Calendar, AlertTriangle, Moon, Sun, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { ReceiptData } from '@/types/product';
import { useDarkMode } from '@/contexts/DarkModeContext';

interface AnalyticsData {
  totalSpent: number;
  totalReceipts: number;
  totalItems: number;
  averageReceiptValue: number;
  topCategories: Array<{ name: string; value: number; count: number }>;
  topMerchants: Array<{ name: string; value: number; count: number }>;
  monthlySpending: Array<{ month: string; amount: number; receipts: number }>;
  categoryBreakdown: Array<{ name: string; value: number; color: string }>;
  recentTrends: Array<{ date: string; amount: number }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  useEffect(() => {
    loadAnalyticsData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAnalyticsData = () => {
    try {
      setLoading(true);
      
      // Load all receipts from localStorage - check all possible storage keys
      const cachedReceipts = JSON.parse(localStorage.getItem('receipts') || '[]') as ReceiptData[];
      const existingData = JSON.parse(localStorage.getItem('existingData') || '[]') as ReceiptData[];
      const batchResults = JSON.parse(localStorage.getItem('batchResults') || '[]') as ReceiptData[];
      const allReceiptsCache = JSON.parse(localStorage.getItem('receipt-scanner-cache') || '[]') as ReceiptData[];
      
      // Combine all sources and remove duplicates
      const allReceipts = [...cachedReceipts, ...existingData, ...batchResults, ...allReceiptsCache];
      
      // Remove duplicates based on ID
      const uniqueReceipts = allReceipts.filter((receipt, index, self) => 
        index === self.findIndex(r => r.id === receipt.id)
      );
      
      if (uniqueReceipts.length === 0) {
        setError('No receipt data found. Please analyze some receipts or upload an Excel file first.');
        setLoading(false);
        return;
      }

      const data = calculateAnalytics(uniqueReceipts);
      setAnalyticsData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (receipts: ReceiptData[]): AnalyticsData => {
    // Basic stats
    const totalSpent = receipts.reduce((sum, receipt) => sum + receipt.total, 0);
    const totalReceipts = receipts.length;
    const totalItems = receipts.reduce((sum, receipt) => sum + receipt.products.length, 0);
    const averageReceiptValue = totalReceipts > 0 ? totalSpent / totalReceipts : 0;

    // Category analysis
    const categoryMap = new Map<string, { value: number; count: number }>();
    receipts.forEach(receipt => {
      receipt.products.forEach(product => {
        const category = product.category || 'Uncategorized';
        const current = categoryMap.get(category) || { value: 0, count: 0 };
        categoryMap.set(category, {
          value: current.value + (product.price * (product.quantity || 1)),
          count: current.count + 1
        });
      });
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, value: data.value, count: data.count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Merchant analysis
    const merchantMap = new Map<string, { value: number; count: number }>();
    receipts.forEach(receipt => {
      const merchant = receipt.store || 'Unknown Store';
      const current = merchantMap.get(merchant) || { value: 0, count: 0 };
      merchantMap.set(merchant, {
        value: current.value + receipt.total,
        count: current.count + 1
      });
    });

    const topMerchants = Array.from(merchantMap.entries())
      .map(([name, data]) => ({ name, value: data.value, count: data.count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Monthly spending
    const monthlyMap = new Map<string, { amount: number; receipts: number }>();
    receipts.forEach(receipt => {
      if (receipt.date) {
        const date = new Date(receipt.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const current = monthlyMap.get(monthKey) || { amount: 0, receipts: 0 };
        monthlyMap.set(monthKey, {
          amount: current.amount + receipt.total,
          receipts: current.receipts + 1
        });
      }
    });

    const monthlySpending = Array.from(monthlyMap.entries())
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          amount: data.amount,
          receipts: data.receipts
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    // Category breakdown for pie chart
    const categoryBreakdown = topCategories.map((category, index) => ({
      name: category.name,
      value: category.value,
      color: COLORS[index % COLORS.length]
    }));

    // Recent trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentReceipts = receipts.filter(receipt => 
      receipt.date && new Date(receipt.date) >= thirtyDaysAgo
    );

    const dailyMap = new Map<string, number>();
    recentReceipts.forEach(receipt => {
      if (receipt.date) {
        const date = new Date(receipt.date).toISOString().split('T')[0];
        const current = dailyMap.get(date) || 0;
        dailyMap.set(date, current + receipt.total);
      }
    });

    const recentTrends = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSpent,
      totalReceipts,
      totalItems,
      averageReceiptValue,
      topCategories,
      topMerchants,
      monthlySpending,
      categoryBreakdown,
      recentTrends
    };
  };

  const StatCard = ({ title, value, icon: Icon, subtitle }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    subtitle?: string;
  }) => (
    <div className={`p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600' 
        : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>{title}</p>
          <p className={`text-3xl font-bold mt-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>{value}</p>
          {subtitle && (
            <p className={`text-sm mt-1 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${
          isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
        }`}>
          <Icon className={`h-6 w-6 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen py-4 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`mt-4 text-lg transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen py-4 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-20">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>No Data Available</h2>
            <p className={`text-lg mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>{error}</p>
            <Link
              href="/"
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Scanner
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className={`min-h-screen py-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className={`p-3 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 ${
                isDarkMode 
                  ? 'bg-gray-800/60 hover:bg-gray-700/60' 
                  : 'bg-white/80 hover:bg-white/90'
              }`}
            >
              <ArrowLeft className={`h-6 w-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`} />
            </Link>
            <button
              onClick={loadAnalyticsData}
              className={`p-3 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 ${
                isDarkMode 
                  ? 'bg-gray-800/60 hover:bg-gray-700/60' 
                  : 'bg-white/80 hover:bg-white/90'
              }`}
              title="Refresh Data"
            >
              <RefreshCw className={`h-6 w-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`} />
            </button>
          </div>
          
          <div className="text-center">
            <h1 className={`text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3 pb-1 ${
              isDarkMode ? 'text-white' : ''
            }`}>
              Analytics Dashboard
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className={`w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full ${
                isDarkMode ? 'opacity-80' : 'opacity-60'
              }`}></div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isDarkMode 
                  ? 'bg-yellow-900/50 text-yellow-300' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                EXPERIMENTAL
              </span>
              <div className={`w-24 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full ${
                isDarkMode ? 'opacity-80' : 'opacity-60'
              }`}></div>
            </div>
          </div>
          
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-full transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white' 
                : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white'
            } shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105`}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Spent"
            value={`$${analyticsData.totalSpent.toFixed(2)}`}
            icon={DollarSign}
            subtitle={`${analyticsData.totalReceipts} receipts`}
          />
          <StatCard
            title="Total Items"
            value={analyticsData.totalItems}
            icon={ShoppingCart}
            subtitle="Items purchased"
          />
          <StatCard
            title="Average Receipt"
            value={`$${analyticsData.averageReceiptValue.toFixed(2)}`}
            icon={TrendingUp}
            subtitle="Per receipt"
          />
          <StatCard
            title="Total Receipts"
            value={analyticsData.totalReceipts}
            icon={Calendar}
            subtitle="Receipts analyzed"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Spending */}
          <div className={`p-6 rounded-xl shadow-lg transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/60 border border-gray-700' 
              : 'bg-white/90 border border-white/20'
          }`}>
            <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Monthly Spending</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="month" 
                  stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                />
                <YAxis 
                  stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className={`p-6 rounded-xl shadow-lg transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/60 border border-gray-700' 
              : 'bg-white/90 border border-white/20'
          }`}>
            <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Spending by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Merchants and Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Merchants */}
          <div className={`p-6 rounded-xl shadow-lg transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/60 border border-gray-700' 
              : 'bg-white/90 border border-white/20'
          }`}>
            <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Top Merchants</h3>
            <div className="space-y-3">
              {analyticsData.topMerchants.map((merchant, index) => (
                <div key={merchant.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className={`font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{merchant.name}</p>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>{merchant.count} receipts</p>
                    </div>
                  </div>
                  <p className={`font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>${merchant.value.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Categories */}
          <div className={`p-6 rounded-xl shadow-lg transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/60 border border-gray-700' 
              : 'bg-white/90 border border-white/20'
          }`}>
            <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Top Categories</h3>
            <div className="space-y-3">
              {analyticsData.topCategories.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <div>
                      <p className={`font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{category.name}</p>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>{category.count} items</p>
                    </div>
                  </div>
                  <p className={`font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>${category.value.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Trends */}
        {analyticsData.recentTrends.length > 0 && (
          <div className={`mt-8 p-6 rounded-xl shadow-lg transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/60 border border-gray-700' 
              : 'bg-white/90 border border-white/20'
          }`}>
            <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Recent Trends (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.recentTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="date" 
                  stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                />
                <YAxis 
                  stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
