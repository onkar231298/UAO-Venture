import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { StickyNote, Plus, Pin, Trash2, Edit2, AlertTriangle, MessageSquare, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface CompanyNote {
  id: number;
  companyId: number;
  noteType: string;
  title: string | null;
  content: string;
  productsDiscussed: number[];
  isPinned: boolean;
  isPrivate: boolean;
  priority: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CompanyNotesProps {
  companyId: number;
  currentUserId: string;
}

const NOTE_TYPES = [
  { id: 'general', label: 'General Note', color: 'bg-gray-100 text-gray-700' },
  { id: 'product_discussion', label: 'Product Discussion', color: 'bg-blue-100 text-blue-700' },
  { id: 'communication_denied', label: 'Communication Denied', color: 'bg-red-100 text-red-700' },
  { id: 'follow_up', label: 'Follow Up Required', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'important', label: 'Important', color: 'bg-purple-100 text-purple-700' },
  { id: 'warning', label: 'Warning', color: 'bg-orange-100 text-orange-700' },
];

export function CompanyNotes({ companyId, currentUserId }: CompanyNotesProps) {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CompanyNote | null>(null);
  
  const [newNote, setNewNote] = useState({
    noteType: 'general',
    title: '',
    content: '',
    isPinned: false,
    isPrivate: false,
    priority: 'normal',
  });

  const { data: notes = [], isLoading } = useQuery<CompanyNote[]>({
    queryKey: ['/api/crm/companies', companyId, 'notes'],
    enabled: !!companyId,
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: typeof newNote) => {
      return apiRequest(`/api/crm/companies/${companyId}/notes`, {
        method: 'POST',
        body: JSON.stringify(noteData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'notes'] });
      setAddDialogOpen(false);
      resetForm();
      toast({ title: "Note added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add note", description: error.message, variant: "destructive" });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof newNote> }) => {
      return apiRequest(`/api/crm/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'notes'] });
      setEditingNote(null);
      toast({ title: "Note updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update note", description: error.message, variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      return apiRequest(`/api/crm/notes/${noteId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'notes'] });
      toast({ title: "Note deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete note", description: error.message, variant: "destructive" });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: number; isPinned: boolean }) => {
      return apiRequest(`/api/crm/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPinned }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/companies', companyId, 'notes'] });
    },
  });

  const resetForm = () => {
    setNewNote({
      noteType: 'general',
      title: '',
      content: '',
      isPinned: false,
      isPrivate: false,
      priority: 'normal',
    });
  };

  const handleSubmit = () => {
    if (!newNote.content.trim()) {
      toast({ title: "Note content is required", variant: "destructive" });
      return;
    }
    createNoteMutation.mutate(newNote);
  };

  const handleEditSubmit = () => {
    if (!editingNote) return;
    updateNoteMutation.mutate({
      id: editingNote.id,
      data: {
        noteType: editingNote.noteType,
        title: editingNote.title || '',
        content: editingNote.content,
        isPinned: editingNote.isPinned,
        isPrivate: editingNote.isPrivate,
        priority: editingNote.priority,
      },
    });
  };

  const getNoteTypeInfo = (type: string) => {
    return NOTE_TYPES.find(t => t.id === type) || NOTE_TYPES[0];
  };

  if (isLoading) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
        <p>Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Special Notes ({notes.length})
        </h4>
        
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-note">
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Special Note</DialogTitle>
              <DialogDescription>
                Record important information about this company
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Note Type</Label>
                <Select
                  value={newNote.noteType}
                  onValueChange={(value) => setNewNote(prev => ({ ...prev, noteType: value }))}
                >
                  <SelectTrigger data-testid="select-note-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Title (Optional)</Label>
                <Input
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief title for this note"
                  data-testid="input-note-title"
                />
              </div>
              
              <div>
                <Label>Note Content *</Label>
                <Textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your note here... (e.g., discussed organic honey samples, customer prefers bulk packaging)"
                  rows={4}
                  data-testid="input-note-content"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pinned"
                    checked={newNote.isPinned}
                    onCheckedChange={(checked) => setNewNote(prev => ({ ...prev, isPinned: !!checked }))}
                    data-testid="checkbox-pin-note"
                  />
                  <Label htmlFor="pinned" className="text-sm flex items-center gap-1">
                    <Pin className="h-3 w-3" /> Pin to top
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="private"
                    checked={newNote.isPrivate}
                    onCheckedChange={(checked) => setNewNote(prev => ({ ...prev, isPrivate: !!checked }))}
                    data-testid="checkbox-private-note"
                  />
                  <Label htmlFor="private" className="text-sm">Private (only visible to you)</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={createNoteMutation.isPending}
                  data-testid="button-submit-note"
                >
                  {createNoteMutation.isPending ? "Adding..." : "Add Note"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notes yet</p>
              <p className="text-sm">Add notes about product discussions, communication status, or important information</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const typeInfo = getNoteTypeInfo(note.noteType);
            const isOwner = note.createdBy === currentUserId;
            
            return (
              <Card key={note.id} className={note.isPinned ? 'border-yellow-300 bg-yellow-50/50' : ''}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {note.isPinned && (
                          <Pin className="h-4 w-4 text-yellow-600" />
                        )}
                        <Badge className={typeInfo.color}>
                          {typeInfo.label}
                        </Badge>
                        {note.isPrivate && (
                          <Badge variant="outline" className="text-xs">Private</Badge>
                        )}
                        {note.noteType === 'communication_denied' && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      {note.title && (
                        <h5 className="font-medium mb-1">{note.title}</h5>
                      )}
                      
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {note.createdBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(note.createdAt), 'MMM dd, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePinMutation.mutate({ id: note.id, isPinned: !note.isPinned })}
                        className="h-8 w-8 p-0"
                        title={note.isPinned ? "Unpin" : "Pin to top"}
                      >
                        <Pin className={`h-4 w-4 ${note.isPinned ? 'text-yellow-600' : 'text-gray-400'}`} />
                      </Button>
                      
                      {isOwner && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingNote(note)}
                            className="h-8 w-8 p-0"
                            title="Edit note"
                            data-testid={`button-edit-note-${note.id}`}
                          >
                            <Edit2 className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Delete note"
                                data-testid={`button-delete-note-${note.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Note</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this note? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteNoteMutation.mutate(note.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          
          {editingNote && (
            <div className="space-y-4">
              <div>
                <Label>Note Type</Label>
                <Select
                  value={editingNote.noteType}
                  onValueChange={(value) => setEditingNote(prev => prev ? { ...prev, noteType: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Title (Optional)</Label>
                <Input
                  value={editingNote.title || ''}
                  onChange={(e) => setEditingNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Brief title for this note"
                />
              </div>
              
              <div>
                <Label>Note Content *</Label>
                <Textarea
                  value={editingNote.content}
                  onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                  rows={4}
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-pinned"
                    checked={editingNote.isPinned}
                    onCheckedChange={(checked) => setEditingNote(prev => prev ? { ...prev, isPinned: !!checked } : null)}
                  />
                  <Label htmlFor="edit-pinned" className="text-sm flex items-center gap-1">
                    <Pin className="h-3 w-3" /> Pin to top
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-private"
                    checked={editingNote.isPrivate}
                    onCheckedChange={(checked) => setEditingNote(prev => prev ? { ...prev, isPrivate: !!checked } : null)}
                  />
                  <Label htmlFor="edit-private" className="text-sm">Private</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingNote(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditSubmit} 
                  disabled={updateNoteMutation.isPending}
                >
                  {updateNoteMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
