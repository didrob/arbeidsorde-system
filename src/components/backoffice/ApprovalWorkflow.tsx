import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  User, 
  FileText,
  Eye,
  Zap
} from 'lucide-react';

interface TimeAdjustment {
  id: string;
  work_order_id: string;
  user_id: string;
  adjustment_type: 'time_correction' | 'overtime' | 'break_adjustment' | 'admin_adjustment';
  reason: string;
  extra_minutes: number;
  extra_cost: number;
  hourly_rate: number;
  notes: string;
  created_at: string;
  work_orders: {
    title: string;
    customer: { name: string };
  };
  profiles: {
    full_name: string;
  };
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approval_notes?: string;
}

export function ApprovalWorkflow() {
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedAdjustment, setSelectedAdjustment] = useState<TimeAdjustment | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch time adjustments pending approval
  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ['time-adjustments-approval'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_order_time_adjustments')
        .select(`
          *,
          work_orders!inner(
            title,
            customer:customers(name)
          ),
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add mock approval status for demo - in real app this would be a column
      return (data as any[]).map(adjustment => ({
        ...adjustment,
        approval_status: Math.random() > 0.7 ? 'approved' : Math.random() > 0.5 ? 'rejected' : 'pending'
      }));
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async (data: { 
      adjustmentId: string; 
      action: 'approve' | 'reject'; 
      notes: string;
    }) => {
      // In a real implementation, we'd have an approval_status column
      // For now, we'll update the notes field to indicate approval status
      const { error } = await supabase
        .from('work_order_time_adjustments')
        .update({
          notes: `${data.action.toUpperCase()}: ${data.notes}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.adjustmentId);

      if (error) throw error;

      // Create audit log
      await supabase.from('work_order_audit_log').insert({
        work_order_id: selectedAdjustment?.work_order_id,
        action: `time_adjustment_${data.action}`,
        details: {
          adjustment_id: data.adjustmentId,
          approval_notes: data.notes,
          extra_minutes: selectedAdjustment?.extra_minutes,
          extra_cost: selectedAdjustment?.extra_cost
        },
        performed_by: (await supabase.auth.getUser()).data.user?.id
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-adjustments-approval'] });
      toast({
        title: `Justering ${data.action === 'approve' ? 'godkjent' : 'avvist'}`,
        description: 'Tidsregistreringsjusteringen er behandlet.',
      });
      setIsReviewDialogOpen(false);
      setSelectedAdjustment(null);
      setReviewNotes('');
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved behandling',
        description: error.message || 'Kunne ikke behandle justeringen.',
        variant: 'destructive'
      });
    }
  });

  const filteredAdjustments = useMemo(() => {
    let filtered = adjustments;

    // Filter by tab
    if (selectedTab !== 'all') {
      filtered = filtered.filter(adj => adj.approval_status === selectedTab);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(adj => 
        adj.work_orders.title.toLowerCase().includes(query) ||
        adj.work_orders.customer.name.toLowerCase().includes(query) ||
        adj.profiles.full_name.toLowerCase().includes(query) ||
        adj.reason.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [adjustments, selectedTab, searchQuery]);

  const handleReview = (adjustment: TimeAdjustment, action: 'approve' | 'reject') => {
    setSelectedAdjustment(adjustment);
    setReviewAction(action);
    setIsReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedAdjustment) return;
    
    approvalMutation.mutate({
      adjustmentId: selectedAdjustment.id,
      action: reviewAction,
      notes: reviewNotes
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getAdjustmentTypeLabel = (type: string) => {
    switch (type) {
      case 'time_correction': return 'Tidskorrigering';
      case 'overtime': return 'Overtid';
      case 'break_adjustment': return 'Pausejustering';
      case 'admin_adjustment': return 'Admin justering';
      default: return type;
    }
  };

  const pendingCount = adjustments.filter(adj => adj.approval_status === 'pending').length;
  const approvedCount = adjustments.filter(adj => adj.approval_status === 'approved').length;
  const rejectedCount = adjustments.filter(adj => adj.approval_status === 'rejected').length;

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Godkjenningsarbeidsflyt
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {pendingCount} venter godkjenning
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <Input
          placeholder="Søk i justeringer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Venter ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Godkjent ({approvedCount})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Avvist ({rejectedCount})
            </TabsTrigger>
            <TabsTrigger value="all">
              Alle ({adjustments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-4">
            {filteredAdjustments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen justeringer funnet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arbeidsordre</TableHead>
                    <TableHead>Medarbeider</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Tid/Kostnad</TableHead>
                    <TableHead>Begrunnelse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dato</TableHead>
                    <TableHead>Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdjustments.map((adjustment) => (
                    <TableRow key={adjustment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{adjustment.work_orders.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {adjustment.work_orders.customer.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {adjustment.profiles.full_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getAdjustmentTypeLabel(adjustment.adjustment_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {adjustment.extra_minutes} min
                          </div>
                          <div className="text-muted-foreground">
                            kr {adjustment.extra_cost}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {adjustment.reason}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(adjustment.approval_status || 'pending')}
                        >
                          {getStatusIcon(adjustment.approval_status || 'pending')}
                          <span className="ml-1">
                            {adjustment.approval_status === 'pending' ? 'Venter' :
                             adjustment.approval_status === 'approved' ? 'Godkjent' : 'Avvist'}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(adjustment.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {adjustment.approval_status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleReview(adjustment, 'approve')}
                                className="h-8 text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleReview(adjustment, 'reject')}
                                className="h-8 text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="h-8">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {reviewAction === 'approve' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                {reviewAction === 'approve' ? 'Godkjenn' : 'Avvis'} justering
              </DialogTitle>
            </DialogHeader>

            {selectedAdjustment && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Arbeidsordre</div>
                        <div className="text-muted-foreground">
                          {selectedAdjustment.work_orders.title}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Medarbeider</div>
                        <div className="text-muted-foreground">
                          {selectedAdjustment.profiles.full_name}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Type justering</div>
                        <div className="text-muted-foreground">
                          {getAdjustmentTypeLabel(selectedAdjustment.adjustment_type)}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Tid/Kostnad</div>
                        <div className="text-muted-foreground">
                          {selectedAdjustment.extra_minutes} min / kr {selectedAdjustment.extra_cost}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="font-medium">Begrunnelse</div>
                        <div className="text-muted-foreground">
                          {selectedAdjustment.reason}
                        </div>
                      </div>
                      {selectedAdjustment.notes && (
                        <div className="col-span-2">
                          <div className="font-medium">Notater</div>
                          <div className="text-muted-foreground">
                            {selectedAdjustment.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {reviewAction === 'approve' ? 'Godkjenningsnotater' : 'Avvisningsgrunn'}
                  </label>
                  <Textarea
                    placeholder={
                      reviewAction === 'approve' 
                        ? "Legg til notater for godkjenning (valgfritt)..."
                        : "Beskriv hvorfor justeringen avvises..."
                    }
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                Avbryt
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={approvalMutation.isPending || (reviewAction === 'reject' && !reviewNotes.trim())}
                className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {approvalMutation.isPending && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {reviewAction === 'approve' ? 'Godkjenn' : 'Avvis'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}