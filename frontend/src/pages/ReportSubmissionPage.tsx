import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Upload, MapPin, Sparkles, AlertCircle, CheckCircle2, 
  HelpCircle, ShieldAlert, ArrowRight, Crosshair
} from 'lucide-react';
import { api } from '../services/api';
import { LeafletMap } from '../components/LeafletMap';
import { ImageAnalysisPreview } from '../types';

export const ReportSubmissionPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('other_uncertain');
  const [obstructionLevel, setObstructionLevel] = useState('none');
  const [affectedAreaSqm, setAffectedAreaSqm] = useState<string>('5');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [location, setLocation] = useState<[number, number]>([13.0827, 80.2707]); // Default Chennai

  // Image & ML Preview State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [mlPreview, setMlPreview] = useState<ImageAnalysisPreview | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setMlPreview(null);
      setError(null);

      // Automatically run AI Preview Analysis
      await runAiPreview(file);
    }
  };

  const runAiPreview = async (file: File) => {
    setAnalyzingImage(true);
    try {
      const res = await api.previewAnalysis(file);
      setMlPreview(res);
      if (res.predicted_category) {
        setCategory(res.predicted_category);
        if (!title) {
          setTitle(`Reported ${res.category_label}`);
        }
      }
    } catch (err: any) {
      console.warn('Live preview analysis error', err);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setLocation(coords);
          if (!address) {
            setAddress(`GPS Coords: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
          }
        },
        () => {
          alert('Could not obtain device location. Please click on the map to pin location.');
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide a title and detailed description of the civic problem.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('user_category', category);
      formData.append('obstruction_level', obstructionLevel);
      if (affectedAreaSqm) formData.append('affected_area_sqm', affectedAreaSqm);
      if (address) formData.append('address', address);
      if (landmark) formData.append('landmark', landmark);
      if (location) {
        formData.append('latitude', String(location[0]));
        formData.append('longitude', String(location[1]));
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const incident = await api.createIncident(formData);
      navigate(`/incident/${incident.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit grievance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Camera className="w-6 h-6 text-blue-600" />
          <span>Report a Civic Issue</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload photographic evidence, drop a map pin, and get instant machine learning triage and statutory grievance advice.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Photo Upload & AI Vision Preview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
              <span>Photographic Evidence & AI Analysis</span>
            </h2>
            {analyzingImage && (
              <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Running PyTorch Inference...</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Upload Box */}
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 text-center space-y-3 cursor-pointer bg-slate-50/50 transition-colors">
              <input
                type="file"
                id="photo-upload"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              <label htmlFor="photo-upload" className="cursor-pointer block space-y-2">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-700">Click to select or drag photo</div>
                <div className="text-[11px] text-slate-400">JPEG, PNG, WebP up to 10MB</div>
              </label>
            </div>

            {/* Image Preview & AI Prediction */}
            <div className="space-y-3">
              {imagePreviewUrl ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 h-44 bg-slate-900 flex items-center justify-center">
                    <img src={imagePreviewUrl} alt="Defect preview" className="h-full w-full object-contain" />
                    {mlPreview && (
                      <div className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-[11px] font-bold text-white border border-slate-700 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-sky-400" />
                        <span>{(mlPreview.confidence * 100).toFixed(1)}% Match</span>
                      </div>
                    )}
                  </div>

                  {mlPreview && (
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Detected: {mlPreview.category_label}</span>
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-200/80 text-blue-900">
                          {mlPreview.model_version}
                        </span>
                      </div>

                      {/* Top Probabilities */}
                      <div className="space-y-1 pt-1">
                        {mlPreview.class_probabilities.slice(0, 3).map((p) => (
                          <div key={p.category} className="space-y-0.5">
                            <div className="flex justify-between text-[11px] text-slate-600">
                              <span>{p.label}</span>
                              <span className="font-semibold">{(p.probability * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.round(p.probability * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-44 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center p-4 text-xs text-slate-400 space-y-1">
                  <ShieldAlert className="w-6 h-6 text-slate-300" />
                  <span>Upload an image to see live machine learning classification and confidence breakdown.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Issue Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
            <span>Grievance Particulars & Obstruction</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grievance Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole causing skidding near Panagal Park descent"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Defect Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pothole_road_damage">Pothole or Road Damage</option>
                <option value="garbage_accumulation">Garbage Accumulation</option>
                <option value="waterlogging_flooding">Waterlogging or Flooding</option>
                <option value="damaged_infrastructure">Damaged Public Infrastructure</option>
                <option value="fallen_tree_obstruction">Fallen Tree or Obstruction</option>
                <option value="other_uncertain">Other or Uncertain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Roadway Obstruction Level</label>
              <select
                value={obstructionLevel}
                onChange={(e) => setObstructionLevel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None (Shoulder or safe boundary)</option>
                <option value="partial_footpath">Partial Footpath / Pedestrian Obstruction</option>
                <option value="lane_blocked">Carriageway Lane Blocked</option>
                <option value="road_closed">Entire Road Closed / Emergency Hazard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Affected Area (m²)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={affectedAreaSqm}
                onChange={(e) => setAffectedAreaSqm(e.target.value)}
                placeholder="e.g. 10"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prominent Landmark</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Apollo Hospital / Ward 136 Office"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description of Hazard</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe how long this issue has persisted, current hazards to traffic or pedestrians, and any previous reference numbers."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Geographic Pin Dropping */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">3</span>
              <span>Pin Exact Incident Location</span>
            </h2>

            <button
              type="button"
              onClick={handleUseMyLocation}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Use Current GPS Location</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address or Ward</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Usman Road, T. Nagar, Chennai"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pinned Coordinates</label>
              <div className="text-xs font-mono text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                {location[0].toFixed(5)}° N, {location[1].toFixed(5)}° E
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-500">Click anywhere on the map to place the defect location marker:</span>
            <LeafletMap
              selectable={true}
              selectedLocation={location}
              onSelectLocation={(lat, lng) => setLocation([lat, lng])}
              className="h-64"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 disabled:opacity-60 hover:scale-[1.02]"
          >
            {submitting ? (
              <span>Submitting & Analyzing...</span>
            ) : (
              <>
                <span>Submit Grievance to Municipal Triage</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
