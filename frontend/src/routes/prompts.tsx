import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useEffect, useState, useMemo } from 'react'
import { apiClient, type Prompt } from '../lib/api'

type SearchParams = {
  q?: string
  category?: string
  sort?: 'newest' | 'oldest' | 'popular' | 'alphabetical'
  view?: 'grid' | 'list'
}

export const Route = createFileRoute('/prompts')({
  component: Prompts,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: search.q as string,
    category: search.category as string,
    sort: (search.sort as SearchParams['sort']) ?? 'newest',
    view: (search.view as SearchParams['view']) ?? 'grid',
  }),
})

interface ExtendedPrompt extends Prompt {
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  usage_count: number
  author: string
  rating: number
  tags: string[]
  content_preview: string
}

function Prompts() {
  const [allPrompts, setAllPrompts] = useState<ExtendedPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const search = useSearch({ from: '/prompts' })
  const [searchQuery, setSearchQuery] = useState(search.q || '')
  const [selectedCategory, setSelectedCategory] = useState(search.category || 'all')
  const [sortBy, setSortBy] = useState(search.sort || 'newest')
  const [viewMode, setViewMode] = useState(search.view || 'grid')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Dummy data with comprehensive examples
  const dummyPrompts: ExtendedPrompt[] = [
    {
      id: 1,
      title: "Advanced Code Review Assistant",
      description: "Comprehensive code review focusing on security, performance, best practices, and maintainability",
      content: "Please review the following code...",
      content_preview: "Please review the following code for security vulnerabilities, performance issues, coding best practices...",
      category: "Development",
      difficulty: "Advanced",
      usage_count: 2847,
      author: "DevMaster",
      rating: 4.9,
      tags: ["code-review", "security", "performance", "best-practices"],
      created_at: "2024-12-15T10:30:00Z"
    },
    {
      id: 2,
      title: "Technical Documentation Generator",
      description: "Create comprehensive API documentation with examples, error handling, and usage guidelines",
      content: "Generate technical documentation...",
      content_preview: "Generate comprehensive technical documentation for the following API endpoint, including...",
      category: "Documentation",
      difficulty: "Intermediate",
      usage_count: 1523,
      author: "TechWriter",
      rating: 4.7,
      tags: ["documentation", "api", "technical-writing"],
      created_at: "2024-12-10T15:45:00Z"
    },
    {
      id: 3,
      title: "SQL Query Optimization Expert",
      description: "Analyze and optimize SQL queries for maximum performance and efficiency",
      content: "Analyze this SQL query...",
      content_preview: "Analyze the following SQL query and provide optimization recommendations focusing on...",
      category: "Database",
      difficulty: "Advanced",
      usage_count: 892,
      author: "SQLPro",
      rating: 4.8,
      tags: ["sql", "database", "performance", "optimization"],
      created_at: "2024-12-08T09:20:00Z"
    },
    {
      id: 4,
      title: "Email Marketing Campaign Creator",
      description: "Design high-converting email marketing campaigns with psychological triggers",
      content: "Create an email marketing campaign...",
      content_preview: "Create a compelling email marketing campaign that incorporates psychological triggers...",
      category: "Marketing",
      difficulty: "Intermediate",
      usage_count: 1289,
      author: "MarketingGuru",
      rating: 4.6,
      tags: ["email-marketing", "conversion", "psychology", "campaigns"],
      created_at: "2024-12-05T14:15:00Z"
    },
    {
      id: 5,
      title: "React Component Architecture Guide",
      description: "Design scalable React component architectures with TypeScript and best practices",
      content: "Design a React component architecture...",
      content_preview: "Design a scalable React component architecture that follows best practices for...",
      category: "Development",
      difficulty: "Advanced",
      usage_count: 2156,
      author: "ReactExpert",
      rating: 4.9,
      tags: ["react", "typescript", "architecture", "components"],
      created_at: "2024-12-03T11:30:00Z"
    },
    {
      id: 6,
      title: "UX Research Interview Questions",
      description: "Comprehensive user research interview guide for discovering user needs and pain points",
      content: "Generate UX research questions...",
      content_preview: "Generate comprehensive user research interview questions that will help discover...",
      category: "Design",
      difficulty: "Beginner",
      usage_count: 765,
      author: "UXResearcher",
      rating: 4.5,
      tags: ["ux", "research", "interviews", "user-needs"],
      created_at: "2024-12-01T16:20:00Z"
    },
    {
      id: 7,
      title: "Financial Analysis Report Generator",
      description: "Create detailed financial analysis reports with insights and recommendations",
      content: "Generate a financial analysis report...",
      content_preview: "Generate a comprehensive financial analysis report that includes trend analysis...",
      category: "Finance",
      difficulty: "Advanced",
      usage_count: 1432,
      author: "FinanceAnalyst",
      rating: 4.7,
      tags: ["finance", "analysis", "reporting", "insights"],
      created_at: "2024-11-28T13:45:00Z"
    },
    {
      id: 8,
      title: "Social Media Content Strategy",
      description: "Develop engaging social media content strategies for maximum reach and engagement",
      content: "Create a social media strategy...",
      content_preview: "Develop a comprehensive social media content strategy that maximizes engagement...",
      category: "Marketing",
      difficulty: "Intermediate",
      usage_count: 1876,
      author: "SocialMediaPro",
      rating: 4.6,
      tags: ["social-media", "content-strategy", "engagement", "reach"],
      created_at: "2024-11-25T10:15:00Z"
    },
    {
      id: 9,
      title: "Data Visualization Best Practices",
      description: "Create compelling data visualizations that tell clear stories and drive decisions",
      content: "Design data visualizations...",
      content_preview: "Create effective data visualizations that clearly communicate insights and trends...",
      category: "Data Science",
      difficulty: "Intermediate",
      usage_count: 1045,
      author: "DataVizExpert",
      rating: 4.8,
      tags: ["data-visualization", "charts", "insights", "storytelling"],
      created_at: "2024-11-22T09:30:00Z"
    },
    {
      id: 10,
      title: "Customer Support Chatbot Training",
      description: "Train AI chatbots for exceptional customer support with empathy and problem-solving",
      content: "Train a customer support chatbot...",
      content_preview: "Train an AI chatbot to provide exceptional customer support by incorporating empathy...",
      category: "Customer Support",
      difficulty: "Beginner",
      usage_count: 632,
      author: "SupportSpecialist",
      rating: 4.4,
      tags: ["chatbot", "customer-support", "ai-training", "empathy"],
      created_at: "2024-11-20T14:45:00Z"
    },
    {
      id: 11,
      title: "SEO Content Optimization",
      description: "Optimize content for search engines while maintaining readability and user value",
      content: "Optimize content for SEO...",
      content_preview: "Optimize the following content for search engines while maintaining high readability...",
      category: "Marketing",
      difficulty: "Intermediate",
      usage_count: 1654,
      author: "SEOSpecialist",
      rating: 4.5,
      tags: ["seo", "content-optimization", "search-engines", "readability"],
      created_at: "2024-11-18T12:20:00Z"
    },
    {
      id: 12,
      title: "Project Risk Assessment Framework",
      description: "Comprehensive project risk assessment with mitigation strategies and contingency plans",
      content: "Assess project risks...",
      content_preview: "Conduct a comprehensive risk assessment for the project, identifying potential risks...",
      category: "Project Management",
      difficulty: "Advanced",
      usage_count: 987,
      author: "ProjectManager",
      rating: 4.6,
      tags: ["risk-assessment", "project-management", "mitigation", "planning"],
      created_at: "2024-11-15T08:30:00Z"
    },
    {
      id: 13,
      title: "API Security Audit Checklist",
      description: "Comprehensive security audit checklist for REST APIs and microservices",
      content: "Audit API security...",
      content_preview: "Perform a comprehensive security audit of the API using this checklist that covers...",
      category: "Security",
      difficulty: "Advanced",
      usage_count: 1321,
      author: "SecurityExpert",
      rating: 4.9,
      tags: ["api-security", "audit", "microservices", "security"],
      created_at: "2024-11-12T15:10:00Z"
    },
    {
      id: 14,
      title: "User Onboarding Flow Designer",
      description: "Design intuitive user onboarding flows that maximize activation and retention",
      content: "Design user onboarding flow...",
      content_preview: "Design an effective user onboarding flow that guides new users through key features...",
      category: "Design",
      difficulty: "Intermediate",
      usage_count: 843,
      author: "ProductDesigner",
      rating: 4.7,
      tags: ["onboarding", "user-experience", "activation", "retention"],
      created_at: "2024-11-10T11:25:00Z"
    },
    {
      id: 15,
      title: "Python Code Refactoring Guide",
      description: "Refactor Python code for better performance, readability, and maintainability",
      content: "Refactor Python code...",
      content_preview: "Refactor the following Python code to improve performance, readability, and follow...",
      category: "Development",
      difficulty: "Intermediate",
      usage_count: 1789,
      author: "PythonDev",
      rating: 4.6,
      tags: ["python", "refactoring", "performance", "clean-code"],
      created_at: "2024-11-08T13:40:00Z"
    }
  ]

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoading(true)
        // For now, use dummy data - in real app would call API
        // const data = await apiClient.getPrompts()
        setAllPrompts(dummyPrompts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch prompts')
      } finally {
        setLoading(false)
      }
    }

    fetchPrompts()
  }, [])

  const categories = ['all', ...Array.from(new Set(dummyPrompts.map(p => p.category)))]
  
  const filteredAndSortedPrompts = useMemo(() => {
    let filtered = allPrompts

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(prompt =>
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        prompt.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(prompt => prompt.category === selectedCategory)
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.usage_count - a.usage_count)
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      default: // newest
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return filtered
  }, [allPrompts, searchQuery, selectedCategory, sortBy])

  const paginatedPrompts = filteredAndSortedPrompts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredAndSortedPrompts.length / itemsPerPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Error loading prompts</div>
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Prompt Library
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover, use, and share high-quality AI prompts crafted by the community
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompts, tags, authors..."
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl bg-white focus:bg-white focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
              />
              <svg
                className="absolute left-4 top-4 w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:border-emerald-500 focus:outline-none"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>

                {/* Sort Filter */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-l-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-r-lg transition-colors ${
                    viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing {paginatedPrompts.length} of {filteredAndSortedPrompts.length} prompts
            {searchQuery && ` for "${searchQuery}"`}
          </p>
          <button className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md font-medium">
            Submit New Prompt
          </button>
        </div>

        {/* Prompts Grid/List */}
        {paginatedPrompts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No prompts found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? `No prompts match your search for "${searchQuery}"` : 'No prompts available in this category'}
            </p>
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              Submit the First Prompt
            </button>
          </div>
        ) : (
          <>
            <div className={
              viewMode === 'grid' 
                ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" 
                : "space-y-4"
            }>
              {paginatedPrompts.map((prompt) => (
                viewMode === 'grid' ? (
                  <div
                    key={prompt.id}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        prompt.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                        prompt.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {prompt.difficulty}
                      </span>
                      <span className="text-xs text-gray-500">{prompt.category}</span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {prompt.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {prompt.description}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {prompt.usage_count.toLocaleString()}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        {prompt.rating}
                      </span>
                      <span>by {prompt.author}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {prompt.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                          {tag}
                        </span>
                      ))}
                      {prompt.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-xs">
                          +{prompt.tags.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {new Date(prompt.created_at).toLocaleDateString()}
                      </span>
                      <Link
                        to="/prompt/$id"
                        params={{ id: prompt.id.toString() }}
                        className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                      >
                        View Details
                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div
                    key={prompt.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {prompt.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            prompt.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                            prompt.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {prompt.difficulty}
                          </span>
                          <span className="text-sm text-gray-500">{prompt.category}</span>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {prompt.description}
                        </p>

                        <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {prompt.usage_count.toLocaleString()} uses
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            {prompt.rating}
                          </span>
                          <span>by {prompt.author}</span>
                          <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {prompt.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-6 flex items-center">
                        <Link
                          to="/prompt/$id"
                          params={{ id: prompt.id.toString() }}
                          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                        >
                          View Details
                          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-12">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}