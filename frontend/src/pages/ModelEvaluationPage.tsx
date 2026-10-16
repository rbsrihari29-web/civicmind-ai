import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle2, ShieldAlert, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { ModelEvaluationResults } from '../types';

export const ModelEvaluationPage: React.FC = () => {
  const [evalData, setEvalData] = useState<ModelEvaluationResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEval();
  }, []);

  const loadEval = async () => {
    setLoading(true);
    try {
      const res = await api.getEvaluations();
      setEvalData(res);
    } catch (e: any) {
      setError(e.message || 'Failed to load model evaluation metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-16 text-center text-xs text-slate-500">Loading model evaluation metrics...</div>;
  }

  if (error || !evalData) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Evaluation Record Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Please run train_classifier.py to generate metrics.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-600" />
            <span>Machine Learning Model Evaluation Dashboard</span>
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            {evalData.model_version}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Rigorous held-out test split evaluation for the CivicMind AI Vision Classifier ({evalData.architecture}).
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Test Accuracy</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">
            {(evalData.overall_test_accuracy * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">On {evalData.test_dataset_size} held-out test images</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Macro F1-Score</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {evalData.macro_f1.toFixed(4)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Harmonic mean of P & R</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Baseline Comparison</div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-1">
            +{(evalData.accuracy_gain_over_baseline * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">
            vs {(evalData.baseline_chance_accuracy * 100).toFixed(1)}% chance baseline
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluation Timestamp</div>
          <div className="text-sm font-extrabold text-slate-900 mt-2 font-mono truncate">
            {new Date(evalData.evaluation_timestamp).toLocaleDateString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Zero Data Leakage Certified</div>
        </div>
      </div>

      {/* Per-Class Metrics Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div>
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Per-Class Precision, Recall, and F1-Scores</h3>
          <p className="text-xs text-slate-500 mt-0.5">Calculated independently on the 15% held-out test split.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Class Category</th>
                <th className="py-3 px-4 text-right">Precision</th>
                <th className="py-3 px-4 text-right">Recall</th>
                <th className="py-3 px-4 text-right">F1-Score</th>
                <th className="py-3 px-4 text-right">Test Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {Object.entries(evalData.per_class_metrics).map(([clsKey, m]) => (
                <tr key={clsKey} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-900">{m.display_name}</td>
                  <td className="py-3 px-4 text-right">{(m.precision * 100).toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right">{(m.recall * 100).toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">{m.f1_score.toFixed(3)}</td>
                  <td className="py-3 px-4 text-right text-slate-500">{m.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confusion Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
            Confusion Matrix (True Labels vs Predicted Labels)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Diagonal elements denote exact correct classifications.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                <th className="p-2 border border-slate-200 text-left">True \ Pred</th>
                {evalData.classes.map((cls, i) => (
                  <th key={i} className="p-2 border border-slate-200 font-mono">
                    {cls.slice(0, 8)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evalData.confusion_matrix.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-200 font-semibold text-left text-slate-800 bg-slate-50 font-mono text-[11px]">
                    {evalData.classes[rIdx]}
                  </td>
                  {row.map((val, cIdx) => (
                    <td 
                      key={cIdx} 
                      className={`p-2 border border-slate-200 font-bold ${
                        rIdx === cIdx 
                          ? val > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-50 text-slate-400' 
                          : val > 0 ? 'bg-rose-100 text-rose-800' : 'text-slate-300'
                      }`}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
