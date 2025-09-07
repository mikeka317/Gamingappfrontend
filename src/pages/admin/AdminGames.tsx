import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface Game {
  id: number;
  gameName: string;
  isPublic: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export default function AdminGames() {
  const { toast } = useToast();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [newName, setNewName] = useState<string>('');
  const [newPublic, setNewPublic] = useState<boolean>(true);

  // edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPublic, setEditPublic] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const res = await apiService.get<Game[]>('/games');
      if (res.success && res.data) {
        setGames(res.data as any);
      } else {
        throw new Error(res.message || 'Failed to fetch games');
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to fetch games', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleCreate = async () => {
    try {
      if (!newName.trim()) {
        toast({ title: 'Validation', description: 'Game name is required', variant: 'destructive' });
        return;
      }
      const res = await apiService.post<Game>('/games', { gameName: newName.trim(), isPublic: newPublic });
      if (res.success && res.data) {
        toast({ title: 'Created', description: 'Game added successfully' });
        setNewName('');
        setNewPublic(true);
        fetchGames();
      }
    } catch (e) {
      toast({ title: 'Create failed', description: e instanceof Error ? e.message : 'Error creating game', variant: 'destructive' });
    }
  };

  const handleUpdate = async (game: Game, updates: Partial<Game>) => {
    try {
      setUpdatingId(game.id);
      const res = await apiService.put<Game>(`/games/${game.id}`, updates);
      if (res.success) {
        toast({ title: 'Updated', description: 'Game updated successfully' });
        setEditingId(null);
        await fetchGames();
      }
    } catch (e) {
      toast({ title: 'Update failed', description: e instanceof Error ? e.message : 'Error updating game', variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (game: Game) => {
    try {
      const res = await apiService.delete(`/games/${game.id}`);
      if (res.success) {
        toast({ title: 'Deleted', description: 'Game deleted successfully' });
        fetchGames();
      }
    } catch (e) {
      toast({ title: 'Delete failed', description: e instanceof Error ? e.message : 'Error deleting game', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Games Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs">Game Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Fortnite" />
            </div>
            <div className="flex items-center gap-2">
              <input id="isPublic" type="checkbox" checked={newPublic} onChange={(e) => setNewPublic(e.target.checked)} />
              <Label htmlFor="isPublic" className="text-xs">Public</Label>
              <Button className="ml-auto" onClick={handleCreate}>Add</Button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
                ) : games.length === 0 ? (
                  <TableRow><TableCell colSpan={4}>No games</TableCell></TableRow>
                ) : (
                  games.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>{g.id}</TableCell>
                      <TableCell>
                        {editingId === g.id ? (
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        ) : (
                          <span>{g.gameName}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === g.id ? (
                          <input type="checkbox" checked={editPublic} onChange={(e) => setEditPublic(e.target.checked)} />
                        ) : (
                          <input type="checkbox" checked={g.isPublic} disabled />
                        )}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        {editingId === g.id ? (
                          <Button onClick={() => handleUpdate(g, { gameName: editName.trim(), isPublic: editPublic })} disabled={updatingId === g.id}>
                            {updatingId === g.id ? 'Updating...' : 'Update'}
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => { setEditingId(g.id); setEditName(g.gameName); setEditPublic(g.isPublic); }}>Edit</Button>
                        )}
                        <Button variant="destructive" onClick={() => handleDelete(g)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


