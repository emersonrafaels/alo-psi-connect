import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { Search, RotateCcw } from 'lucide-react';
import { WebhookField } from './WebhookFieldItem';
import { WebhookFieldCategory } from './WebhookFieldCategory';
import { WebhookPayloadPreview } from './WebhookPayloadPreview';

interface WebhookFieldBuilderProps {
  type: 'booking' | 'payment';
  availableFields: WebhookField[];
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
  template: string;
  onTemplateChange: (template: string) => void;
}

export const WebhookFieldBuilder = ({
  type,
  availableFields,
  selectedFields,
  onFieldsChange,
  template,
  onTemplateChange
}: WebhookFieldBuilderProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter fields by search query
  const filteredFields = useMemo(() => {
    if (!searchQuery) return availableFields;
    const query = searchQuery.toLowerCase();
    return availableFields.filter(field =>
      field.label.toLowerCase().includes(query) ||
      field.description.toLowerCase().includes(query) ||
      field.variable.toLowerCase().includes(query)
    );
  }, [availableFields, searchQuery]);

  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    const grouped: Record<string, WebhookField[]> = {
      appointment: [],
      patient: [],
      professional: [],
      payment: [],
      system: []
    };
    filteredFields.forEach(field => {
      grouped[field.category].push(field);
    });
    return grouped;
  }, [filteredFields]);

  // Generate template from selected fields
  const generateTemplate = (fields: string[]) => {
    const selectedFieldObjects = availableFields.filter(f => fields.includes(f.key));
    const payload: any = {
      event: type === 'booking' ? 'appointment_created' : 'payment_updated'
    };

    selectedFieldObjects.forEach(field => {
      const parts = field.variable.replace(/[{}]/g, '').split('.');
      let current = payload;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = field.variable;
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      });
    });

    return JSON.stringify(payload, null, 2);
  };

  const handleToggleField = (key: string) => {
    const field = availableFields.find(f => f.key === key);
    if (field?.required) return; // Can't toggle required fields

    const newFields = selectedFields.includes(key)
      ? selectedFields.filter(f => f !== key)
      : [...selectedFields, key];
    
    onFieldsChange(newFields);
    const newTemplate = generateTemplate(newFields);
    onTemplateChange(newTemplate);
  };

  const handleRestoreDefaults = () => {
    const defaultFields = availableFields
      .filter(f => f.required || ['appointment.id', 'appointment.nome_paciente', 'appointment.email_paciente'].includes(f.key))
      .map(f => f.key);
    onFieldsChange(defaultFields);
    const newTemplate = generateTemplate(defaultFields);
    onTemplateChange(newTemplate);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Field Selection */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campos Disponíveis</CardTitle>
            <CardDescription className="text-xs">
              Selecione os campos que deseja enviar ao webhook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar campos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Restore Defaults Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestoreDefaults}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrão
            </Button>

            {/* Categories */}
            <Accordion type="multiple" defaultValue={['appointment', 'patient']} className="space-y-2">
              {Object.entries(fieldsByCategory).map(([category, fields]) => (
                fields.length > 0 && (
                  <WebhookFieldCategory
                    key={category}
                    category={category as any}
                    fields={fields}
                    selectedFields={selectedFields}
                    onToggleField={handleToggleField}
                  />
                )
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Preview */}
      <div>
        <WebhookPayloadPreview template={template} />
      </div>
    </div>
  );
};
