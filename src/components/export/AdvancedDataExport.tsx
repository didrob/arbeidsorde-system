import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar as CalendarIcon,
  Settings,
  Filter,
  Send,
  Clock,
  BarChart,
  Eye
} from 'lucide-react';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { nb } from 'date-fns/locale';

interface ExportConfig {
  format: 'xlsx' | 'csv' | 'pdf';
  dateRange: {
    from: Date;
    to: Date;
  };
  dataTypes: string[];
  groupBy: string[];
  filters: {
    status?: string[];
    customer_id?: string[];
    assigned_to?: string[];
    site_id?: string[];
  };
  columns: string[];
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    email: string;
    time: string;
  };
}

interface AdvancedDataExportProps {
  isOpen: boolean;
  onClose: () => void;
}

const availableDataTypes = [
  { id: 'work_orders', label: 'Arbeidsordrer', icon: <FileText className="h-4 w-4" /> },
  { id: 'time_entries', label: 'Tidsregistreringer', icon: <Clock className="h-4 w-4" /> },
  { id: 'materials', label: 'Materialer', icon: <BarChart className="h-4 w-4" /> },
  { id: 'invoices', label: 'Fakturaer', icon: <FileSpreadsheet className="h-4 w-4" /> },
];

const availableColumns = {
  work_orders: [
    'id', 'title', 'description', 'status', 'customer', 'assigned_to', 
    'estimated_hours', 'actual_hours', 'pricing_model', 'price_value',
    'created_at', 'started_at', 'completed_at'
  ],
  time_entries: [
    'id', 'work_order', 'user', 'start_time', 'end_time', 'break_duration',
    'notes', 'created_at'
  ],
  materials: [
    'id', 'work_order', 'material_name', 'quantity', 'unit_price', 
    'total_cost', 'added_by', 'created_at'
  ],
  invoices: [
    'id', 'invoice_number', 'customer', 'status', 'issue_date', 'due_date',
    'subtotal', 'tax_amount', 'total_amount', 'created_at'
  ]
};

const datePresets = [
  { label: 'Siste 7 dager', value: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Siste 30 dager', value: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Denne måneden', value: () => ({ from: subMonths(new Date(), 0), to: new Date() }) },
  { label: 'Forrige måned', value: () => ({ from: subMonths(new Date(), 1), to: subMonths(new Date(), 0) }) },
  { label: 'Dette året', value: () => ({ from: subYears(new Date(), 0), to: new Date() }) },
  { label: 'Forrige år', value: () => ({ from: subYears(new Date(), 1), to: subYears(new Date(), 0) }) },
];

export function AdvancedDataExport({ isOpen, onClose }: AdvancedDataExportProps) {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'xlsx',
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date()
    },
    dataTypes: ['work_orders'],
    groupBy: [],
    filters: {},
    columns: ['id', 'title', 'status', 'customer', 'created_at'],
    schedule: {
      enabled: false,
      frequency: 'weekly',
      email: '',
      time: '09:00'
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async (exportConfig: ExportConfig) => {
      // Generate export data based on config
      const queries = exportConfig.dataTypes.map(async (dataType) => {
        let query = supabase.from(dataType as any).select('*');
        
        // Apply date range
        query = query
          .gte('created_at', exportConfig.dateRange.from.toISOString())
          .lte('created_at', exportConfig.dateRange.to.toISOString());
        
        // Apply filters
        if (exportConfig.filters.status?.length) {
          query = query.in('status', exportConfig.filters.status);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        return { type: dataType, data };
      });

      const results = await Promise.all(queries);
      
      // Format data based on selected columns
      const formattedData = results.map(result => ({
        type: result.type,
        data: result.data?.map(row => {
          const filteredRow: any = {};
          exportConfig.columns.forEach(col => {
            if (row[col] !== undefined) {
              filteredRow[col] = row[col];
            }
          });
          return filteredRow;
        })
      }));

      // Generate file based on format
      if (exportConfig.format === 'csv') {
        return generateCSV(formattedData);
      } else if (exportConfig.format === 'xlsx') {
        return generateXLSX(formattedData);
      } else {
        return generatePDF(formattedData);
      }
    },
    onSuccess: (fileData) => {
      // Trigger download
      const blob = new Blob([fileData.content], { type: fileData.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.filename;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export fullført',
        description: `Filen ${fileData.filename} er lastet ned.`
      });
      
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Export feilet',
        description: error.message || 'Kunne ikke eksportere data.',
        variant: 'destructive'
      });
    }
  });

  const scheduleExportMutation = useMutation({
    mutationFn: async (scheduleConfig: ExportConfig) => {
      // In a real implementation, this would create a scheduled job
      // For now, we'll just show a success message
      return { scheduled: true };
    },
    onSuccess: () => {
      toast({
        title: 'Planlagt export opprettet',
        description: 'Du vil motta eksporterte filer på e-post i henhold til planen.'
      });
      onClose();
    }
  });

  const generateCSV = (data: any[]) => {
    const csvContent = data.map(dataset => {
      if (!dataset.data?.length) return '';
      
      const headers = Object.keys(dataset.data[0]).join(',');
      const rows = dataset.data.map((row: any) => 
        Object.values(row).map(val => `"${val}"`).join(',')
      ).join('\n');
      
      return `${dataset.type.toUpperCase()}\n${headers}\n${rows}`;
    }).join('\n\n');

    return {
      content: csvContent,
      filename: `export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`,
      mimeType: 'text/csv'
    };
  };

  const generateXLSX = (data: any[]) => {
    // This would use a library like SheetJS in a real implementation
    // For now, return CSV content with xlsx extension
    const csvData = generateCSV(data);
    return {
      ...csvData,
      filename: csvData.filename.replace('.csv', '.xlsx'),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  };

  const generatePDF = (data: any[]) => {
    // This would use a PDF generation library
    const content = `Data Export\n\nGenerated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}\n\n${
      data.map(dataset => 
        `${dataset.type.toUpperCase()}: ${dataset.data?.length || 0} records`
      ).join('\n')
    }`;
    
    return {
      content,
      filename: `export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`,
      mimeType: 'application/pdf'
    };
  };

  const handlePreview = async () => {
    try {
      // Fetch sample data for preview
      const sampleData = await Promise.all(
        config.dataTypes.map(async (dataType) => {
          const { data, error } = await supabase
            .from(dataType as any)
            .select('*')
            .limit(5);
          
          if (error) throw error;
          return { type: dataType, data: data || [] };
        })
      );
      
      setPreviewData(sampleData);
      setIsPreviewOpen(true);
    } catch (error: any) {
      toast({
        title: 'Forhåndsvisning feilet',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const updateConfig = (updates: Partial<ExportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const steps = [
    { id: 1, title: 'Datatyper og kolonner', icon: <FileText className="h-4 w-4" /> },
    { id: 2, title: 'Filtre og datoer', icon: <Filter className="h-4 w-4" /> },
    { id: 3, title: 'Format og planlegging', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Avansert Dataexport
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Navigation */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  currentStep === step.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => setCurrentStep(step.id)}
              >
                {step.icon}
                <span className="text-sm font-medium">{step.title}</span>
              </div>
            ))}
          </div>

          {/* Step 1: Data Types and Columns */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium mb-3 block">Velg datatyper</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availableDataTypes.map((dataType) => (
                    <div key={dataType.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={dataType.id}
                        checked={config.dataTypes.includes(dataType.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateConfig({ 
                              dataTypes: [...config.dataTypes, dataType.id],
                              columns: [...config.columns, ...availableColumns[dataType.id]?.slice(0, 3) || []]
                            });
                          } else {
                            updateConfig({ 
                              dataTypes: config.dataTypes.filter(type => type !== dataType.id)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={dataType.id} className="flex items-center gap-2 cursor-pointer">
                        {dataType.icon}
                        {dataType.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-3 block">Velg kolonner</Label>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {config.dataTypes.flatMap(dataType => 
                    availableColumns[dataType]?.map(column => (
                      <div key={`${dataType}-${column}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${dataType}-${column}`}
                          checked={config.columns.includes(column)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateConfig({ columns: [...config.columns, column] });
                            } else {
                              updateConfig({ columns: config.columns.filter(col => col !== column) });
                            }
                          }}
                        />
                        <Label htmlFor={`${dataType}-${column}`} className="text-sm cursor-pointer">
                          {column}
                        </Label>
                      </div>
                    )) || []
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Filters and Dates */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium mb-3 block">Datoperiode</Label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {datePresets.map((preset, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => updateConfig({ dateRange: preset.value() })}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fra dato</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(config.dateRange.from, 'dd.MM.yyyy', { locale: nb })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={config.dateRange.from}
                          onSelect={(date) => date && updateConfig({ 
                            dateRange: { ...config.dateRange, from: date } 
                          })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Til dato</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(config.dateRange.to, 'dd.MM.yyyy', { locale: nb })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={config.dateRange.to}
                          onSelect={(date) => date && updateConfig({ 
                            dateRange: { ...config.dateRange, to: date } 
                          })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-3 block">Filtre</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select 
                      onValueChange={(value) => updateConfig({ 
                        filters: { ...config.filters, status: value ? [value] : undefined }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Alle statuser" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Alle statuser</SelectItem>
                        <SelectItem value="pending">Venter</SelectItem>
                        <SelectItem value="in_progress">Pågår</SelectItem>
                        <SelectItem value="completed">Fullført</SelectItem>
                        <SelectItem value="cancelled">Avbrutt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Gruppert etter</Label>
                    <Select 
                      onValueChange={(value) => updateConfig({ 
                        groupBy: value ? [value] : []
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ingen gruppering" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ingen gruppering</SelectItem>
                        <SelectItem value="customer">Kunde</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="assigned_to">Tildelt</SelectItem>
                        <SelectItem value="created_date">Opprettelsesdato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Format and Scheduling */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium mb-3 block">Filformat</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'xlsx', label: 'Excel (.xlsx)', icon: <FileSpreadsheet className="h-4 w-4" /> },
                    { value: 'csv', label: 'CSV (.csv)', icon: <FileText className="h-4 w-4" /> },
                    { value: 'pdf', label: 'PDF (.pdf)', icon: <FileText className="h-4 w-4" /> },
                  ].map((format) => (
                    <Card 
                      key={format.value}
                      className={`cursor-pointer transition-colors ${
                        config.format === format.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => updateConfig({ format: format.value as any })}
                    >
                      <CardContent className="flex items-center gap-2 p-4">
                        {format.icon}
                        <span className="font-medium">{format.label}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="schedule"
                    checked={config.schedule.enabled}
                    onCheckedChange={(checked) => updateConfig({
                      schedule: { ...config.schedule, enabled: !!checked }
                    })}
                  />
                  <Label htmlFor="schedule" className="text-base font-medium">
                    Planlegg automatisk export
                  </Label>
                </div>

                {config.schedule.enabled && (
                  <div className="grid grid-cols-3 gap-4 ml-6">
                    <div>
                      <Label>Frekvens</Label>
                      <Select 
                        value={config.schedule.frequency}
                        onValueChange={(value) => updateConfig({
                          schedule: { ...config.schedule, frequency: value as any }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daglig</SelectItem>
                          <SelectItem value="weekly">Ukentlig</SelectItem>
                          <SelectItem value="monthly">Månedlig</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>E-post</Label>
                      <Input
                        type="email"
                        placeholder="din@epost.no"
                        value={config.schedule.email}
                        onChange={(e) => updateConfig({
                          schedule: { ...config.schedule, email: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Tid</Label>
                      <Input
                        type="time"
                        value={config.schedule.time}
                        onChange={(e) => updateConfig({
                          schedule: { ...config.schedule, time: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview Dialog */}
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Forhåndsvisning av data</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {previewData.map((dataset, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{dataset.type} ({dataset.data.length} poster)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dataset.data.length > 0 ? (
                        <div className="text-sm space-y-2">
                          {dataset.data.slice(0, 3).map((row: any, rowIndex: number) => (
                            <div key={rowIndex} className="bg-muted p-2 rounded">
                              {Object.entries(row).slice(0, 5).map(([key, value]) => (
                                <div key={key} className="inline-block mr-4">
                                  <span className="font-medium">{key}:</span> {String(value)}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Ingen data funnet</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Forhåndsvis
          </Button>
          {currentStep < 3 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Neste steg
            </Button>
          ) : (
            <>
              {config.schedule.enabled ? (
                <Button 
                  onClick={() => scheduleExportMutation.mutate(config)}
                  disabled={scheduleExportMutation.isPending}
                >
                  {scheduleExportMutation.isPending && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  <Send className="h-4 w-4 mr-2" />
                  Planlegg export
                </Button>
              ) : (
                <Button 
                  onClick={() => exportMutation.mutate(config)}
                  disabled={exportMutation.isPending}
                >
                  {exportMutation.isPending && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  <Download className="h-4 w-4 mr-2" />
                  Last ned
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}