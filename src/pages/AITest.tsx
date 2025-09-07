import React, { useState } from 'react';
import { AIVerification } from '../components/AIVerification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { AIScoreboardAnalysis, AIChallengeVerification } from '../services/aiVerificationService';

const AITest: React.FC = () => {
  const [lastResult, setLastResult] = useState<AIScoreboardAnalysis | AIChallengeVerification | null>(null);

  const handleVerificationComplete = (result: AIScoreboardAnalysis | AIChallengeVerification) => {
    setLastResult(result);
    console.log('AI Verification completed:', result);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🤖 AI Scoreboard Verification Test</h1>
        <p className="text-gray-600">
          Test the AI-powered scoreboard verification system. Upload screenshots and let AI analyze the results.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Verification Component */}
        <div>
          <Tabs defaultValue="scoreboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scoreboard">Scoreboard Analysis</TabsTrigger>
              <TabsTrigger value="challenge-proof">Challenge Proof</TabsTrigger>
            </TabsList>
            
            <TabsContent value="scoreboard" className="mt-4">
              <AIVerification
                mode="scoreboard"
                onVerificationComplete={handleVerificationComplete}
              />
            </TabsContent>
            
            <TabsContent value="challenge-proof" className="mt-4">
              <AIVerification
                mode="challenge-proof"
                challengeId="test-challenge-123"
                gameType="FPS"
                onVerificationComplete={handleVerificationComplete}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Results Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>📊 Last Analysis Result</CardTitle>
              <CardDescription>
                Summary of the most recent AI verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lastResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge 
                      variant={lastResult.iWin ? "default" : "secondary"}
                      className={lastResult.iWin ? "bg-green-500" : "bg-gray-500"}
                    >
                      {lastResult.iWin ? "Victory! 🎉" : "Defeat 😔"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Winner</p>
                      <p className="font-medium">{lastResult.winner}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Score</p>
                      <p className="font-medium">{lastResult.score}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">AI Confidence</p>
                    <Badge className="bg-blue-100 text-blue-800">
                      {(lastResult.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Players</p>
                    <div className="text-sm space-y-1">
                      {lastResult.players.map((player, index) => (
                        <p key={index}>{player}</p>
                      ))}
                    </div>
                  </div>
                  
                  {/* Additional fields for challenge-proof mode */}
                  {'verificationResult' in lastResult && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Verification</p>
                        <Badge className="bg-purple-100 text-purple-800">
                          {lastResult.verificationResult.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Evidence Quality</p>
                        <Badge variant="outline">
                          {lastResult.evidenceQuality.toUpperCase()}
                        </Badge>
                      </div>
                    </>
                  )}
                  
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Analyzed: {new Date(lastResult.analyzedAt).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No analysis results yet</p>
                  <p className="text-sm">Upload a screenshot to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Status */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">🔗 API Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>AI Verification Service:</span>
                  <Badge className="bg-green-100 text-green-800">Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>OpenAI Integration:</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>File Upload:</span>
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>📋 How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Scoreboard Analysis Mode</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Upload a screenshot of any game scoreboard</li>
                <li>• Enter your team/player name</li>
                <li>• Get instant AI analysis of the results</li>
                <li>• Perfect for quick game result verification</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Challenge Proof Mode</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Upload proof of challenge completion</li>
                <li>• Provide detailed description of your proof</li>
                <li>• Get comprehensive AI verification</li>
                <li>• Includes evidence quality assessment</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Tips for Best Results</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use clear, high-quality screenshots</li>
              <li>• Ensure scoreboards are fully visible</li>
              <li>• Include timestamps when possible</li>
              <li>• Provide clear team/player names</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AITest;
