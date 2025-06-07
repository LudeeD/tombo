import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ProtectedRoute } from '../components/ProtectedRoute'

export const Route = createFileRoute('/dashboard')({
  component: () => (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  ),
})

interface Prompt {
  id: number
  title: string
  description: string
  content: string
  usage_count: number
  created_at: string
  tags: string[]
}

interface Variable {
  id: number
  name: string
  description: string
  default_value: string
  type: 'text' | 'number' | 'select' | 'boolean'
  options?: string[]
  created_at: string
}

function Dashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'prompts' | 'variables' | 'settings'>('prompts')

  // Dummy data for prompts
  const myPrompts: Prompt[] = [
    {
      id: 1,
      title: "Code Review Assistant",
      description: "A comprehensive prompt for reviewing code quality, security, and best practices",
      content: "Please review the following code and provide feedback on...",
      usage_count: 847,
      created_at: "2024-12-15T10:30:00Z",
      tags: ["coding", "review", "development"]
    },
    {
      id: 2,
      title: "Technical Documentation Writer",
      description: "Generate clear, concise technical documentation for APIs and software",
      content: "Create technical documentation for the following API...",
      usage_count: 523,
      created_at: "2024-12-10T15:45:00Z",
      tags: ["documentation", "technical-writing", "api"]
    },
    {
      id: 3,
      title: "SQL Query Optimizer",
      description: "Analyze and optimize SQL queries for better performance",
      content: "Analyze this SQL query and suggest optimizations...",
      usage_count: 312,
      created_at: "2024-12-08T09:20:00Z",
      tags: ["sql", "database", "performance"]
    },
    {
      id: 4,
      title: "Email Marketing Template",
      description: "Create engaging email marketing campaigns with high conversion rates",
      content: "Write an email marketing campaign for...",
      usage_count: 189,
      created_at: "2024-12-05T14:15:00Z",
      tags: ["marketing", "email", "conversion"]
    }
  ]

  // Dummy data for variables
  const myVariables: Variable[] = [
    {
      id: 1,
      name: "programming_language",
      description: "The target programming language for code-related prompts",
      default_value: "JavaScript",
      type: "select",
      options: ["JavaScript", "Python", "TypeScript", "Java", "Go", "Rust"],
      created_at: "2024-12-15T10:30:00Z"
    },
    {
      id: 2,
      name: "tone_of_voice",
      description: "The desired tone for written content",
      default_value: "Professional",
      type: "select",
      options: ["Professional", "Casual", "Friendly", "Formal", "Technical"],
      created_at: "2024-12-12T16:20:00Z"
    },
    {
      id: 3,
      name: "max_response_length",
      description: "Maximum number of words in the response",
      default_value: "500",
      type: "number",
      created_at: "2024-12-10T11:45:00Z"
    },
    {
      id: 4,
      name: "include_examples",
      description: "Whether to include code examples in technical responses",
      default_value: "true",
      type: "boolean",
      created_at: "2024-12-08T13:30:00Z"
    }
  ]

  const stats = {
    totalPrompts: myPrompts.length,
    totalUsage: myPrompts.reduce((sum, prompt) => sum + prompt.usage_count, 0),
    totalVariables: myVariables.length,
    avgUsagePerPrompt: Math.round(myPrompts.reduce((sum, prompt) => sum + prompt.usage_count, 0) / myPrompts.length)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.username}
              </h1>
              <p className="text-gray-600 mt-1">Manage your prompts, variables, and account settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/prompts"
                className="px-4 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200 font-medium"
              >
                Browse Prompts
              </Link>
              <button className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md font-medium">
                Create Prompt
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Prompts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPrompts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsage.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Variables</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVariables}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Usage</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgUsagePerPrompt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'prompts', label: 'My Prompts', icon: '📝' },
                { id: 'variables', label: 'Variables', icon: '🔧' },
                { id: 'settings', label: 'Account Settings', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'prompts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">My Prompts</h2>
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    Create New Prompt
                  </button>
                </div>
                
                <div className="grid gap-6">
                  {myPrompts.map((prompt) => (
                    <div key={prompt.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{prompt.title}</h3>
                          <p className="text-gray-600 mb-3">{prompt.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {prompt.usage_count} uses
                            </span>
                            <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Link
                            to="/prompt/$id"
                            params={{ id: prompt.id.toString() }}
                            className="px-3 py-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors text-sm font-medium"
                          >
                            View
                          </Link>
                          <button className="px-3 py-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium">
                            Edit
                          </button>
                          <button className="px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors text-sm font-medium">
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {prompt.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'variables' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Variables</h2>
                    <p className="text-gray-600 mt-1">Reusable variables to customize your prompts</p>
                  </div>
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    Create New Variable
                  </button>
                </div>

                <div className="grid gap-4">
                  {myVariables.map((variable) => (
                    <div key={variable.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{variable.name}</h3>
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                              variable.type === 'text' ? 'bg-blue-100 text-blue-700' :
                              variable.type === 'number' ? 'bg-green-100 text-green-700' :
                              variable.type === 'select' ? 'bg-purple-100 text-purple-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {variable.type}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{variable.description}</p>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="font-medium mr-2">Default:</span>
                              <span className="px-2 py-1 bg-gray-100 rounded-md font-mono">
                                {variable.default_value}
                              </span>
                            </div>
                            {variable.options && (
                              <div className="flex items-start text-sm text-gray-500">
                                <span className="font-medium mr-2 mt-1">Options:</span>
                                <div className="flex flex-wrap gap-1">
                                  {variable.options.map((option) => (
                                    <span key={option} className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                                      {option}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button className="px-3 py-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium">
                            Edit
                          </button>
                          <button className="px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors text-sm font-medium">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
                  
                  {/* Profile Section */}
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                          <input
                            type="text"
                            value={user?.username || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            placeholder="user@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <button className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                        Update Profile
                      </button>
                    </div>

                    {/* Password Section */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <button className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                        Change Password
                      </button>
                    </div>

                    {/* Preferences Section */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Email Notifications</p>
                            <p className="text-sm text-gray-500">Receive notifications about your prompts</p>
                          </div>
                          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-600 transition-colors">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Public Profile</p>
                            <p className="text-sm text-gray-500">Make your prompts visible to other users</p>
                          </div>
                          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-600 transition-colors">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="border border-red-200 rounded-lg p-6 bg-red-50/50">
                      <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="font-medium text-red-900">Delete Account</p>
                          <p className="text-sm text-red-700 mb-3">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}