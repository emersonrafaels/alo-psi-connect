import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { WebhookField, WebhookFieldItem } from './WebhookFieldItem';
import { Calendar, User, Briefcase, CreditCard, Settings } from 'lucide-react';

interface WebhookFieldCategoryProps {
  category: 'appointment' | 'patient' | 'professional' | 'payment' | 'system';
  fields: WebhookField[];
  selectedFields: string[];
  onToggleField: (key: string) => void;
}

const categoryConfig = {
  appointment: {
    icon: Calendar,
    label: 'Agendamento',
    description: 'Dados da consulta agendada'
  },
  patient: {
    icon: User,
    label: 'Paciente',
    description: 'Informações do paciente'
  },
  professional: {
    icon: Briefcase,
    label: 'Profissional',
    description: 'Dados do profissional'
  },
  payment: {
    icon: CreditCard,
    label: 'Pagamento',
    description: 'Informações de pagamento'
  },
  system: {
    icon: Settings,
    label: 'Sistema',
    description: 'Metadados do sistema'
  }
};

export const WebhookFieldCategory = ({ 
  category, 
  fields, 
  selectedFields, 
  onToggleField 
}: WebhookFieldCategoryProps) => {
  const config = categoryConfig[category];
  const Icon = config.icon;
  const selectedCount = fields.filter(f => selectedFields.includes(f.key)).length;

  return (
    <AccordionItem value={category} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{config.label}</p>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {selectedCount}/{fields.length} selecionados
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4 space-y-2">
        {fields.map(field => (
          <WebhookFieldItem
            key={field.key}
            field={field}
            checked={selectedFields.includes(field.key)}
            onToggle={onToggleField}
            disabled={field.required}
          />
        ))}
      </AccordionContent>
    </AccordionItem>
  );
};
