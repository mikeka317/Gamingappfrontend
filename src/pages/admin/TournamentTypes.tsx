import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Save, X, AlertCircle } from 'lucide-react';
import { tournamentTypesService, TournamentType } from '@/services/tournamentTypesService';

export default function TournamentTypes() {
  const [tournamentTypes, setTournamentTypes] = useState<TournamentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<TournamentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    players: 4,
    entryFee: 10,
    winnerReward: 0.9,
    adminReward: 0.1,
    description: '',
    icon: '⚔️',
    color: 'bg-red-500',
    displayOrder: 0,
    isActive: true
  });

  // Fetch tournament types
  useEffect(() => {
    fetchTournamentTypes();
  }, []);

  const fetchTournamentTypes = async () => {
    try {
      setLoading(true);
      const types = await tournamentTypesService.getTournamentTypes();
      setTournamentTypes(types);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch tournament types');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      key: '',
      players: 4,
      entryFee: 10,
      winnerReward: 0.9,
      adminReward: 0.1,
      description: '',
      icon: '⚔️',
      color: 'bg-red-500',
      displayOrder: 0,
      isActive: true
    });
  };

  const handleCreate = async () => {
    try {
      setError(null);
      await tournamentTypesService.createTournamentType(formData);
      setSuccess('Tournament type created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchTournamentTypes();
    } catch (error: any) {
      setError(error.message || 'Failed to create tournament type');
    }
  };

  const handleEdit = (type: TournamentType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      key: type.key,
      players: type.players,
      entryFee: type.entryFee,
      winnerReward: type.winnerReward,
      adminReward: type.adminReward,
      description: type.description,
      icon: type.icon,
      color: type.color,
      displayOrder: type.displayOrder,
      isActive: type.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingType) return;

    try {
      setError(null);
      await tournamentTypesService.updateTournamentType(editingType.id, formData);
      setSuccess('Tournament type updated successfully');
      setIsEditDialogOpen(false);
      setEditingType(null);
      resetForm();
      fetchTournamentTypes();
    } catch (error: any) {
      setError(error.message || 'Failed to update tournament type');
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      setError(null);
      await tournamentTypesService.toggleTournamentType(id);
      setSuccess(`Tournament type ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchTournamentTypes();
    } catch (error: any) {
      setError(error.message || 'Failed to toggle tournament type');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament type?')) return;

    try {
      setError(null);
      await tournamentTypesService.deleteTournamentType(id);
      setSuccess('Tournament type deleted successfully');
      fetchTournamentTypes();
    } catch (error: any) {
      setError(error.message || 'Failed to delete tournament type');
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate admin reward when winner reward changes
    if (field === 'winnerReward') {
      setFormData(prev => ({
        ...prev,
        adminReward: 1 - value
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Tournament Types</h1>
        <p className="text-muted-foreground">
          Manage tournament types and their configurations
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert className="border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">All Tournament Types</h2>
          <Badge variant="outline">{tournamentTypes.length} types</Badge>
        </div>
                
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-gradient-gaming hover:shadow-neon-orange">
              <Plus className="h-4 w-4 mr-2" />
              Add Tournament Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Tournament Type</DialogTitle>
              <DialogDescription>
                Add a new tournament type with custom configuration
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="e.g., Clash"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => handleFormChange('key', e.target.value.toLowerCase())}
                  placeholder="e.g., clash"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="players">Players</Label>
                <Input
                  id="players"
                  type="number"
                  value={formData.players}
                  onChange={(e) => handleFormChange('players', parseInt(e.target.value))}
                  min="2"
                  max="64"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="entryFee">Entry Fee</Label>
                <Input
                  id="entryFee"
                  type="number"
                  value={formData.entryFee}
                  onChange={(e) => handleFormChange('entryFee', parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="winnerReward">Winner Reward (%)</Label>
                <Input
                  id="winnerReward"
                  type="number"
                  value={formData.winnerReward * 100}
                  onChange={(e) => handleFormChange('winnerReward', parseFloat(e.target.value) / 100)}
                  min="0"
                  max="100"
                  step="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminReward">Admin Reward (%)</Label>
                <Input
                  id="adminReward"
                  type="number"
                  value={formData.adminReward * 100}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => handleFormChange('icon', e.target.value)}
                  placeholder="⚔️"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Color Class</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => handleFormChange('color', e.target.value)}
                  placeholder="bg-red-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => handleFormChange('displayOrder', parseInt(e.target.value))}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="isActive">Active</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleFormChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Brief description of this tournament type"
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} className="bg-gradient-gaming hover:shadow-neon-orange">
                <Save className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tournament Types List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-gaming rounded-full flex items-center justify-center mx-auto mb-4 shadow-neon-orange">
            <div className="animate-spin">⚔️</div>
          </div>
          <h2 className="text-xl font-semibold text-primary mb-2">Loading Tournament Types...</h2>
          <p className="text-muted-foreground">Please wait while we fetch the data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournamentTypes.map((type) => (
            <Card key={type.id} className="bg-gradient-glow border-border/30 hover:shadow-neon-cyan transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{type.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {type.players} players • ${type.entryFee} entry
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={type.isActive ? "default" : "secondary"}
                    className={type.isActive ? "bg-green-500" : "bg-gray-500"}
                  >
                    {type.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {type.description}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Winner Reward:</span>
                      <div className="text-green-600">{(type.winnerReward * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <span className="font-medium">Admin Reward:</span>
                      <div className="text-blue-600">{(type.adminReward * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(type)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggle(type.id, type.isActive)}
                      className="flex-1"
                    >
                      {type.isActive ? (
                        <ToggleLeft className="h-4 w-4 mr-1" />
                      ) : (
                        <ToggleRight className="h-4 w-4 mr-1" />
                      )}
                      {type.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(type.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Tournament Type</DialogTitle>
            <DialogDescription>
              Update the tournament type configuration
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="e.g., Clash"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-key">Key</Label>
              <Input
                id="edit-key"
                value={formData.key}
                onChange={(e) => handleFormChange('key', e.target.value.toLowerCase())}
                placeholder="e.g., clash"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-players">Players</Label>
              <Input
                id="edit-players"
                type="number"
                value={formData.players}
                onChange={(e) => handleFormChange('players', parseInt(e.target.value))}
                min="2"
                max="64"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-entryFee">Entry Fee</Label>
              <Input
                id="edit-entryFee"
                type="number"
                value={formData.entryFee}
                onChange={(e) => handleFormChange('entryFee', parseFloat(e.target.value))}
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-winnerReward">Winner Reward (%)</Label>
              <Input
                id="edit-winnerReward"
                type="number"
                value={formData.winnerReward * 100}
                onChange={(e) => handleFormChange('winnerReward', parseFloat(e.target.value) / 100)}
                min="0"
                max="100"
                step="1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-adminReward">Admin Reward (%)</Label>
              <Input
                id="edit-adminReward"
                type="number"
                value={formData.adminReward * 100}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Icon</Label>
              <Input
                id="edit-icon"
                value={formData.icon}
                onChange={(e) => handleFormChange('icon', e.target.value)}
                placeholder="⚔️"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color Class</Label>
              <Input
                id="edit-color"
                value={formData.color}
                onChange={(e) => handleFormChange('color', e.target.value)}
                placeholder="bg-red-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-displayOrder">Display Order</Label>
              <Input
                id="edit-displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => handleFormChange('displayOrder', parseInt(e.target.value))}
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-isActive">Active</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleFormChange('isActive', checked)}
                />
                <Label htmlFor="edit-isActive">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Brief description of this tournament type"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} className="bg-gradient-gaming hover:shadow-neon-orange">
              <Save className="h-4 w-4 mr-2" />
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}