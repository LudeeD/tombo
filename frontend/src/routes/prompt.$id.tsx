import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { apiClient, type Prompt } from '../lib/api'

export const Route = createFileRoute('/prompt/$id')({
  component: PromptDetails,
})

function PromptDetails() {
  const { id } = Route.useParams()
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  const [rating, setRating] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [expandedVariations, setExpandedVariations] = useState<Set<number>>(new Set())
  const [showCopyNotification, setShowCopyNotification] = useState(false)

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getPromptById(parseInt(id))
        setPrompt(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch prompt')
      } finally {
        setLoading(false)
      }
    }

    fetchPrompt()
  }, [id])

  const copyToClipboard = async () => {
    if (!prompt) return
    
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const handleRating = (newRating: number) => {
    setRating(newRating)
    // TODO: Send rating to API
  }

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited)
    // TODO: Send favorite status to API
  }

  const toggleVariationExpansion = (index: number) => {
    const newExpanded = new Set(expandedVariations)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedVariations(newExpanded)
  }

  const copyAndOpenAI = async (url: string, platform: string) => {
    if (!prompt?.content) {
      window.open(url, '_blank')
      return
    }

    try {
      await navigator.clipboard.writeText(prompt.content)
      setShowCopyNotification(true)
      setTimeout(() => setShowCopyNotification(false), 3000)
      
      // Longer delay to allow user to read the notification
      setTimeout(() => {
        window.open(url, '_blank')
      }, 1500)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      // Fallback: try to show a browser alert instead
      alert(`Prompt content copied! Opening ${platform}...`)
      window.open(url, '_blank')
    }
  }

  const handleExport = (format: string) => {
    if (!prompt) return
    
    const content = format === 'json' 
      ? JSON.stringify(prompt, null, 2)
      : prompt.content
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${prompt.title.replace(/\s+/g, '_')}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Use real data where available, fallback to mock data for demo
  const getRealMetadata = () => {
    if (!prompt) return null;
    
    return {
      category: prompt.tags.find(tag => tag.kind === 'category')?.name || 'General',
      tags: prompt.tags.map(tag => tag.name),
      difficulty: 'Intermediate', // TODO: Add difficulty field to backend
      estimatedTokens: Math.ceil(prompt.content.length / 4), // Rough estimate
      averageRating: 4.7, // TODO: Add rating system to backend
      totalRatings: prompt.star_count || 0,
      usageCount: prompt.star_count * 5 || 125, // Estimate usage from stars
      successRate: 94, // TODO: Add success tracking to backend
      author: prompt.author?.username || 'Anonymous',
      lastUpdated: prompt.created_at,
      version: '1.0', // TODO: Add versioning to backend
      license: 'Creative Commons'
    };
  };

  const metadata = getRealMetadata()

  const mockVariations = [
    { 
      title: 'Shorter Version', 
      content: 'Brief version of the prompt...', 
      fullContent: `Please review the following code for basic issues:

1. Check for syntax errors
2. Look for obvious bugs
3. Suggest simple improvements

Focus on the most critical issues only. Keep feedback concise and actionable.`
    },
    { 
      title: 'Technical Focus', 
      content: 'Technical variation of the prompt...', 
      fullContent: `Please conduct a comprehensive technical review of the following code:

SECURITY ANALYSIS:
- Check for common vulnerabilities (SQL injection, XSS, CSRF)
- Review authentication and authorization mechanisms
- Analyze input validation and sanitization

PERFORMANCE REVIEW:
- Identify performance bottlenecks
- Review database queries for optimization opportunities
- Check for memory leaks and inefficient algorithms

ARCHITECTURE ASSESSMENT:
- Evaluate code structure and organization
- Review design patterns implementation
- Assess scalability considerations

BEST PRACTICES:
- Check compliance with coding standards
- Review error handling and logging
- Assess test coverage and quality

Please provide detailed feedback with specific examples and recommendations.`
    },
    { 
      title: 'Creative Angle', 
      content: 'Creative variation of the prompt...', 
      fullContent: `Let's approach this code review with fresh eyes and creative thinking:

🎨 CREATIVE CODE REVIEW APPROACH:

Think like a storyteller - what story does this code tell?
- Is the narrative clear and logical?
- Are there plot holes (bugs) in the story?
- Does each function play its role effectively?

Consider the user experience:
- How would users interact with this code?
- What emotions might they experience?
- Are there delightful surprises or frustrating obstacles?

Innovation opportunities:
- What creative solutions could improve this code?
- Are there unconventional approaches worth exploring?
- How might this code inspire new features or improvements?

Please provide feedback that balances technical accuracy with creative insights.`
    }
  ]

  const mockComments = [
    { author: 'Alex Chen', content: 'Great prompt! Increased my conversion rate by 30%', rating: 5, date: '2024-01-10' },
    { author: 'Maria Garcia', content: 'Works well but could use more specificity for B2B', rating: 4, date: '2024-01-08' },
    { author: 'James Smith', content: 'Perfect for social media campaigns', rating: 5, date: '2024-01-05' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/50">
        <div className="max-w-4xl mx-auto py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/50">
        <div className="max-w-4xl mx-auto py-12">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-900 mb-2">Prompt Not Found</h2>
              <p className="text-red-700 mb-6">{error}</p>
              <Link
                to="/prompts"
                className="inline-flex items-center bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Prompts
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!prompt) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/50">
      {/* Copy Notification Toast */}
      {showCopyNotification && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl border border-emerald-700 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">✅ Prompt copied to clipboard!</span>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <Link to="/prompts" className="hover:text-emerald-600 transition-colors">Prompts</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">{prompt.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{prompt.title}</h1>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {metadata?.category || 'General'}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      v{metadata?.version || '1.0'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <span>By {metadata?.author || 'Anonymous'}</span>
                    <span>•</span>
                    <span>Updated {new Date(metadata?.lastUpdated || prompt.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{metadata?.usageCount.toLocaleString() || '0'} uses</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= (metadata?.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {metadata?.averageRating || 0} ({(metadata?.totalRatings || prompt.star_count).toLocaleString()} stars)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleFavorite}
                    className={`p-2 rounded-lg transition-colors ${
                      isFavorited ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{prompt.description}</p>
            </div>

            {/* Tabbed Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'content', label: 'Prompt Content', icon: '📝' },
                    { id: 'variations', label: 'Variations', icon: '🔀' },
                    { id: 'examples', label: 'Examples', icon: '💡' },
                    { id: 'reviews', label: 'Reviews', icon: '⭐' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
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
                {activeTab === 'content' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Prompt Content</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={copyToClipboard}
                          className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            copied
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {copied ? (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleExport('txt')}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-emerald-500">
                      <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm leading-relaxed">
                        {prompt.content}
                      </pre>
                    </div>
                  </div>
                )}

                {activeTab === 'variations' && (
                  <div className="space-y-4">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Prompt Variations</h3>
                      <p className="text-gray-600 text-sm">Different versions of this prompt optimized for specific use cases</p>
                    </div>
                    {mockVariations.map((variation, index) => {
                      const isExpanded = expandedVariations.has(index)
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{variation.title}</h4>
                              <div className="flex items-center space-x-2">
                                {isExpanded && (
                                  <button
                                    onClick={() => navigator.clipboard.writeText(variation.fullContent)}
                                    className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors"
                                  >
                                    Copy
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleVariationExpansion(index)}
                                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center"
                                >
                                  {isExpanded ? (
                                    <>
                                      Hide Full Version
                                      <svg className="ml-1 w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </>
                                  ) : (
                                    <>
                                      View Full Version
                                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                            {!isExpanded ? (
                              <p className="text-gray-600 text-sm">{variation.content}</p>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-gray-600 text-sm">{variation.content}</p>
                                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-emerald-500">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Full Prompt Content:</span>
                                    <span className="text-xs text-gray-500">
                                      ~{Math.ceil(variation.fullContent.length / 4)} tokens
                                    </span>
                                  </div>
                                  <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm leading-relaxed">
                                    {variation.fullContent}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {activeTab === 'examples' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">📧 Email Marketing Campaign</h4>
                      <p className="text-blue-800 text-sm mb-3">Used this prompt to create a product launch email sequence</p>
                      <div className="bg-white rounded p-3 text-sm">
                        <strong>Input:</strong> "New fitness tracker with heart rate monitoring"<br/>
                        <strong>Output:</strong> "Discover Your Peak Performance: Introducing the FitMax Pro..."
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">📱 Social Media Content</h4>
                      <p className="text-green-800 text-sm mb-3">Generated engaging Instagram captions</p>
                      <div className="bg-white rounded p-3 text-sm">
                        <strong>Input:</strong> "Sustainable fashion brand launch"<br/>
                        <strong>Output:</strong> "Fashion that doesn't cost the earth 🌱 Introducing our eco-friendly..."
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {mockComments.map((comment, index) => (
                      <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{comment.author}</span>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-4 h-4 ${star <= comment.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">{new Date(comment.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => copyAndOpenAI('https://chat.openai.com', 'ChatGPT')}
                className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Try in ChatGPT
              </button>
              <button
                onClick={() => copyAndOpenAI('https://claude.ai', 'Claude')}
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Try in Claude
              </button>
              <button className="inline-flex items-center bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z" />
                </svg>
                Test & Optimize
              </button>
              <Link
                to="/prompts"
                className="inline-flex items-center bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Library
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Stars</span>
                  <span className="font-medium">{prompt.star_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Usage Est.</span>
                  <span className="font-medium">{metadata?.usageCount.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tokens</span>
                  <span className="font-medium">~{metadata?.estimatedTokens || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Author</span>
                  <span className="font-medium">{metadata?.author || 'Anonymous'}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {prompt.tags.length > 0 ? (
                  prompt.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer"
                      style={{
                        backgroundColor: tag.bg_color,
                        color: tag.text_color,
                      }}
                    >
                      #{tag.name}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No tags assigned</span>
                )}
              </div>
            </div>

            {/* Rate This Prompt */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate This Prompt</h3>
              <div className="flex items-center space-x-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    className={`w-6 h-6 ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
                    } transition-colors`}
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600">Thanks for rating!</p>
              )}
            </div>

            {/* Related Prompts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Prompts</h3>
              <div className="space-y-3">
                {[
                  { title: 'Email Subject Lines', category: 'Marketing' },
                  { title: 'Social Media Copy', category: 'Content' },
                  { title: 'Product Descriptions', category: 'E-commerce' }
                ].map((related, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="font-medium text-gray-900 text-sm">{related.title}</h4>
                    <p className="text-xs text-gray-600">{related.category}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}