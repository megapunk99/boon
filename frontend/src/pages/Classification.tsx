import { useEffect, useState } from 'react'
import {
  ScanLine,
  FlaskConical,
  Beaker,
  Leaf,
  Shield,
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  Microscope,
} from 'lucide-react'
import * as api from '../services/api'

const WASTE_TYPES = [
  { value: 'human_anatomical_waste', label: 'Human Anatomical Waste' },
  { value: 'soiled_dressing', label: 'Soiled Dressing / Gauze' },
  { value: 'blood_bags', label: 'Blood Bags' },
  { value: 'discarded_medicines', label: 'Discarded Medicines' },
  { value: 'cytotoxic_drugs', label: 'Cytotoxic Drugs' },
  { value: 'microbiology_waste', label: 'Microbiology Waste' },
  { value: 'iv_tubing', label: 'IV Tubing' },
  { value: 'syringes_without_needle', label: 'Syringes (no needle)' },
  { value: 'gloves', label: 'Gloves' },
  { value: 'masks', label: 'Masks' },
  { value: 'catheters', label: 'Catheters' },
  { value: 'hypodermic_needles', label: 'Hypodermic Needles' },
  { value: 'scalpels', label: 'Scalpels / Blades' },
  { value: 'broken_glass_ampoules', label: 'Broken Glass Ampoules' },
  { value: 'glass_vials', label: 'Glass Vials' },
  { value: 'metallic_implants', label: 'Metallic Implants' },
]

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  yellow: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    icon: '🟡',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: '🔴',
  },
  white: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    text: 'text-gray-300',
    icon: '⚪',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: '🔵',
  },
}

export default function Classification() {
  const [selectedWaste, setSelectedWaste] = useState('')
  const [classifying, setClassifying] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [mlInfo, setMlInfo] = useState<any>(null)
  const [guide, setGuide] = useState<any>(null)
  const [showGuide, setShowGuide] = useState<string | null>(null)

  useEffect(() => {
    api.getClassificationCategories().then(setCategories).catch(() => {})
    api.getClassifierInfo().then(setMlInfo).catch(() => {})
  }, [])

  const handleClassify = async () => {
    if (!selectedWaste) return
    setClassifying(true)
    try {
      const result = await api.classifyWaste(selectedWaste)
      setResult(result)
    } catch (e) {
      console.error('Classification failed', e)
    } finally {
      setClassifying(false)
    }
  }

  const handleShowGuide = async (category: string) => {
    if (showGuide === category) {
      setShowGuide(null)
      setGuide(null)
      return
    }
    setShowGuide(category)
    try {
      const guide = await api.getTreatmentGuide(category)
      setGuide(guide)
    } catch (e) {
      console.error('Failed to load guide', e)
    }
  }

  const categoryStyle = result ? CATEGORY_STYLES[result.predicted_category] : null

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">AI Waste Classifier</h1>
        <p className="text-gray-400 mt-1">
          Boon-WasteNet v2 — Deep Learning Classifier for Biomedical Waste Categories
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classifier */}
        <div className="lg:col-span-2 space-y-6">
          {/* Classify Form */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-boon-500 to-cyan-500 flex items-center justify-center">
                <ScanLine className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Classify Waste Item</h3>
                <p className="text-xs text-gray-500">
                  Select a waste type for AI-powered classification
                </p>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <select
                value={selectedWaste}
                onChange={(e) => setSelectedWaste(e.target.value)}
                className="input-field flex-1"
              >
                <option value="">Select waste type...</option>
                {WASTE_TYPES.map((wt) => (
                  <option key={wt.value} value={wt.value}>
                    {wt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleClassify}
                disabled={!selectedWaste || classifying}
                className="btn-primary"
              >
                {classifying ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Microscope className="w-4 h-4" />
                )}
                Classify
              </button>
            </div>

            {/* Results */}
            {result && categoryStyle && (
              <div className={`mt-4 p-4 rounded-xl border ${categoryStyle.bg} ${categoryStyle.border}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{categoryStyle.icon}</span>
                    <div>
                      <p className={`text-lg font-bold ${categoryStyle.text}`}>
                        {result.predicted_category.toUpperCase()} — {
                          result.predicted_category === 'yellow' ? 'Infectious & Hazardous' :
                          result.predicted_category === 'red' ? 'Recyclable Contaminated' :
                          result.predicted_category === 'white' ? 'Sharps' : 'Glass & Metals'
                        }
                      </p>
                      <p className="text-sm text-gray-400">
                        Confidence: {(result.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Inference: {result.processing_time_ms}ms</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-1">Treatment Recommendation</p>
                    <p className="text-sm text-gray-400">{result.treatment_recommendation}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">Disposal Guidelines</p>
                    <ul className="space-y-1">
                      {result.disposal_guidelines.map((g: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-boon-500 mt-0.5 shrink-0" />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Treatment Guides */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-semibold text-white">Treatment & Disposal Guides</h3>
                <p className="text-xs text-gray-500">CPCB-compliant disposal protocols by category</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {['yellow', 'red', 'white', 'blue'].map((cat) => {
                const cs = CATEGORY_STYLES[cat]
                return (
                  <button
                    key={cat}
                    onClick={() => handleShowGuide(cat)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      showGuide === cat
                        ? `${cs.bg} ${cs.border}`
                        : 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/50'
                    }`}
                  >
                    <span className="text-lg mb-1 block">{cs.icon}</span>
                    <p className={`text-sm font-medium capitalize ${cs.text}`}>{cat}</p>
                    <p className="text-xs text-gray-500 mt-0.5">View disposal guide</p>
                  </button>
                )
              })}
            </div>

            {guide && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-xl">
                <h4 className="font-medium text-white mb-2 capitalize">{showGuide} Disposal Guide</h4>
                <p className="text-sm text-gray-300 mb-3">{guide.treatment}</p>
                <ul className="space-y-1.5">
                  {guide.guidelines.map((g: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                      <span className="text-boon-400 mt-0.5">•</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Model Info */}
          {mlInfo && (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <FlaskConical className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">Model Info</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Architecture</span>
                  <span className="text-gray-300 text-right">{mlInfo.architecture}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Parameters</span>
                  <span className="text-gray-300">{mlInfo.parameters}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Validation Acc.</span>
                  <span className="text-boon-400 font-medium">
                    {(mlInfo.validation_accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Training Samples</span>
                  <span className="text-gray-300">{mlInfo.training_samples?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Framework</span>
                  <span className="text-gray-300">{mlInfo.framework}</span>
                </div>
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <Beaker className="w-5 h-5 text-boon-400" />
              <h3 className="font-semibold text-white">Categories</h3>
            </div>
            <div className="space-y-2">
              {categories.map((cat: any) => (
                <div key={cat.category} className="p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <p className="text-sm font-medium text-white">{cat.name.split('—')[0].trim()}</p>
                  </div>
                  <p className="text-xs text-gray-500">{cat.treatment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
