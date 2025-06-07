import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { apiClient, type Prompt } from '../lib/api'

export const Route = createFileRoute('/prompts')({
  component: Prompts,
})

function Prompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getPrompts()
        setPrompts(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch prompts')
      } finally {
        setLoading(false)
      }
    }

    fetchPrompts()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading prompts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Prompts</h1>
        <p className="text-neutral-600">Browse and discover AI prompts</p>
      </div>

      {prompts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-neutral-500 mb-4">No prompts found</div>
          <p className="text-sm text-neutral-400">
            Be the first to add a prompt to the collection!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                {prompt.title}
              </h3>
              <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                {prompt.description}
              </p>
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>
                  {new Date(prompt.created_at).toLocaleDateString()}
                </span>
                <button className="text-emerald-600 hover:text-emerald-700 font-medium">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}