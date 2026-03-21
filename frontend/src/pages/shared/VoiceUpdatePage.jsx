import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Mic, Video, Upload, Play, Pause, StopCircle, Volume2,
  BarChart3, Smile, Meh, Frown, Activity, 
  RefreshCw, Trash2, Download, Clock, Waves,
} from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceUpdatePage = () => {
  const { projectId } = useParams();
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [emotion, setEmotion] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        setRecordedChunks(chunks);
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };
      
      recorder.start();
      setRecording(true);
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      
      const res = await api.post('/voice-updates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setUploadedFile(file);
      setTranscription(res.data.transcription);
      setEmotion(res.data.emotion);
      toast.success('Voice update uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const getEmotionIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return <Smile className="w-8 h-8 text-green-500" />;
      case 'negative': return <Frown className="w-8 h-8 text-red-500" />;
      default: return <Meh className="w-8 h-8 text-yellow-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to={`/student/projects/${projectId}`} className="hover:text-blue-600">
            My Projects
          </Link>
          <span>/</span>
          <span>Voice Update</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Mic className="w-7 h-7 text-purple-600" />
          Voice & Video Updates
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Record your weekly update or upload audio/video for AI transcription
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recording Panel */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Record Update</h3>
            
            {/* Waveform Visualization */}
            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
              {recording ? (
                <div className="flex items-center gap-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 bg-red-500 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 40 + 20}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Waves className="w-12 h-12 text-gray-400" />
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {!recording && !audioUrl ? (
                <button
                  onClick={startRecording}
                  className="btn-primary flex items-center gap-2 px-6"
                >
                  <Mic className="w-5 h-5" />
                  Start Recording
                </button>
              ) : recording ? (
                <button
                  onClick={stopRecording}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
                >
                  <StopCircle className="w-5 h-5" />
                  Stop Recording
                </button>
              ) : (
                <>
                  <button
                    onClick={isPlaying ? pauseAudio : playAudio}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-5 h-5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" /> Play
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setAudioUrl(null);
                      setRecordedChunks([]);
                    }}
                    className="btn-secondary"
                  >
                    <RefreshCw className="w-5 h-5" /> Record Again
                  </button>
                </>
              )}
            </div>

            {audioUrl && (
              <div className="mt-4">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.target.duration)}
                />
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Volume2 className="w-4 h-4" />
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Upload Panel */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Or Upload File</h3>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">MP3, WAV, MP4, WEBM (max 50MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="audio/*,video/*"
                onChange={handleFileUpload}
                disabled={loading}
              />
            </label>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">AI Analysis</h3>

          {loading && <LoadingSpinner text="Analyzing..." />}

          {transcription && !loading && (
            <div className="space-y-4 animate-fade-in">
              {/* Emotion Card */}
              <div className="card bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Detected Emotion</div>
                    <div className="flex items-center gap-3">
                      {getEmotionIcon(emotion?.sentiment)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white capitalize">
                          {emotion?.sentiment || 'Neutral'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Confidence: {Math.round((emotion?.confidence || 0) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  <Activity className="w-8 h-8 text-purple-500 opacity-50" />
                </div>
              </div>

              {/* Transcript Card */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Transcript</h4>
                  <span className="text-xs text-gray-500">AI Generated</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-gray-700 dark:text-gray-300">
                  {transcription}
                </div>
              </div>

              {/* Analysis Card */}
              <div className="card">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Speech Analysis</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {emotion?.highlights?.positive || 0}
                    </div>
                    <div className="text-xs text-gray-500">Positive Keywords</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {emotion?.highlights?.negative || 0}
                    </div>
                    <div className="text-xs text-gray-500">Negative Keywords</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {transcription.split(' ').length}
                    </div>
                    <div className="text-xs text-gray-500">Words Spoken</div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                className="btn-primary w-full"
                onClick={() => toast.success('Update submitted successfully!')}
              >
                Submit Update
              </button>
            </div>
          )}

          {!transcription && !loading && (
            <div className="card text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <Mic className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-500 dark:text-gray-400">No Analysis Yet</h3>
              <p className="text-sm text-gray-400 mt-1">
                Record or upload your voice update to see AI analysis
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default VoiceUpdatePage;
