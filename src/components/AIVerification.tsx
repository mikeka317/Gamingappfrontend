import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { aiVerificationService, AIScoreboardAnalysis, AIChallengeVerification } from '../services/aiVerificationService';

interface AIVerificationProps {
  challengeId?: string;
  gameType?: string;
  onVerificationComplete?: (result: AIScoreboardAnalysis | AIChallengeVerification) => void;
  mode?: 'scoreboard' | 'challenge-proof';
}

export const AIVerification: React.FC<AIVerificationProps> = ({
  challengeId,
  gameType,
  onVerificationComplete,
  mode = 'scoreboard'
}) => {
  const [myTeam, setMyTeam] = useState('');
  const [proofDescription, setProofDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIScoreboardAnalysis | AIChallengeVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !myTeam.trim()) {
      setError('Please select a screenshot and enter your team/player name');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      let analysisResult: AIScoreboardAnalysis | AIChallengeVerification;

      if (mode === 'challenge-proof' && challengeId) {
        if (!proofDescription.trim()) {
          setError('Please provide a description of your proof');
          setIsAnalyzing(false);
          return;
        }

        analysisResult = await aiVerificationService.verifyChallengeProof(
          selectedFile,
          {
            challengeId,
            myTeam: myTeam.trim(),
            proofDescription: proofDescription.trim(),
            gameType
          }
        );
      } else {
        analysisResult = await aiVerificationService.analyzeScoreboard(
          selectedFile,
          {
            myTeam: myTeam.trim(),
            challengeId,
            gameType
          }
        );
      }

      setResult(analysisResult);
      onVerificationComplete?.(analysisResult);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'AI analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setMyTeam('');
    setProofDescription('');
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'needs_review': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🤖 AI Scoreboard Verification
          </CardTitle>
          <CardDescription>
            {mode === 'challenge-proof' 
              ? 'Upload a screenshot of your game completion proof for AI verification'
              : 'Upload a screenshot of the game scoreboard for AI analysis'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Team/Player Name Input */}
          <div className="space-y-2">
            <Label htmlFor="myTeam">
              {mode === 'challenge-proof' ? 'Your Team/Player Name' : 'Your Team/Player Name'}
            </Label>
            <Input
              id="myTeam"
              placeholder="Enter your team name or player name"
              value={myTeam}
              onChange={(e) => setMyTeam(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>

          {/* Proof Description (for challenge-proof mode) */}
          {mode === 'challenge-proof' && (
            <div className="space-y-2">
              <Label htmlFor="proofDescription">Proof Description</Label>
              <Textarea
                id="proofDescription"
                placeholder="Describe what this screenshot proves (e.g., 'Completed the challenge first', 'Achieved highest score')"
                value={proofDescription}
                onChange={(e) => setProofDescription(e.target.value)}
                disabled={isAnalyzing}
                rows={3}
              />
            </div>
          )}

          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>Screenshot Upload</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                  <p className="text-sm text-gray-600">
                    Selected: <span className="font-medium">{selectedFile.name}</span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    disabled={isAnalyzing}
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Drag and drop a screenshot here, or{' '}
                    <button
                      type="button"
                      className="text-blue-500 hover:text-blue-600 font-medium"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      browse files
                    </button>
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports: JPG, PNG, GIF (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={!selectedFile || !myTeam.trim() || isAnalyzing}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  🤖 Analyze with AI
                </>
              )}
            </Button>
            
            {result && (
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Winner and Result */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Winner</p>
                <p className="text-lg font-semibold">{result.winner}</p>
              </div>
              <Badge 
                variant={result.iWin ? "default" : "secondary"}
                className={result.iWin ? "bg-green-500" : "bg-gray-500"}
              >
                {result.iWin ? "You Won! 🎉" : "You Lost 😔"}
              </Badge>
            </div>

            {/* Score */}
            <div>
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-lg font-medium">{result.score}</p>
            </div>

            {/* Players */}
            <div>
              <p className="text-sm text-gray-600">Players</p>
              <div className="space-y-1">
                {result.players.map((player, index) => (
                  <p key={index} className="text-sm">{player}</p>
                ))}
              </div>
            </div>

            {/* Confidence */}
            <div>
              <p className="text-sm text-gray-600">AI Confidence</p>
              <Badge className={getConfidenceColor(result.confidence)}>
                {(result.confidence * 100).toFixed(0)}%
              </Badge>
            </div>

            {/* Additional fields for challenge-proof mode */}
            {mode === 'challenge-proof' && 'verificationResult' in result && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Verification Status</p>
                  <Badge className={getVerificationStatusColor(result.verificationResult)}>
                    {result.verificationResult.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Evidence Quality</p>
                  <Badge variant="outline">
                    {result.evidenceQuality.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-600">AI Reasoning</p>
                  <p className="text-sm">{result.reasoning}</p>
                </div>

                {result.suggestions.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Suggestions</p>
                    <ul className="text-sm space-y-1">
                      {result.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Analysis timestamp */}
            <div className="text-xs text-gray-500 pt-2 border-t">
              Analyzed at: {new Date(result.analyzedAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIVerification;
