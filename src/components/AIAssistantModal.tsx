import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Send, User, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAIAssistantConfig } from "@/hooks/useAIAssistantConfig";
import { usePublicConfig } from "@/hooks/usePublicConfig";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { useUserProfile } from "@/hooks/useUserProfile";
import ReactMarkdown from "react-markdown";
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
interface AIAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionals?: any[];
}
export const AIAssistantModal = ({
  open,
  onOpenChange,
  professionals
}: AIAssistantModalProps) => {
  const navigate = useNavigate();
  const { getConfig } = usePublicConfig(['n8n']); // Public access to N8N chat configs
  const {
    aiConfig
  } = useAIAssistantConfig(); // For AI assistant display configs
  const {
    user
  } = useAuth();
  const { tenant } = useTenant();
  const { profile } = useUserProfile();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset messages when modal opens or config changes
  useEffect(() => {
    if (open) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: aiConfig.initialMessage,
        timestamp: new Date()
      }]);
    }
  }, [aiConfig.initialMessage, open]);

  // Fetch phone if user is professional
  useEffect(() => {
    const fetchUserPhone = async () => {
      if (!profile) {
        setUserPhone(null);
        return;
      }

      // If professional, fetch phone from profissionais table
      if (profile.tipo_usuario === 'profissional') {
        const { data } = await supabase
          .from('profissionais')
          .select('telefone')
          .eq('profile_id', profile.id)
          .maybeSingle();
        
        setUserPhone(data?.telefone || null);
      } else {
        setUserPhone(null);
      }
    };

    fetchUserPhone();
  }, [profile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Buscar configuração do N8N
      const n8nEnabled = getConfig('n8n', 'chat_enabled', false);
      const useProduction = getConfig('n8n', 'chat_use_production', false);
      const webhookUrl = useProduction 
        ? getConfig('n8n', 'chat_webhook_url_prod', '')
        : getConfig('n8n', 'chat_webhook_url_test', '');

      if (!n8nEnabled) {
        throw new Error('N8N Chat não está habilitado. Configure nas configurações do sistema.');
      }

      if (!webhookUrl) {
        throw new Error('URL do webhook N8N não configurada. Configure nas configurações do sistema.');
      }

      // Buscar configurações adicionais do N8N
      const chatChannel = getConfig('n8n', 'chat_channel', 'medcos_match');
      const medcosMatch = getConfig('n8n', 'chat_medcos_match', true);
      const customFields = getConfig('n8n', 'chat_custom_fields', []) as { key: string; value: string }[];

      // Payload com dados do usuário
      const payload: any = {
        user_id: user?.id || null,
        session_id: sessionId,
        tenant_id: tenant?.id,
        tenant_slug: tenant?.slug,
        message: inputMessage,
        timestamp: new Date().toISOString(),
        // User data (automatic)
        user_name: profile?.nome || null,
        user_email: profile?.email || null,
        user_phone: userPhone || null,
        // Additional fields
        channel: chatChannel,
        medcos_match: medcosMatch
      };

      // Add custom fields
      customFields.forEach((field: { key: string; value: string }) => {
        if (field.key.trim()) {
          payload[field.key] = field.value;
        }
      });

      console.log(`[Match] Enviando para N8N (${useProduction ? 'PROD' : 'TEST'}):`, webhookUrl);
      console.log('[Match] Payload:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`N8N respondeu com status ${response.status}`);
      }

      const data = await response.json();

      console.log('[AI Assistant] Resposta bruta do N8N:', data);

      // Função para extrair resposta de forma robusta (recursiva)
      const extractResponse = (responseData: any, depth: number = 0): string => {
        // Prevenir recursão infinita
        if (depth > 5) {
          return 'Sem resposta do assistente.';
        }

        // Se for array, pegar primeiro elemento
        let result = Array.isArray(responseData) ? responseData[0] : responseData;
        
        // Se for string, tentar fazer parse
        if (typeof result === 'string') {
          try {
            result = JSON.parse(result);
          } catch {
            return result; // Se não for JSON válido, retornar como está
          }
        }
        
        // Se ainda for array após parse, pegar primeiro elemento
        if (Array.isArray(result)) {
          result = result[0];
        }
        
        // Extrair a resposta do objeto (recursivamente)
        if (typeof result === 'object' && result !== null) {
          const extracted = result.response || result.message || result.output || result.text;
          
          // Se encontrou um valor, verificar se ainda é objeto
          if (extracted !== undefined) {
            // Se for string, retornar
            if (typeof extracted === 'string') {
              return extracted;
            }
            // Se for objeto, continuar extraindo recursivamente
            if (typeof extracted === 'object') {
              return extractResponse(extracted, depth + 1);
            }
          }
          
          return 'Sem resposta do assistente.';
        }
        
        return String(result) || 'Sem resposta do assistente.';
      };

      const assistantContent = extractResponse(data);

      console.log('[AI Assistant] Conteúdo extraído:', assistantContent);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('[Match] Erro:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Erro ao processar sua mensagem: ${error.message}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Erro no assistente",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col" aria-describedby="ai-assistant-description">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-primary">
                <AvatarFallback className="text-white">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">
                  {aiConfig.title}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {aiConfig.subtitle}
                </p>
              </div>
            </div>
            
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map(message => <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && <Avatar className="h-8 w-8 bg-primary flex-shrink-0">
                    <AvatarFallback className="text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>}
                
                <div className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'}`}>
                  {message.role === 'assistant' ? <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-li:text-foreground">
                      <ReactMarkdown components={{
                  a: ({
                    href,
                    children
                  }) => {
                    // Check if it's an internal link (starts with /)
                    const isInternalLink = href?.startsWith('/');
                    if (isInternalLink) {
                      return <a href={href} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-all duration-200 no-underline hover:scale-105 border border-primary/20" onClick={e => {
                        e.preventDefault();
                        navigate(href || '/');
                      }}>
                                  {children}
                                  <span className="text-xs">→</span>
                                </a>;
                    }
                    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium decoration-2 underline-offset-2">
                                {children}
                              </a>;
                  },
                  h3: ({
                    children
                  }) => <h3 className="text-lg font-bold text-foreground mt-4 mb-2 flex items-center gap-2">
                              {children}
                            </h3>,
                  ul: ({
                    children
                  }) => <ul className="space-y-1 my-2">
                              {children}
                            </ul>,
                  li: ({
                    children
                  }) => <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{children}</span>
                            </li>,
                  hr: () => <hr className="my-4 border-border" />,
                  strong: ({
                    children
                  }) => <strong className="font-semibold text-foreground">
                              {children}
                            </strong>,
                  p: ({
                    children
                  }) => <p className="mb-2 leading-relaxed">
                              {children}
                            </p>
                }}>
                        {message.content}
                      </ReactMarkdown>
                    </div> : <p className="text-sm">{message.content}</p>}
                  <span className="text-xs opacity-70 mt-1 block">
                    {formatTime(message.timestamp)}
                  </span>
                </div>

                {message.role === 'user' && <Avatar className="h-8 w-8 bg-secondary flex-shrink-0">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>}
              </div>)}
            
            {isLoading && <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 bg-primary flex-shrink-0">
                  <AvatarFallback className="text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              </div>}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex gap-2">
            <Input value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Digite sua mensagem..." disabled={isLoading} className="flex-1" />
            <Button onClick={sendMessage} disabled={!inputMessage.trim() || isLoading} className="btn-gradient">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p id="ai-assistant-description" className="text-xs text-muted-foreground mt-2 text-center">
            💡 Dica: Seja específico sobre suas necessidades para receber recomendações mais precisas
          </p>
        </div>
      </DialogContent>
    </Dialog>;
};